use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount};

#[program]
pub mod kuberna_agent {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        description: String,
        framework: String,
        tools: Vec<String>,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.owner = ctx.accounts.owner.key();
        agent.name = name;
        agent.description = description;
        agent.framework = framework;
        agent.tools = tools;
        agent.status = AgentStatus::Registered;
        agent.total_tasks = 0;
        agent.successful_tasks = 0;
        agent.created_at = ctx.accounts.clock.unix_timestamp();
        agent.bump = ctx.bumps.agent;
        
        emit!(AgentRegistered {
            agent: agent.key(),
            owner: ctx.accounts.owner.key(),
            name,
        });
        Ok(())
    }

    pub fn update_agent_status(ctx: Context<UpdateAgentStatus>, status: String) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(agent.owner == ctx.accounts.owner.key(), AgentError::Unauthorized);
        
        agent.status = match status.as_str() {
            "running" => AgentStatus::Running,
            "stopped" => AgentStatus::Stopped,
            _ => AgentStatus::Registered,
        };
        
        emit!(AgentStatusUpdated {
            agent: agent.key(),
            status: agent.status.clone(),
        });
        Ok(())
    }

    pub fn record_task_result(
        ctx: Context<RecordTaskResult>,
        success: bool,
    ) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.total_tasks += 1;
        if success {
            agent.successful_tasks += 1;
        }
        agent.last_active = ctx.accounts.clock.unix_timestamp();
        
        emit!(TaskRecorded {
            agent: agent.key(),
            success,
            total_tasks: agent.total_tasks,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + KubernaAgent::INIT_SPACE,
        seeds = [b"agent".as_ref(), owner.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, KubernaAgent>,
    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateAgentStatus<'info> {
    #[account(mut, seeds = [b"agent".as_ref(), owner.key().as_ref()], bump = agent.bump)]
    pub agent: Account<'info, KubernaAgent>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordTaskResult<'info> {
    #[account(mut, seeds = [b"agent".as_ref(), owner.key().as_ref()], bump = agent.bump)]
    pub agent: Account<'info, KubernaAgent>,
    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(InitSpace)]
pub struct KubernaAgent {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub framework: String,
    pub tools: Vec<String>,
    pub status: AgentStatus,
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub created_at: i64,
    pub last_active: i64,
    pub bump: u8,
}

impl KubernaAgent {
    const INIT_SPACE: usize = 32 + (4 + 32) + (4 + 128) + (4 + 32) + (4 + 100) + 1 + 8 + 8 + 8 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum AgentStatus {
    Registered,
    Running,
    Stopped,
    Error,
}

#[event]
pub struct AgentRegistered {
    pub agent: Pubkey,
    pub owner: Pubkey,
    pub name: String,
}

#[event]
pub struct AgentStatusUpdated {
    pub agent: Pubkey,
    pub status: AgentStatus,
}

#[event]
pub struct TaskRecorded {
    pub agent: Pubkey,
    pub success: bool,
    pub total_tasks: u64,
}

#[error_code]
pub enum AgentError {
    #[msg("Unauthorized")]
    Unauthorized,
}

#[program]
pub mod kuberna_subscription {
    use super::*;

    pub fn create_subscription(
        ctx: Context<CreateSubscription>,
        subscriber: Pubkey,
        plan_id: u8,
        amount: u64,
    ) -> Result<()> {
        let sub = &mut ctx.accounts.subscription;
        sub.subscriber = subscriber;
        sub.plan_id = plan_id;
        sub.amount = amount;
        sub.start_time = ctx.accounts.clock.unix_timestamp();
        sub.next_payment_time = sub.start_time + (30 * 24 * 60 * 60); // 30 days
        sub.status = SubscriptionStatus::Active;
        sub.bump = ctx.bumps.subscription;
        
        emit!(SubscriptionCreated {
            subscription: sub.key(),
            subscriber,
            plan_id,
            amount,
        });
        Ok(())
    }

    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        let sub = &mut ctx.accounts.subscription;
        require!(sub.subscriber == ctx.accounts.subscriber.key(), SubscriptionError::Unauthorized);
        
        sub.status = SubscriptionStatus::Cancelled;
        
        emit!(SubscriptionCancelled {
            subscription: sub.key(),
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateSubscription<'info> {
    #[account(
        init,
        payer = subscriber,
        space = 8 + Subscription::INIT_SPACE,
        seeds = [b"subscription".as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    pub subscriber: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(mut, seeds = [b"subscription".as_ref(), subscriber.key().as_ref()], bump = subscription.bump)]
    pub subscription: Account<'info, Subscription>,
    pub subscriber: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub plan_id: u8,
    pub amount: u64,
    pub start_time: i64,
    pub next_payment_time: i64,
    pub status: SubscriptionStatus,
    pub bump: u8,
}

impl Subscription {
    const INIT_SPACE: usize = 32 + 1 + 8 + 8 + 8 + 1 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum SubscriptionStatus {
    Active,
    Paused,
    Cancelled,
    Expired,
}

#[event]
pub struct SubscriptionCreated {
    pub subscription: Pubkey,
    pub subscriber: Pubkey,
    pub plan_id: u8,
    pub amount: u64,
}

#[event]
pub struct SubscriptionCancelled {
    pub subscription: Pubkey,
}

#[error_code]
pub enum SubscriptionError {
    #[msg("Unauthorized")]
    Unauthorized,
}