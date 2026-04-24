use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitGovernanceToken<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + GovernanceToken::INIT_SPACE,
        seeds = [b"governance".as_ref()],
        bump
    )]
    pub governance: Account<'info, GovernanceToken>,
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Stake::INIT_SPACE,
        seeds = [b"stake".as_ref(), owner.key().as_ref()],
        bump
    )]
    pub stake: Account<'info, Stake>,
    pub governance: Account<'info, GovernanceToken>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct GovernanceToken {
    pub admin: Pubkey,
    pub mint: Pubkey,
    pub total_staked: u64,
    pub bump: u8,
}

impl GovernanceToken {
    const INIT_SPACE: usize = 32 + 32 + 8 + 1;
}

#[account]
#[derive(InitSpace)]
pub struct Stake {
    pub owner: Pubkey,
    pub amount: u64,
    pub bump: u8,
}

impl Stake {
    const INIT_SPACE: usize = 32 + 8 + 1;
}

#[event]
pub struct GovernanceInitializedEvent {
    pub governance: Pubkey,
    pub mint: Pubkey,
}

#[event]
pub struct TokensStakedEvent {
    pub stake: Pubkey,
    pub owner: Pubkey,
    pub amount: u64,
}

pub fn init_governance_token(ctx: Context<InitGovernanceToken>, mint: Pubkey) -> Result<()> {
    let governance = &mut ctx.accounts.governance;
    governance.admin = ctx.accounts.admin.key();
    governance.mint = mint;
    governance.total_staked = 0;
    governance.bump = ctx.bumps.get("governance").copied().unwrap_or(1);

    emit!(GovernanceInitializedEvent {
        governance: governance.key(),
        mint,
    });
    Ok(())
}

pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
    let stake = &mut ctx.accounts.stake;
    let governance = &mut ctx.accounts.governance;

    stake.owner = ctx.accounts.owner.key();
    stake.amount += amount;
    stake.bump = ctx.bumps.get("stake").copied().unwrap_or(1);

    governance.total_staked += amount;

    emit!(TokensStakedEvent {
        stake: stake.key(),
        owner: ctx.accounts.owner.key(),
        amount,
    });
    Ok(())
}