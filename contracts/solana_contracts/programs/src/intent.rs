use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(intent_id: String)]
pub struct CreateIntent<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + KubernaIntent::INIT_SPACE,
        seeds = [b"intent".as_ref(), intent_id.as_bytes()],
        bump
    )]
    pub intent: Account<'info, KubernaIntent>,
    pub requester: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(bid_id: String)]
pub struct SubmitBid<'info> {
    #[account(mut, seeds = [b"intent".as_ref(), intent.intent_id.as_bytes()], bump = intent.bump)]
    pub intent: Account<'info, KubernaIntent>,
    #[account(
        init,
        payer = agent,
        space = 8 + Bid::INIT_SPACE,
        seeds = [b"bid".as_ref(), bid_id.as_bytes()],
        bump
    )]
    pub bid: Account<'info, Bid>,
    pub agent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptBid<'info> {
    #[account(mut, seeds = [b"intent".as_ref(), intent.intent_id.as_bytes()], bump = intent.bump)]
    pub intent: Account<'info, KubernaIntent>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteIntent<'info> {
    #[account(mut, seeds = [b"intent".as_ref(), intent.intent_id.as_bytes()], bump = intent.bump)]
    pub intent: Account<'info, KubernaIntent>,
    pub executor: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct KubernaIntent {
    pub requester: Pubkey,
    #[max_len(256)]
    pub description: String,
    pub source_token: Pubkey,
    pub source_amount: u64,
    pub dest_token: Pubkey,
    pub min_dest_amount: u64,
    pub budget: u64,
    pub deadline: i64,
    pub status: IntentStatus,
    pub selected_solver: Option<Pubkey>,
    pub escrow_id: Option<[u8; 32]>,
    #[max_len(64)]
    pub intent_id: String,
    pub bump: u8,
    #[max_len(50)]
    pub bids: Vec<Pubkey>,
}

impl KubernaIntent {
    const INIT_SPACE: usize = 32 + (4 + 256) + 32 + 8 + 32 + 8 + 8 + 8 + 1 + 33 + 33 + (4 + 64) + 1 + (4 + 500);
}

#[account]
#[derive(InitSpace)]
pub struct Bid {
    pub solver: Pubkey,
    pub intent: Pubkey,
    pub price: u64,
    pub estimated_time: i64,
    pub bid_id: String,
    pub status: BidStatus,
    pub created_at: i64,
    pub bump: u8,
}

impl Bid {
    const INIT_SPACE: usize = 32 + 32 + 8 + 8 + (4 + 64) + 1 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum IntentStatus {
    Open,
    Bidding,
    Assigned,
    Executing,
    Completed,
    Expired,
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum BidStatus {
    Pending,
    Accepted,
    Rejected,
}

#[event]
pub struct IntentCreatedEvent {
    pub intent: Pubkey,
    pub requester: Pubkey,
    pub budget: u64,
    pub deadline: i64,
}

#[event]
pub struct BidSubmittedEvent {
    pub bid: Pubkey,
    pub intent: Pubkey,
    pub solver: Pubkey,
    pub price: u64,
}

#[event]
pub struct BidAcceptedEvent {
    pub intent: Pubkey,
    pub solver: Pubkey,
}

#[event]
pub struct IntentCompletedEvent {
    pub intent: Pubkey,
}

#[error_code]
pub enum IntentError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Intent not open")]
    NotOpen,
    #[msg("Invalid deadline")]
    InvalidDeadline,
    #[msg("Insufficient budget")]
    InsufficientBudget,
}

const MIN_DEADLINE: i64 = 300;
const MAX_DEADLINE: i64 = 2592000;

pub fn create_intent(
    ctx: Context<CreateIntent>,
    intent_id: String,
    description: String,
    source_token: Pubkey,
    source_amount: u64,
    dest_token: Pubkey,
    min_dest_amount: u64,
    budget: u64,
    duration: i64,
) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    let clock = ctx.accounts.clock.unix_timestamp();
    
    require!(budget > 0, IntentError::InsufficientBudget);
    require!(duration >= MIN_DEADLINE && duration <= MAX_DEADLINE, IntentError::InvalidDeadline);

    let deadline = clock + duration;

    intent.requester = ctx.accounts.requester.key();
    intent.description = description;
    intent.source_token = source_token;
    intent.source_amount = source_amount;
    intent.dest_token = dest_token;
    intent.min_dest_amount = min_dest_amount;
    intent.budget = budget;
    intent.deadline = deadline;
    intent.status = IntentStatus::Open;
    intent.selected_solver = None;
    intent.escrow_id = None;
    intent.intent_id = intent_id;
    intent.bump = ctx.bumps.get("intent").copied().unwrap_or(1);
    intent.bids = vec![];

    emit!(IntentCreatedEvent {
        intent: intent.key(),
        requester: ctx.accounts.requester.key(),
        budget,
        deadline,
    });
    Ok(())
}

pub fn submit_bid(
    ctx: Context<SubmitBid>,
    bid_id: String,
    price: u64,
    estimated_time: i64,
) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    let clock = Clock::get()?.unix_timestamp;
    
    require!(intent.requester != Pubkey::default(), IntentError::Unauthorized);
    require!(clock < intent.deadline, IntentError::InvalidDeadline);
    require!(intent.status == IntentStatus::Open || intent.status == IntentStatus::Bidding, IntentError::NotOpen);

    let bid = &mut ctx.accounts.bid;
    bid.solver = ctx.accounts.agent.key();
    bid.intent = intent.key();
    bid.price = price;
    bid.estimated_time = estimated_time;
    bid.bid_id = bid_id;
    bid.status = BidStatus::Pending;
    bid.created_at = clock;
    bid.bump = ctx.bumps.get("bid").copied().unwrap_or(1);

    intent.bids.push(bid.key());
    if intent.status == IntentStatus::Open {
        intent.status = IntentStatus::Bidding;
    }

    emit!(BidSubmittedEvent {
        bid: bid.key(),
        intent: intent.key(),
        solver: bid.solver,
        price,
    });
    Ok(())
}

