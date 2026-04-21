use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(
        init,
        payer = owner,
        mut,
        space = 8 + KubernaAgent::INIT_SPACE,
        seeds = [b"agent".as_ref(), owner.key().as_ref()],
        bump
    )]
    pub agent: Account<'info, KubernaAgent>,
    #[account(mut)]
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
    #[max_len(32)]
    pub name: String,
    #[max_len(128)]
    pub description: String,
    #[max_len(32)]
    pub framework: String,
    #[max_len(100)]
    pub tools: Vec<String>,
    pub status: AgentStatus,
    pub total_tasks: u64,
    pub successful_tasks: u64,
    pub created_at: i64,
    pub last_active: i64,
    pub bump: u8,
}

impl KubernaAgent {
    const INIT_SPACE: usize =
        32 + (4 + 32) + (4 + 128) + (4 + 32) + (4 + 100) + 1 + 8 + 8 + 8 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
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
        agent.created_at = Clock::get()?.unix_timestamp;
        agent.bump = ctx.bumps.get("agent").copied().unwrap_or(1);

        emit!(AgentRegistered {
            agent: agent.key(),
            owner: ctx.accounts.owner.key(),
            name,
        });
        Ok(())
    }

    pub fn update_agent_status(ctx: Context<UpdateAgentStatus>, status: String) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        require!(
            agent.owner == ctx.accounts.owner.key(),
            AgentError::Unauthorized
        );

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

    pub fn record_task_result(ctx: Context<RecordTaskResult>, success: bool) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.total_tasks += 1;
        if success {
            agent.successful_tasks += 1;
        }
        agent.last_active = Clock::get()?.unix_timestamp;

        emit!(TaskRecorded {
            agent: agent.key(),
            success,
            total_tasks: agent.total_tasks,
        });
        Ok(())
    }
}
