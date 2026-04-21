use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateIntent<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + KubernaIntent::INIT_SPACE,
        seeds = [b"intent".as_ref(), intent_id.as_ref()],
        bump
    )]
    pub intent: Account<'info, KubernaIntent>,
    pub requester: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitBid<'info> {
    #[account(mut, seeds = [b"intent".as_ref(), intent_id.as_ref()], bump = intent.bump)]
    pub intent: Account<'info, KubernaIntent>,
    #[account(
        init,
        payer = agent,
        space = 8 + Bid::INIT_SPACE,
        seeds = [b"bid".as_ref(), bid_id.as_ref()],
        bump
    )]
    pub bid: Account<'info, Bid>,
    pub agent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptBid<'info> {
    #[account(mut, seeds = [b"intent".as_ref(), intent_id.as_ref()], bump = intent.bump)]
    pub intent: Account<'info, KubernaIntent>,
    #[account(mut, seeds = [b"bid".as_ref(), bid_id.as_ref()], bump = bid.bump)]
    pub bid: Account<'info, Bid>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteIntent<'info> {
    #[account(mut, seeds = [b"intent".as_ref(), intent_id.as_ref()], bump = intent.bump)]
    pub intent: Account<'info, KubernaIntent>,
    pub executor: Signer<'info>,
}

#[account(0, max_len(64))]
#[derive(InitSpace)]
pub struct KubernaIntent {
    pub requester: Pubkey,
    pub budget: u64,
    pub status: IntentStatus,
    pub selected_bid: Option<Pubkey>,
    pub intent_id: String,
    pub bump: u8,
}

impl KubernaIntent {
    const INIT_SPACE: usize = 32 + 8 + 1 + 32 + (4 + 64) + 1;
}

#[account(0, max_len(64))]
#[derive(InitSpace)]
pub struct Bid {
    pub agent: Pubkey,
    pub intent: Pubkey,
    pub price: u64,
    pub status: BidStatus,
    pub bid_id: String,
    pub bump: u8,
}

impl Bid {
    const INIT_SPACE: usize = 32 + 32 + 8 + 1 + (4 + 64) + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum IntentStatus {
    Open,
    Bidding,
    Assigned,
    Executing,
    Completed,
    Cancelled,
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum BidStatus {
    Pending,
    Accepted,
    Rejected,
}

#[event]
pub struct IntentCreated {
    pub intent: Pubkey,
    pub requester: Pubkey,
    pub budget: u64,
}

#[event]
pub struct BidSubmitted {
    pub bid: Pubkey,
    pub agent: Pubkey,
    pub intent: Pubkey,
    pub price: u64,
}

#[event]
pub struct BidAccepted {
    pub intent: Pubkey,
    pub bid: Pubkey,
}

#[event]
pub struct IntentExecuted {
    pub intent: Pubkey,
}

#[error_code]
pub enum IntentError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Intent not open")]
    NotOpen,
    #[msg("Invalid bid state")]
    InvalidBid,
    #[msg("Invalid intent state")]
    InvalidState,
}

#[program]
pub mod kuberna_intent {
    use super::*;

    pub fn create_intent(ctx: Context<CreateIntent>, intent_id: String, budget: u64) -> Result<()> {
        let intent = &mut ctx.accounts.intent;
        intent.requester = ctx.accounts.requester.key();
        intent.budget = budget;
        intent.status = IntentStatus::Open;
        intent.intent_id = intent_id.clone();
        intent.bump = ctx.bumps.get("intent").copied().unwrap_or(1);

        emit!(IntentCreated {
            intent: intent.key(),
            requester: ctx.accounts.requester.key(),
            budget,
        });
        Ok(())
    }

    pub fn submit_bid(
        ctx: Context<SubmitBid>,
        bid_id: String,
        price: u64,
        _estimated_time: i64,
    ) -> Result<()> {
        let intent = &mut ctx.accounts.intent;
        require!(intent.status == IntentStatus::Open, IntentError::NotOpen);

        let bid = &mut ctx.accounts.bid;
        bid.agent = ctx.accounts.agent.key();
        bid.intent = intent.key();
        bid.price = price;
        bid.status = BidStatus::Pending;
        bid.bid_id = bid_id.clone();
        bid.bump = ctx.bumps.get("bid").copied().unwrap_or(1);

        emit!(BidSubmitted {
            bid: bid.key(),
            agent: ctx.accounts.agent.key(),
            intent: intent.key(),
            price,
        });
        Ok(())
    }

    pub fn accept_bid(ctx: Context<AcceptBid>) -> Result<()> {
        let intent = &mut ctx.accounts.intent;
        let bid = &mut ctx.accounts.bid;

        require!(
            intent.requester == ctx.accounts.requester.key(),
            IntentError::Unauthorized
        );
        require!(intent.status == IntentStatus::Open, IntentError::NotOpen);
        require!(bid.status == BidStatus::Pending, IntentError::InvalidBid);

        intent.status = IntentStatus::Assigned;
        intent.selected_bid = Some(bid.key());
        bid.status = BidStatus::Accepted;

        emit!(BidAccepted {
            intent: intent.key(),
            bid: bid.key(),
        });
        Ok(())
    }

    pub fn execute_intent(ctx: Context<ExecuteIntent>) -> Result<()> {
        let intent = &mut ctx.accounts.intent;
        require!(
            intent.status == IntentStatus::Executing,
            IntentError::InvalidState
        );

        intent.status = IntentStatus::Completed;

        emit!(IntentExecuted {
            intent: intent.key(),
        });
        Ok(())
    }
}
