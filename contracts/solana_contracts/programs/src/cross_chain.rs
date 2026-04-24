use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeRouter<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + CrossChainRouter::INIT_SPACE,
        seeds = [b"router".as_ref()],
        bump
    )]
    pub router: Account<'info, CrossChainRouter>,
    pub admin: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(chain_id: u32)]
pub struct SetChainSupport<'info> {
    #[account(mut, seeds = [b"router".as_ref()], bump = router.bump)]
    pub router: Account<'info, CrossChainRouter>,
    pub admin: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitiateTransfer<'info> {
    #[account(mut, seeds = [b"router".as_ref()], bump = router.bump)]
    pub router: Account<'info, CrossChainRouter>,
    pub sender: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(InitSpace)]
pub struct CrossChainRouter {
    pub admin: Pubkey,
    pub chain_id: u32,
    pub bridge_fee: u64,
    pub slippage_tolerance: u64,
    pub paused: bool,
    pub bump: u8,
    #[max_len(20)]
    pub supported_chains: Vec<u32>,
    #[max_len(50)]
    pub chain_mapping: Vec<(u32, Pubkey)>,
}

impl CrossChainRouter {
    const INIT_SPACE: usize = 32 + 4 + 8 + 8 + 1 + 1 + (4 + 100) + (4 + 500);
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum ChainId {
    Ethereum = 0,
    Polygon = 1,
    Arbitrum = 2,
    Optimism = 3,
    Avalanche = 4,
    Bsc = 5,
    Near = 6,
    Solana = 7,
}

#[event]
pub struct RouterInitializedEvent {
    pub router: Pubkey,
    pub admin: Pubkey,
}

#[event]
pub struct ChainSupportUpdatedEvent {
    pub chain_id: u32,
    pub supported: bool,
}

#[event]
pub struct TransferInitiatedEvent {
    pub message_id: [u8; 32],
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub destination_chain: u32,
}

#[event]
pub struct TransferExecutedEvent {
    pub message_id: [u8; 32],
    pub recipient: Pubkey,
    pub amount: u64,
}

#[error_code]
pub enum CrossChainError {
    #[msg("Unsupported chain")]
    UnsupportedChain,
    #[msg("Invalid recipient")]
    InvalidRecipient,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Insufficient bridge fee")]
    InsufficientFee,
    #[msg("Contract paused")]
    Paused,
    #[msg("Slippage exceeded")]
    SlippageExceeded,
    #[msg("Already executed")]
    AlreadyExecuted,
    #[msg("Only owner")]
    OnlyOwner,
}

const BPS_DENOMINATOR: u64 = 10000;

pub fn initialize_router(ctx: Context<InitializeRouter>) -> Result<()> {
    let router = &mut ctx.accounts.router;
    router.admin = ctx.accounts.admin.key();
    router.chain_id = 0;
    router.bridge_fee = 5000;
    router.slippage_tolerance = 50;
    router.paused = false;
    router.bump = ctx.bumps.get("router").copied().unwrap_or(1);
    router.supported_chains = vec![];
    router.chain_mapping = vec![];

    emit!(RouterInitializedEvent {
        router: router.key(),
        admin: router.admin,
    });
    Ok(())
}

pub fn set_chain_support(ctx: Context<SetChainSupport>, chain_id: u32, supported: bool) -> Result<()> {
    let router = &mut ctx.accounts.router;
    require!(router.admin == ctx.accounts.admin.key(), CrossChainError::OnlyOwner);
    
    if supported {
        if !router.supported_chains.contains(&chain_id) {
            router.supported_chains.push(chain_id);
        }
    } else {
        router.supported_chains.retain(|&x| x != chain_id);
    }

    emit!(ChainSupportUpdatedEvent {
        chain_id,
        supported,
    });
    Ok(())
}

pub fn set_bridge_fee(ctx: Context<SetChainSupport>, new_fee: u64) -> Result<()> {
    let router = &mut ctx.accounts.router;
    require!(router.admin == ctx.accounts.admin.key(), CrossChainError::OnlyOwner);
    
    router.bridge_fee = new_fee;
    Ok(())
}

pub fn set_slippage_tolerance(ctx: Context<SetChainSupport>, tolerance: u64) -> Result<()> {
    let router = &mut ctx.accounts.router;
    require!(router.admin == ctx.accounts.admin.key(), CrossChainError::OnlyOwner);
    require!(tolerance <= BPS_DENOMINATOR, CrossChainError::SlippageExceeded);
    
    router.slippage_tolerance = tolerance;
    Ok(())
}

pub fn emergency_halt(ctx: Context<SetChainSupport>) -> Result<()> {
    let router = &mut ctx.accounts.router;
    require!(router.admin == ctx.accounts.admin.key(), CrossChainError::OnlyOwner);
    
    router.paused = true;
    Ok(())
}

pub fn resume(ctx: Context<SetChainSupport>) -> Result<()> {
    let router = &mut ctx.accounts.router;
    require!(router.admin == ctx.accounts.admin.key(), CrossChainError::OnlyOwner);
    
    router.paused = false;
    Ok(())
}

pub fn get_min_received(amount: u64, tolerance: u64) -> Result<u64> {
    Ok(amount * (BPS_DENOMINATOR - tolerance) / BPS_DENOMINATOR)
}