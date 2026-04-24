use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(intent_id: String)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow".as_ref(), intent_id.as_bytes()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FundEscrow<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), escrow.intent_id.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct AssignExecutor<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), escrow.intent_id.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), escrow.intent_id.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub executor: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), escrow.intent_id.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct RaiseDisputeEscrow<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), escrow.intent_id.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub disputer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDisputeEscrow<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), escrow.intent_id.as_bytes()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub resolver: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub requester: Pubkey,
    pub executor: Pubkey,
    pub token: Pubkey,
    pub deadline: i64,
    pub amount: u64,
    pub fee: u64,
    pub completion_time: i64,
    pub status: EscrowStatus,
    #[max_len(64)]
    pub intent_id: String,
    pub bump: u8,
}

impl Escrow {
    const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + (4 + 64) + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum EscrowStatus {
    None,
    Funded,
    Assigned,
    Completed,
    Disputed,
    Released,
    Refunded,
    Expired,
}

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub requester: Pubkey,
    pub amount: u64,
    pub fee: u64,
}

#[event]
pub struct EscrowFunded {
    pub escrow: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ExecutorAssigned {
    pub escrow: Pubkey,
    pub executor: Pubkey,
}

#[event]
pub struct TaskCompleted {
    pub escrow: Pubkey,
    pub proof: [u8; 32],
}

#[event]
pub struct FundsReleased {
    pub escrow: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FundsRefunded {
    pub escrow: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DisputeRaisedEscrow {
    pub escrow: Pubkey,
    pub raiser: Pubkey,
    pub reason: String,
}

#[event]
pub struct DisputeResolvedEscrow {
    pub escrow: Pubkey,
    pub refund_to_requester: bool,
}

#[error_code]
pub enum EscrowError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid status")]
    InvalidStatus,
    #[msg("Deadline passed")]
    DeadlinePassed,
}

const FEE_BASIS_POINTS: u64 = 250;
const MIN_DEADLINE: i64 = 300;
const AUTO_RELEASE_DELAY: i64 = 24 * 60 * 60;

pub fn create_escrow(
    ctx: Context<CreateEscrow>,
    intent_id: String,
    amount: u64,
    duration: i64,
) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = ctx.accounts.clock.unix_timestamp();

    require!(amount > 0, EscrowError::InvalidStatus);
    require!(duration >= MIN_DEADLINE, EscrowError::InvalidStatus);

    let fee = (amount * FEE_BASIS_POINTS) / 10000;
    let deadline = clock + duration;

    escrow.requester = ctx.accounts.requester.key();
    escrow.executor = Pubkey::default();
    escrow.token = Pubkey::default();
    escrow.deadline = deadline;
    escrow.amount = amount;
    escrow.fee = fee;
    escrow.completion_time = 0;
    escrow.status = EscrowStatus::None;
    escrow.intent_id = intent_id;
    escrow.bump = ctx.bumps.get("escrow").copied().unwrap_or(1);

    emit!(EscrowCreated {
        escrow: escrow.key(),
        requester: ctx.accounts.requester.key(),
        amount,
        fee,
    });
    Ok(())
}

pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.requester != Pubkey::default(), EscrowError::InvalidStatus);
    require!(escrow.status == EscrowError::InvalidStatus || escrow.status == EscrowStatus::None, EscrowError::InvalidStatus);

    escrow.status = EscrowStatus::Funded;

    emit!(EscrowFunded {
        escrow: escrow.key(),
        funder: ctx.accounts.requester.key(),
        amount: escrow.amount,
    });
    Ok(())
}

pub fn assign_executor(ctx: Context<AssignExecutor>, executor: Pubkey) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.requester == ctx.accounts.requester.key(), EscrowError::Unauthorized);
    require!(escrow.status == EscrowStatus::Funded, EscrowError::InvalidStatus);

    escrow.executor = executor;
    escrow.status = EscrowStatus::Assigned;

    emit!(ExecutorAssigned {
        escrow: escrow.key(),
        executor,
    });
    Ok(())
}

pub fn complete_task(ctx: Context<CompleteTask>, proof: Vec<u8>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let clock = ctx.accounts.clock.unix_timestamp();

    require!(escrow.executor == ctx.accounts.executor.key(), EscrowError::Unauthorized);
    require!(escrow.status == EscrowStatus::Assigned, EscrowError::InvalidStatus);
    require!(clock <= escrow.deadline, EscrowError::DeadlinePassed);

    escrow.completion_time = clock;
    escrow.status = EscrowStatus::Completed;

    let mut proof_hash = [0u8; 32];
    if !proof.is_empty() {
        let len = proof.len().min(32);
        proof_hash[..len].copy_from_slice(&proof[..len]);
    }

    emit!(TaskCompleted {
        escrow: escrow.key(),
        proof: proof_hash,
    });
    Ok(())
}

pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.requester == ctx.accounts.requester.key(), EscrowError::Unauthorized);
    require!(escrow.status == EscrowStatus::Completed, EscrowError::InvalidStatus);
    require!(escrow.executor != Pubkey::default(), EscrowError::Unauthorized);

    escrow.status = EscrowStatus::Released;

    emit!(FundsReleased {
        escrow: escrow.key(),
        recipient: escrow.executor,
        amount: escrow.amount,
    });
    Ok(())
}

pub fn auto_release(ctx: Context<CompleteTask>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.status == EscrowStatus::Completed, EscrowError::InvalidStatus);
    require!(escrow.completion_time > 0, EscrowError::InvalidStatus);
    
    let clock = Clock::get()?.unix_timestamp;
    require!(clock >= escrow.completion_time + AUTO_RELEASE_DELAY, EscrowError::InvalidStatus);

    escrow.status = EscrowStatus::Released;

    emit!(FundsReleased {
        escrow: escrow.key(),
        recipient: escrow.executor,
        amount: escrow.amount,
    });
    Ok(())
}

pub fn raise_dispute_escrow(ctx: Context<RaiseDisputeEscrow>, reason: String) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    let caller = ctx.accounts.disputer.key();
    require!(caller == escrow.requester || caller == escrow.executor, EscrowError::Unauthorized);
    require!(escrow.status == EscrowStatus::Assigned || escrow.status == EscrowStatus::Completed, EscrowError::InvalidStatus);

    escrow.status = EscrowStatus::Disputed;

    emit!(DisputeRaisedEscrow {
        escrow: escrow.key(),
        raiser: caller,
        reason,
    });
    Ok(())
}

pub fn resolve_dispute_escrow(ctx: Context<ResolveDisputeEscrow>, refund_to_requester: bool) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.status == EscrowStatus::Disputed, EscrowError::InvalidStatus);

    if refund_to_requester {
        escrow.status = EscrowStatus::Refunded;
    } else {
        escrow.status = EscrowStatus::Released;
    }

    emit!(DisputeResolvedEscrow {
        escrow: escrow.key(),
        refund_to_requester,
    });
    Ok(())
}

pub fn expire_and_refund(ctx: Context<FundEscrow>) -> Result<()> {
    let escrow = &mut ctx.accounts.escrow;
    require!(escrow.requester == ctx.accounts.requester.key(), EscrowError::Unauthorized);
    require!(escrow.status == EscrowStatus::Funded || escrow.status == EscrowStatus::None, EscrowError::InvalidStatus);
    
    let clock = Clock::get()?.unix_timestamp;
    require!(clock > escrow.deadline, EscrowError::InvalidStatus);

    escrow.status = EscrowStatus::Expired;

    emit!(FundsRefunded {
        escrow: escrow.key(),
        recipient: escrow.requester,
        amount: escrow.amount,
    });
    Ok(())
}