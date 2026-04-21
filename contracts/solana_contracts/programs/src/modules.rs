use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[program]
pub mod kuberna_workshop {
    use super::*;

    pub fn create_workshop(
        ctx: Context<CreateWorkshop>,
        title: String,
        max_participants: u32,
    ) -> Result<()> {
        let w = &mut ctx.accounts.workshop;
        w.instructor = ctx.accounts.instructor.key();
        w.title = title;
        w.max_participants = max_participants;
        w.current_participants = 0;
        w.start_time = ctx.accounts.clock.unix_timestamp();
        w.bump = ctx.bumps.get("workshop").copied().unwrap_or(1);
        emit!(WorkshopCreated {
            workshop: w.key(),
            instructor: w.instructor
        });
        Ok(())
    }

    pub fn register_participant(ctx: Context<RegisterWorkshop>) -> Result<()> {
        let w = &mut ctx.accounts.workshop;
        require!(w.current_participants < w.max_participants);
        w.registered_participants
            .push(ctx.accounts.participant.key());
        w.current_participants += 1;
        emit!(ParticipantRegistered {
            workshop: w.key(),
            participant: ctx.accounts.participant.key()
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateWorkshop<'info> {
    #[account(init, payer = instructor, space = 8 + Workshop::INIT_SPACE, seeds = [b"workshop".as_ref(), title.as_ref()], bump)]
    pub workshop: Account<'info, Workshop>,
    pub instructor: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterWorkshop<'info> {
    #[account(mut, seeds = [b"workshop".as_ref(), title.as_ref()], bump = workshop.bump)]
    pub workshop: Account<'info, Workshop>,
    pub participant: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Workshop {
    pub instructor: Pubkey,
    pub title: String,
    pub max_participants: u32,
    pub current_participants: u32,
    pub registered_participants: Vec<Pubkey>,
    pub start_time: i64,
    pub bump: u8,
}

impl Workshop {
    const INIT_SPACE: usize = 32 + (4 + 100) + 4 + 4 + (4 + 200) + 8 + 1;
}

#[event]
pub struct WorkshopCreated {
    pub workshop: Pubkey,
    pub instructor: Pubkey,
}

#[event]
pub struct ParticipantRegistered {
    pub workshop: Pubkey,
    pub participant: Pubkey,
}

#[program]
pub mod kuberna_course {
    use super::*;

    pub fn mint_course_access(
        ctx: Context<MintCourse>,
        course_id: String,
        recipient: Pubkey,
    ) -> Result<()> {
        let c = &mut ctx.accounts.course;
        c.recipient = recipient;
        c.course_id = course_id;
        c.enrolled_at = ctx.accounts.clock.unix_timestamp();
        c.bump = ctx.bumps.get("course").copied().unwrap_or(1);
        emit!(CourseMinted {
            course: c.key(),
            recipient
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct MintCourse<'info> {
    #[account(init, payer = authority, space = 8 + Course::INIT_SPACE, seeds = [b"course".as_ref(), recipient.key().as_ref(), course_id.as_ref()], bump)]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Course {
    pub recipient: Pubkey,
    pub course_id: String,
    pub enrolled_at: i64,
    pub bump: u8,
}

impl Course {
    const INIT_SPACE: usize = 32 + (4 + 64) + 8 + 1;
}

#[event]
pub struct CourseMinted {
    pub course: Pubkey,
    pub recipient: Pubkey,
}

#[program]
pub mod kuberna_multisig {
    use super::*;

    pub fn create_multisig(ctx: Context<CreateMultisig>, threshold: u8) -> Result<()> {
        let m = &mut ctx.accounts.multisig;
        m.owners = ctx.accounts.owners.to_vec();
        m.threshold = threshold;
        m.bump = ctx.bumps.get("multisig").copied().unwrap_or(1);
        emit!(MultisigCreated { multisig: m.key() });
        Ok(())
    }

    pub fn execute_transaction(ctx: Context<ExecuteTransaction>) -> Result<()> {
        let m = &mut ctx.accounts.multisig;
        m.last_executed = ctx.accounts.clock.unix_timestamp();
        emit!(TransactionExecuted { multisig: m.key() });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(init, payer = creator, space = 8 + Multisig::INIT_SPACE, seeds = [b"multisig".as_ref()], bump)]
    pub multisig: Account<'info, Multisig>,
    #[account()]
    pub owners: Vec<AccountInfo<'info>>,
    pub creator: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTransaction<'info> {
    #[account(mut, seeds = [b"multisig".as_ref()], bump = multisig.bump)]
    pub multisig: Account<'info, Multisig>,
    pub executor: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(InitSpace)]
pub struct Multisig {
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
    pub last_executed: i64,
    pub bump: u8,
}

impl Multisig {
    const INIT_SPACE: usize = (4 + 100) + 1 + 8 + 1;
}

#[event]
pub struct MultisigCreated {
    pub multisig: Pubkey,
}

#[event]
pub struct TransactionExecuted {
    pub multisig: Pubkey,
}

#[program]
pub mod kuberna_vesting {
    use super::*;

    pub fn create_vesting(
        ctx: Context<CreateVesting>,
        beneficiary: Pubkey,
        total_amount: u64,
        duration: i64,
    ) -> Result<()> {
        let v = &mut ctx.accounts.vesting;
        v.beneficiary = beneficiary;
        v.total_amount = total_amount;
        v.released = 0;
        v.start_time = ctx.accounts.clock.unix_timestamp();
        v.end_time = v.start_time + duration;
        v.bump = ctx.bumps.get("vesting").copied().unwrap_or(1);
        emit!(VestingCreated {
            vesting: v.key(),
            beneficiary,
            total_amount
        });
        Ok(())
    }

    pub fn release_vesting(ctx: Context<ReleaseVesting>) -> Result<()> {
        let v = &mut ctx.accounts.vesting;
        let now = ctx.accounts.clock.unix_timestamp();
        let elapsed = now - v.start_time;
        let total_duration = v.end_time - v.start_time;
        let releasable = if total_duration > 0 {
            (v.total_amount * elapsed as u64) / total_duration as u64 - v.released
        } else {
            0
        };
        v.released += releasable;
        emit!(VestingReleased {
            vesting: v.key(),
            amount: releasable
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateVesting<'info> {
    #[account(init, payer = funder, space = 8 + Vesting::INIT_SPACE, seeds = [b"vesting".as_ref(), beneficiary.key().as_ref()], bump)]
    pub vesting: Account<'info, Vesting>,
    pub funder: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReleaseVesting<'info> {
    #[account(mut, seeds = [b"vesting".as_ref(), beneficiary.key().as_ref()], bump = vesting.bump)]
    pub vesting: Account<'info, Vesting>,
    pub beneficiary: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(InitSpace)]
pub struct Vesting {
    pub beneficiary: Pubkey,
    pub total_amount: u64,
    pub released: u64,
    pub start_time: i64,
    pub end_time: i64,
    pub bump: u8,
}

impl Vesting {
    const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 1;
}

#[event]
pub struct VestingCreated {
    pub vesting: Pubkey,
    pub beneficiary: Pubkey,
    pub total_amount: u64,
}

#[event]
pub struct VestingReleased {
    pub vesting: Pubkey,
    pub amount: u64,
}

#[program]
pub mod kuberna_governance {
    use super::*;

    pub fn create_proposal(ctx: Context<CreateProposal>, description: String) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        p.creator = ctx.accounts.creator.key();
        p.description = description;
        p.votes_for = 0;
        p.votes_against = 0;
        p.status = 0;
        p.bump = ctx.bumps.get("proposal").copied().unwrap_or(1);
        emit!(ProposalCreated { proposal: p.key() });
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, support: bool) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        if support {
            p.votes_for += 1;
        } else {
            p.votes_against += 1;
        }
        emit!(VoteCast {
            proposal: p.key(),
            voter: ctx.accounts.voter.key(),
            support
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = creator, space = 8 + Proposal::INIT_SPACE, seeds = [b"proposal".as_ref(), description.as_ref()], bump)]
    pub proposal: Account<'info, Proposal>,
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut, seeds = [b"proposal".as_ref(), description.as_ref()], bump = proposal.bump)]
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
pub struct ProposalCreated {
    pub proposal: Pubkey,
}

#[event]
pub struct VoteCast {
    pub proposal: Pubkey,
    pub voter: Pubkey,
    pub support: bool,
}

#[program]
pub mod kuberna_oracle {
    use super::*;

    pub fn set_price(ctx: Context<SetPrice>, price: u64) -> Result<()> {
        let o = &mut ctx.accounts.oracle;
        o.price = price;
        o.updated_at = ctx.accounts.clock.unix_timestamp();
        o.bump = ctx.bumps.get("oracle").copied().unwrap_or(1);
        emit!(PriceUpdated {
            oracle: o.key(),
            price
        });
        Ok(())
    }

    pub fn get_price(ctx: Context<GetPrice>) -> Result<u64> {
        Ok(ctx.accounts.oracle.price)
    }
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    #[account(mut, seeds = [b"oracle".as_ref()], bump = oracle.bump)]
    pub oracle: Account<'info, PriceOracle>,
    pub updater: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    pub oracle: Account<'info, PriceOracle>,
}

#[account]
#[derive(InitSpace)]
pub struct PriceOracle {
    pub price: u64,
    pub updated_at: i64,
    pub bump: u8,
}

impl PriceOracle {
    const INIT_SPACE: usize = 8 + 8 + 1;
}

#[event]
pub struct PriceUpdated {
    pub oracle: Pubkey,
    pub price: u64,
}