pub fn accept_bid(ctx: Context<AcceptBid>, solver: Pubkey) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    require!(intent.requester == ctx.accounts.requester.key(), IntentError::Unauthorized);
    require!(intent.status == IntentStatus::Bidding, IntentError::NotOpen);

    intent.selected_solver = Some(solver);
    intent.status = IntentStatus::Assigned;

    emit!(BidAcceptedEvent {
        intent: intent.key(),
        solver,
    });
    Ok(())
}

pub fn cancel_intent(ctx: Context<CompleteIntent>) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    require!(intent.requester == ctx.accounts.executor.key(), IntentError::Unauthorized);
    require!(intent.status == IntentStatus::Open || intent.status == IntentStatus::Bidding, IntentError::NotOpen);

    intent.status = IntentStatus::Expired;
    Ok(())
}

pub fn complete_intent(ctx: Context<CompleteIntent>) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    let caller = ctx.accounts.executor.key();
    require!(intent.selected_solver == Some(caller) || intent.requester == caller, IntentError::Unauthorized);
    require!(intent.status == IntentStatus::Executing, IntentError::NotOpen);

    intent.status = IntentStatus::Completed;

    emit!(IntentCompletedEvent {
        intent: intent.key(),
    });
    Ok(())
}

pub fn set_escrow(ctx: Context<CompleteIntent>, escrow_id: [u8; 32]) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    let caller = ctx.accounts.executor.key();
    require!(intent.requester == caller || intent.selected_solver == Some(caller), IntentError::Unauthorized);
    require!(intent.status == IntentStatus::Assigned, IntentError::NotOpen);

    intent.escrow_id = Some(escrow_id);
    intent.status = IntentStatus::Executing;
    Ok(())
}

pub fn expire_intent(ctx: Context<CompleteIntent>) -> Result<()> {
    let intent = &mut ctx.accounts.intent;
    let clock = Clock::get()?.unix_timestamp;
    require!(clock >= intent.deadline, IntentError::InvalidDeadline);
    require!(intent.status == IntentStatus::Open || intent.status == IntentStatus::Bidding, IntentError::NotOpen);

    intent.status = IntentStatus::Expired;
    Ok(())
}