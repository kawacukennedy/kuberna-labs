use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct FundTreasury<'info> {
    #[account(
        init,
        payer = funder,
        space = 8 + Treasury::INIT_SPACE,
        seeds = [b"treasury".as_ref()],
        bump
    )]
    pub treasury: Account<'info, Treasury>,
    pub funder: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut, seeds = [b"treasury".as_ref()], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal".as_ref(), &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CastVote<'info> {
    #[account(mut, seeds = [b"proposal".as_ref(), &proposal_id.to_le_bytes()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
    pub voter: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Treasury {
    pub owner: Pubkey,
    pub balance: u64,
    pub last_updated: i64,
    pub bump: u8,
}

impl Treasury {
    const INIT_SPACE: usize = 32 + 8 + 8 + 1;
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub recipient: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub executed: bool,
    pub cancelled: bool,
    pub created_at: i64,
    pub proposal_id: u64,
    pub bump: u8,
    #[max_len(50)]
    pub voters: Vec<Pubkey>,
}

impl Proposal {
    const INIT_SPACE: usize = 32 + 32 + 8 + (4 + 256) + 8 + 8 + 1 + 1 + 8 + 8 + 1 + (4 + 400);
}

#[event]
pub struct TreasuryFundedEvent {
    pub treasury: Pubkey,
    pub funder: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TreasuryWithdrawnEvent {
    pub treasury: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ProposalCreatedEvent {
    pub proposal: Pubkey,
    pub proposal_id: u64,
    pub amount: u64,
}

#[event]
pub struct VoteCastEvent {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub support: bool,
}

#[error_code]
pub enum TreasuryError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient funds")]
    InsufficientFunds,
    #[msg("Proposal not found")]
    NotFound,
    #[msg("Voting period ended")]
    VotingEnded,
    #[msg("Quorum not reached")]
    QuorumNotReached,
}

const QUORUM: u64 = 100_000_000_000;
const VOTING_PERIOD: i64 = 3 * 24 * 60 * 60;

pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    let clock = ctx.accounts.clock.unix_timestamp();

    treasury.owner = ctx.accounts.funder.key();
    treasury.balance += amount;
    treasury.last_updated = clock;
    treasury.bump = ctx.bumps.get("treasury").copied().unwrap_or(1);

    emit!(TreasuryFundedEvent {
        treasury: treasury.key(),
        funder: ctx.accounts.funder.key(),
        amount,
    });
    Ok(())
}

pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, recipient: Pubkey, amount: u64) -> Result<()> {
    let treasury = &mut ctx.accounts.treasury;
    require!(treasury.owner == ctx.accounts.owner.key(), TreasuryError::Unauthorized);
    require!(treasury.balance >= amount, TreasuryError::InsufficientFunds);

    treasury.balance -= amount;

    emit!(TreasuryWithdrawnEvent {
        treasury: treasury.key(),
        recipient,
        amount,
    });
    Ok(())
}

pub fn create_proposal(
    ctx: Context<CreateProposal>,
    proposal_id: u64,
    recipient: Pubkey,
    token: Pubkey,
    amount: u64,
    description: String,
) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?.unix_timestamp;

    proposal.recipient = recipient;
    proposal.token = token;
    proposal.amount = amount;
    proposal.description = description;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.executed = false;
    proposal.cancelled = false;
    proposal.created_at = clock;
    proposal.proposal_id = proposal_id;
    proposal.bump = ctx.bumps.get("proposal").copied().unwrap_or(1);
    proposal.voters = vec![];

    emit!(ProposalCreatedEvent {
        proposal: proposal.key(),
        proposal_id,
        amount,
    });
    Ok(())
}

pub fn cast_vote(ctx: Context<CastVote>, support: bool) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?.unix_timestamp;
    let voter = ctx.accounts.voter.key();
    
    require!(proposal.created_at > 0, TreasuryError::NotFound);
    require!(clock < proposal.created_at + VOTING_PERIOD, TreasuryError::VotingEnded);
    require!(!proposal.executed && !proposal.cancelled, TreasuryError::NotFound);
    require!(!proposal.voters.contains(&voter), TreasuryError::NotFound);

    proposal.voters.push(voter);
    if support {
        proposal.votes_for += 1;
    } else {
        proposal.votes_against += 1;
    }

    emit!(VoteCastEvent {
        proposal: proposal.key(),
        voter,
        support,
    });
    Ok(())
}

pub fn execute_proposal(ctx: Context<CastVote>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let clock = Clock::get()?.unix_timestamp;
    
    require!(proposal.created_at > 0, TreasuryError::NotFound);
    require!(clock >= proposal.created_at + VOTING_PERIOD, TreasuryError::VotingEnded);
    require!(!proposal.executed && !proposal.cancelled, TreasuryError::NotFound);
    require!(proposal.votes_for >= QUORUM, TreasuryError::QuorumNotReached);

    proposal.executed = true;
    Ok(())
}

pub fn cancel_proposal(ctx: Context<CastVote>) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    require!(proposal.created_at > 0, TreasuryError::NotFound);
    require!(!proposal.executed, TreasuryError::NotFound);
    
    proposal.cancelled = true;
    Ok(())
}