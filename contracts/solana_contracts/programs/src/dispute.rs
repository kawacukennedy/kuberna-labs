use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(intent_id: String)]
pub struct RaiseDispute<'info> {
    #[account(
        init,
        payer = raiser,
        space = 8 + Dispute::INIT_SPACE,
        seeds = [b"dispute".as_ref(), intent_id.as_bytes()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    pub raiser: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitEvidence<'info> {
    #[account(mut, seeds = [b"dispute".as_ref(), dispute.intent_id.as_bytes()], bump = dispute.bump)]
    pub dispute: Account<'info, Dispute>,
    pub submitter: Signer<'info>,
}

#[derive(Accounts)]
pub struct VoteDispute<'info> {
    #[account(mut, seeds = [b"dispute".as_ref(), dispute.intent_id.as_bytes()], bump = dispute.bump)]
    pub dispute: Account<'info, Dispute>,
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut, seeds = [b"dispute".as_ref(), dispute.intent_id.as_bytes()], bump = dispute.bump)]
    pub dispute: Account<'info, Dispute>,
    pub resolver: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Dispute {
    pub escrow_id: [u8; 32],
    pub requester: Pubkey,
    pub executor: Pubkey,
    pub intent_id: String,
    pub reason: String,
    pub requester_evidence: String,
    pub executor_evidence: String,
    pub created_at: i64,
    pub voting_end_time: i64,
    pub requester_votes: u32,
    pub executor_votes: u32,
    pub status: DisputeStatus,
    pub result: Vote,
    pub appealed: bool,
    pub bump: u8,
    #[max_len(50)]
    pub votes: Vec<Pubkey>,
}

impl Dispute {
    const INIT_SPACE: usize = 32 + 32 + 32 + (4 + 64) + (4 + 256) + (4 + 256) + 8 + 8 + 4 + 4 + 1 + 1 + 1 + 1 + (4 + 500);
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum DisputeStatus {
    Open,
    Voting,
    Resolved,
    Appealed,
    Closed,
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum Vote {
    None,
    RequesterWins,
    ExecutorWins,
    Split,
}

#[event]
pub struct DisputeCreatedEvent {
    pub dispute: Pubkey,
    pub requester: Pubkey,
    pub executor: Pubkey,
}

#[event]
pub struct VoteCastEvent {
    pub dispute: Pubkey,
    pub voter: Pubkey,
    pub vote: u8,
}

#[event]
pub struct DisputeResolvedEvent {
    pub dispute: Pubkey,
    pub result: u8,
}

#[error_code]
pub enum DisputeError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Dispute not found")]
    NotFound,
    #[msg("Invalid status")]
    InvalidStatus,
    #[msg("Voting period ended")]
    VotingEnded,
    #[msg("Already voted")]
    AlreadyVoted,
    #[msg("Not a juror")]
    NotJuror,
}

const VOTING_PERIOD: i64 = 7 * 24 * 60 * 60;
const APPEAL_PERIOD: i64 = 3 * 24 * 60 * 60;
const MIN_JUROR_STAKE: u64 = 100_000_000_000;
const JUROR_REWARD: u64 = 10_000_000_000;

pub fn raise_dispute(
    ctx: Context<RaiseDispute>,
    escrow_id: [u8; 32],
    requester: Pubkey,
    executor: Pubkey,
    reason: String,
) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let clock = ctx.accounts.clock.unix_timestamp();

    dispute.escrow_id = escrow_id;
    dispute.requester = requester;
    dispute.executor = executor;
    dispute.intent_id = ctx.bumps.get("dispute").map(|_| "".to_string()).unwrap_or_default();
    dispute.reason = reason;
    dispute.requester_evidence = String::new();
    dispute.executor_evidence = String::new();
    dispute.created_at = clock;
    dispute.voting_end_time = clock + VOTING_PERIOD;
    dispute.requester_votes = 0;
    dispute.executor_votes = 0;
    dispute.status = DisputeStatus::Voting;
    dispute.result = Vote::None;
    dispute.appealed = false;
    dispute.bump = ctx.bumps.get("dispute").copied().unwrap_or(1);
    dispute.votes = vec![];

    emit!(DisputeCreatedEvent {
        dispute: dispute.key(),
        requester,
        executor,
    });
    Ok(())
}

pub fn submit_evidence(ctx: Context<SubmitEvidence>, evidence: String, is_requester: bool) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    require!(dispute.created_at > 0, DisputeError::NotFound);
    require!(dispute.status == DisputeStatus::Voting, DisputeError::InvalidStatus);
    require!(evidence.len() <= 1000, DisputeError::InvalidStatus);
    
    if is_requester {
        require!(ctx.accounts.submitter.key() == dispute.requester, DisputeError::Unauthorized);
        dispute.requester_evidence = evidence;
    } else {
        require!(ctx.accounts.submitter.key() == dispute.executor, DisputeError::Unauthorized);
        dispute.executor_evidence = evidence;
    }
    
    Ok(())
}

pub fn vote(ctx: Context<VoteDispute>, vote: u8) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    let clock = Clock::get()?.unix_timestamp;
    
    require!(dispute.created_at > 0, DisputeError::NotFound);
    require!(dispute.status == DisputeStatus::Voting, DisputeError::InvalidStatus);
    require!(clock < dispute.voting_end_time, DisputeError::VotingEnded);
    
    if vote == 0 {
        dispute.requester_votes += 1;
    } else {
        dispute.executor_votes += 1;
    }
    
    dispute.votes.push(ctx.accounts.voter.key());

    emit!(VoteCastEvent {
        dispute: dispute.key(),
        voter: ctx.accounts.voter.key(),
        vote,
    });
    Ok(())
}

pub fn resolve_dispute(ctx: Context<ResolveDispute>) -> Result<u8> {
    let dispute = &mut ctx.accounts.dispute;
    let clock = Clock::get()?.unix_timestamp;
    
    require!(dispute.created_at > 0, DisputeError::NotFound);
    require!(dispute.status == DisputeStatus::Voting, DisputeError::InvalidStatus);
    require!(clock >= dispute.voting_end_time, DisputeError::VotingEnded);
    
    dispute.status = DisputeStatus::Resolved;
    
    let result = if dispute.requester_votes > dispute.executor_votes {
        1
    } else if dispute.executor_votes > dispute.requester_votes {
        2
    } else {
        3
    };
    
    dispute.result = match result {
        1 => Vote::RequesterWins,
        2 => Vote::ExecutorWins,
        _ => Vote::Split,
    };

    emit!(DisputeResolvedEvent {
        dispute: dispute.key(),
        result,
    });
    
    Ok(result)
}

pub fn appeal_dispute(ctx: Context<ResolveDispute>) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    require!(dispute.status == DisputeStatus::Resolved, DisputeError::InvalidStatus);
    require!(!dispute.appealed, DisputeError::InvalidStatus);
    
    dispute.appealed = true;
    dispute.status = DisputeStatus::Appealed;
    dispute.voting_end_time = Clock::get()?.unix_timestamp + APPEAL_PERIOD;
    
    Ok(())
}