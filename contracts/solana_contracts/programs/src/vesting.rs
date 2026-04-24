use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

#[derive(Accounts)]
#[instruction(beneficiary: Pubkey)]
pub struct CreateVesting<'info> {
    #[account(
        init,
        payer = funder,
        space = 8 + Vesting::INIT_SPACE,
        seeds = [b"vesting".as_ref(), beneficiary.as_ref()],
        bump
    )]
    pub vesting: Account<'info, Vesting>,
    pub funder: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseVesting<'info> {
    #[account(mut, seeds = [b"vesting".as_ref(), vesting.beneficiary.as_ref()], bump = vesting.bump)]
    pub vesting: Account<'info, Vesting>,
    pub beneficiary: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Vesting {
    pub beneficiary: Pubkey,
    pub total_amount: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub released: u64,
    pub revoked: bool,
    pub bump: u8,
}

impl Vesting {
    const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[event]
pub struct VestingCreatedEvent {
    pub vesting: Pubkey,
    pub beneficiary: Pubkey,
    pub total_amount: u64,
}

#[event]
pub struct VestingReleasedEvent {
    pub vesting: Pubkey,
    pub beneficiary: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum VestingError {
    #[msg("Not authorized")]
    NotAuthorized,
    #[msg("Nothing to release")]
    NothingToRelease,
    #[msg("Already revoked")]
    AlreadyRevoked,
    #[msg("Cliff not reached")]
    CliffNotReached,
    #[msg("Invalid beneficiary")]
    InvalidBeneficiary,
}

const VESTING_PERIOD: i64 = 365 * 24 * 60 * 60;
const CLIFF_PERIOD: i64 = 90 * 24 * 60 * 60;

pub fn create_vesting(
    ctx: Context<CreateVesting>,
    beneficiary: Pubkey,
    total_amount: u64,
    start_time: i64,
) -> Result<()> {
    let vesting = &mut ctx.accounts.vesting;
    require!(beneficiary != Pubkey::default(), VestingError::InvalidBeneficiary);
    require!(total_amount > 0, VestingError::NothingToRelease);

    let end_time = start_time + VESTING_PERIOD;

    vesting.beneficiary = beneficiary;
    vesting.total_amount = total_amount;
    vesting.start_time = start_time;
    vesting.end_time = end_time;
    vesting.released = 0;
    vesting.revoked = false;
    vesting.bump = ctx.bumps.get("vesting").copied().unwrap_or(1);

    emit!(VestingCreatedEvent {
        vesting: vesting.key(),
        beneficiary,
        total_amount,
    });
    Ok(())
}

pub fn release_vesting(ctx: Context<ReleaseVesting>) -> Result<()> {
    let vesting = &mut ctx.accounts.vesting;
    require!(vesting.beneficiary == ctx.accounts.beneficiary.key(), VestingError::NotAuthorized);
    require!(!vesting.revoked, VestingError::AlreadyRevoked);

    let releasable = compute_releasable(vesting)?;
    require!(releasable > 0, VestingError::NothingToRelease);

    vesting.released += releasable;

    emit!(VestingReleasedEvent {
        vesting: vesting.key(),
        beneficiary: vesting.beneficiary,
        amount: releasable,
    });
    Ok(())
}

pub fn compute_releasable(vesting: &Vesting) -> Result<u64> {
    if vesting.revoked {
        return Ok(0);
    }
    
    let vested = compute_vested(vesting)?;
    Ok(vested.saturating_sub(vesting.released))
}

pub fn compute_vested(vesting: &Vesting) -> Result<u64> {
    let clock = Clock::get()?.unix_timestamp;
    
    if clock < vesting.start_time + CLIFF_PERIOD {
        return Ok(0);
    }
    if clock >= vesting.end_time {
        return Ok(vesting.total_amount);
    }
    
    let time_vested = clock - vesting.start_time - CLIFF_PERIOD;
    let vesting_duration = VESTING_PERIOD - CLIFF_PERIOD;
    
    Ok((vesting.total_amount * time_vested as u64) / vesting_duration as u64)
}

pub fn revoke_vesting(ctx: Context<ReleaseVesting>) -> Result<()> {
    let vesting = &mut ctx.accounts.vesting;
    require!(!vesting.revoked, VestingError::AlreadyRevoked);

    let releasable = compute_releasable(vesting)?;
    vesting.released += releasable;
    vesting.revoked = true;

    emit!(VestingReleasedEvent {
        vesting: vesting.key(),
        beneficiary: vesting.beneficiary,
        amount: releasable,
    });
    Ok(())
}