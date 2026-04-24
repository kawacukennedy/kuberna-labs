use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RegisterAgentReputation<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + Reputation::INIT_SPACE,
        seeds = [b"reputation".as_ref(), &agent.key().to_bytes()],
        bump
    )]
    pub reputation: Account<'info, Reputation>,
    pub agent: SystemAccount<'info>,
    pub admin: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgentReputation<'info> {
    #[account(mut, seeds = [b"reputation".as_ref(), &agent.key().to_bytes()], bump = reputation.bump)]
    pub reputation: Account<'info, Reputation>,
    pub agent: SystemAccount<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(InitSpace)]
pub struct Reputation {
    pub agent: Pubkey,
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub total_response_time: u64,
    pub rating_sum: u64,
    pub rating_count: u64,
    pub last_updated: i64,
    pub bump: u8,
}

impl Reputation {
    const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 8 + 8 + 1;
}

#[event]
pub struct ReputationRegisteredEvent {
    pub reputation: Pubkey,
    pub agent: Pubkey,
}

#[event]
pub struct ReputationUpdatedEvent {
    pub reputation: Pubkey,
    pub score: u64,
}

#[event]
pub struct BadgeEarnedEvent {
    pub reputation: Pubkey,
    pub badge: String,
}

const MIN_TASKS: u64 = 5;
const DECAY_PERIOD: i64 = 30 * 24 * 60 * 60;
const DECAY_RATE_BPS: u64 = 1000;

pub fn register_agent_reputation(ctx: Context<RegisterAgentReputation>) -> Result<()> {
    let rep = &mut ctx.accounts.reputation;
    rep.agent = ctx.accounts.admin.key();
    rep.total_tasks = 0;
    rep.successful_tasks = 0;
    rep.total_response_time = 0;
    rep.rating_sum = 0;
    rep.rating_count = 0;
    rep.last_updated = ctx.accounts.clock.unix_timestamp();
    rep.bump = ctx.bumps.get("reputation").copied().unwrap_or(1);

    emit!(ReputationRegisteredEvent {
        reputation: rep.key(),
        agent: rep.agent,
    });
    Ok(())
}

pub fn update_agent_reputation(
    ctx: Context<UpdateAgentReputation>,
    success: bool,
    response_time: u32,
) -> Result<()> {
    let rep = &mut ctx.accounts.reputation;
    rep.total_tasks += 1;
    if success {
        rep.successful_tasks += 1;
    }
    rep.total_response_time += response_time as u64;
    rep.last_updated = ctx.accounts.clock.unix_timestamp();

    let new_score = calculate_score(rep.total_tasks, rep.successful_tasks, rep.total_response_time, rep.rating_sum, rep.rating_count);
    rep.rating_sum += new_score;
    rep.rating_count += 1;

    emit!(ReputationUpdatedEvent {
        reputation: rep.key(),
        score: new_score,
    });
    Ok(())
}

pub fn submit_rating(ctx: Context<UpdateAgentReputation>, rating: u64) -> Result<()> {
    let rep = &mut ctx.accounts.reputation;
    require!(rating >= 1 && rating <= 5, ReputationError::InvalidRating);
    
    rep.rating_sum += rating;
    rep.rating_count += 1;
    rep.last_updated = Clock::get()?.unix_timestamp;
    
    Ok(())
}

pub fn calculate_score(
    total_tasks: u64,
    successful_tasks: u64,
    total_response_time: u64,
    rating_sum: u64,
    rating_count: u64,
) -> u64 {
    if total_tasks < MIN_TASKS {
        return 0;
    }

    let success_score = if total_tasks > 0 {
        (successful_tasks * 10000) / total_tasks
    } else {
        0
    };

    let avg_response_time = if total_tasks > 0 {
        total_response_time / total_tasks
    } else {
        0
    };

    let response_score = if avg_response_time <= 60 {
        1000
    } else if avg_response_time <= 300 {
        800
    } else if avg_response_time <= 600 {
        600
    } else if avg_response_time <= 1800 {
        400
    } else {
        100
    };

    let rating_score = if rating_count > 0 {
        (rating_sum * 100) / (rating_count * 5)
    } else {
        0
    };

    (success_score * 500 + response_score * 200 + rating_score * 300) / 1000
}

pub fn get_success_rate(total_tasks: u64, successful_tasks: u64) -> u64 {
    if total_tasks == 0 {
        return 0;
    }
    (successful_tasks * 10000) / total_tasks
}

pub fn get_star_rating(score: u64) -> u64 {
    if score >= 900 {
        5
    } else if score >= 700 {
        4
    } else if score >= 500 {
        3
    } else if score >= 300 {
        2
    } else if score > 0 {
        1
    } else {
        0
    }
}

#[error_code]
pub enum ReputationError {
    #[msg("Invalid rating")]
    InvalidRating,
    #[msg("Token not found")]
    NotFound,
}