use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitOracle<'info> {
    #[account(
        init,
        payer = updater,
        space = 8 + PriceOracle::INIT_SPACE,
        seeds = [b"oracle".as_ref()],
        bump
    )]
    pub oracle: Account<'info, PriceOracle>,
    pub updater: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    #[account(mut, seeds = [b"oracle".as_ref()], bump = oracle.bump)]
    pub oracle: Account<'info, PriceOracle>,
    pub updater: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ConfirmPendingPrice<'info> {
    #[account(mut, seeds = [b"oracle".as_ref()], bump = oracle.bump)]
    pub oracle: Account<'info, PriceOracle>,
    pub updater: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct PriceOracle {
    pub admin: Pubkey,
    pub price: u64,
    pub updated_at: i64,
    pub is_set: bool,
    pub bump: u8,
    pub pending_price: u64,
    pub pending_timestamp: i64,
    pub paused: bool,
}

impl PriceOracle {
    const INIT_SPACE: usize = 32 + 8 + 8 + 1 + 1 + 8 + 8 + 1;
}

#[event]
pub struct PriceUpdatedEvent {
    pub oracle: Pubkey,
    pub price: u64,
    pub updated_at: i64,
}

#[event]
pub struct PricePendingEvent {
    pub oracle: Pubkey,
    pub pending_price: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum OracleError {
    #[msg("Only owner")]
    OnlyOwner,
    #[msg("Invalid token")]
    InvalidToken,
    #[msg("Price must be positive")]
    InvalidPrice,
    #[msg("Delay not elapsed")]
    DelayNotElapsed,
    #[msg("No pending price")]
    NoPendingPrice,
    #[msg("Contract paused")]
    Paused,
}

const PRICE_UPDATE_DELAY: i64 = 60 * 60;

pub fn init_oracle(ctx: Context<InitOracle>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    oracle.admin = ctx.accounts.updater.key();
    oracle.price = 0;
    oracle.updated_at = ctx.accounts.clock.unix_timestamp();
    oracle.is_set = false;
    oracle.bump = ctx.bumps.get("oracle").copied().unwrap_or(1);
    oracle.pending_price = 0;
    oracle.pending_timestamp = 0;
    oracle.paused = false;

    emit!(PriceUpdatedEvent {
        oracle: oracle.key(),
        price: 0,
        updated_at: oracle.updated_at,
    });
    Ok(())
}

pub fn set_price(ctx: Context<SetPrice>, price: u64) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    require!(oracle.admin == ctx.accounts.updater.key(), OracleError::OnlyOwner);
    require!(price > 0, OracleError::InvalidPrice);
    require!(!oracle.paused, OracleError::Paused);

    let clock = ctx.accounts.clock.unix_timestamp();

    oracle.pending_price = price;
    oracle.pending_timestamp = clock;

    emit!(PricePendingEvent {
        oracle: oracle.key(),
        pending_price: price,
        timestamp: clock,
    });
    Ok(())
}

pub fn confirm_price(ctx: Context<ConfirmPendingPrice>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    require!(oracle.admin == ctx.accounts.updater.key(), OracleError::OnlyOwner);
    require!(oracle.pending_price > 0, OracleError::NoPendingPrice);

    let clock = Clock::get()?.unix_timestamp;
    require!(clock >= oracle.pending_timestamp + PRICE_UPDATE_DELAY, OracleError::DelayNotElapsed);

    oracle.price = oracle.pending_price;
    oracle.updated_at = clock;
    oracle.is_set = true;
    oracle.pending_price = 0;
    oracle.pending_timestamp = 0;

    emit!(PriceUpdatedEvent {
        oracle: oracle.key(),
        price: oracle.price,
        updated_at: clock,
    });
    Ok(())
}

pub fn get_price(ctx: Context<ConfirmPendingPrice>) -> Result<u64> {
    let oracle = &ctx.accounts.oracle;
    require!(oracle.is_set, OracleError::NoPendingPrice);
    Ok(oracle.price)
}

pub fn get_price_or_fallback(ctx: Context<ConfirmPendingPrice>, fallback: u64) -> Result<u64> {
    let oracle = &ctx.accounts.oracle;
    if oracle.is_set {
        return Ok(oracle.price);
    }
    Ok(fallback)
}

pub fn pause_oracle(ctx: Context<SetPrice>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    require!(oracle.admin == ctx.accounts.updater.key(), OracleError::OnlyOwner);
    oracle.paused = true;
    Ok(())
}

pub fn unpause_oracle(ctx: Context<SetPrice>) -> Result<()> {
    let oracle = &mut ctx.accounts.oracle;
    require!(oracle.admin == ctx.accounts.updater.key(), OracleError::OnlyOwner);
    oracle.paused = false;
    Ok(())
}