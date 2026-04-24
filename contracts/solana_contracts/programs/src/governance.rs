use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(description: String)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal".as_ref(), description.as_bytes()],
        bump
    )]
    pub proposal: Account<'info, Proposal>,
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(description: String)]
pub struct Vote<'info> {
    #[account(mut, seeds = [b"proposal".as_ref(), description.as_bytes()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
    pub voter: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub creator: Pubkey,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub status: u8,
    pub bump: u8,
}

impl Proposal {
    const INIT_SPACE: usize = 32 + (4 + 200) + 8 + 8 + 1 + 1;
}

#[event]
pub struct ProposalCreatedEvent {
    pub proposal: Pubkey,
}

#[event]
pub struct VoteCastEvent {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub support: bool,
}

pub fn create_proposal(ctx: Context<CreateProposal>, description: String) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    proposal.creator = ctx.accounts.creator.key();
    proposal.description = description;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.status = 0;
    proposal.bump = ctx.bumps.get("proposal").copied().unwrap_or(1);

    emit!(ProposalCreatedEvent {
        proposal: proposal.key(),
    });
    Ok(())
}

pub fn vote(ctx: Context<Vote>, support: bool) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    if support {
        proposal.votes_for += 1;
    } else {
        proposal.votes_against += 1;
    }

    emit!(VoteCastEvent {
        proposal: proposal.key(),
        voter: ctx.accounts.voter.key(),
        support,
    });
    Ok(())
}