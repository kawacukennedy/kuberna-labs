use anchor_lang::prelude::*;

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
pub struct UpdateAgent<'info> {
    #[account(mut, seeds = [b"agent".as_ref(), owner.key().as_ref()], bump = agent.bump)]
    pub agent: Account<'info, KubernaAgent>,
    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct AddTool<'info> {
    #[account(mut, seeds = [b"agent".as_ref(), owner.key().as_ref()], bump = agent.bump)]
    pub agent: Account<'info, KubernaAgent>,
    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct KubernaAgent {
    pub owner: Pubkey,
    pub name: String,
    pub description: String,
    pub framework: String,
    pub model: String,
    pub config: String,
    pub tools: Vec<String>,
    pub status: AgentStatus,
    pub created_at: i64,
    pub last_active: i64,
    pub bump: u8,
    #[max_len(100)]
    pub owner_agents: Vec<Pubkey>,
}

impl KubernaAgent {
    const INIT_SPACE: usize = 32 + (4 + 32) + (4 + 128) + (4 + 32) + (4 + 32) + (4 + 128) + (4 + 100) + 1 + 8 + 8 + 1 + (4 + 1000);
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum AgentStatus {
    None,
    Registered,
    Active,
    Paused,
    Deprecated,
}

#[event]
pub struct AgentRegisteredEvent {
    pub agent: Pubkey,
    pub owner: Pubkey,
    pub name: String,
    pub framework: String,
}

#[event]
pub struct AgentUpdatedEvent {
    pub agent: Pubkey,
    pub owner: Pubkey,
}

#[event]
pub struct AgentStatusChangedEvent {
    pub agent: Pubkey,
    pub status: u8,
}

#[event]
pub struct ToolAddedEvent {
    pub agent: Pubkey,
    pub tool: String,
}

#[error_code]
pub enum AgentError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Agent already exists")]
    AgentAlreadyExists,
    #[msg("Invalid status")]
    InvalidStatus,
}

pub fn register_agent(
    ctx: Context<RegisterAgent>,
    name: String,
    description: String,
    framework: String,
    model: String,
    config: String,
    tools: Vec<String>,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    let clock = Clock::get()?;

    agent.owner = ctx.accounts.owner.key();
    agent.name = name.clone();
    agent.description = description;
    agent.framework = framework.clone();
    agent.model = model;
    agent.config = config;
    agent.tools = tools.clone();
    agent.status = AgentStatus::Registered;
    agent.created_at = clock.unix_timestamp;
    agent.last_active = clock.unix_timestamp;
    agent.bump = ctx.bumps.get("agent").copied().unwrap_or(1);
    agent.owner_agents = vec![ctx.accounts.owner.key()];

    emit!(AgentRegisteredEvent {
        agent: agent.key(),
        owner: ctx.accounts.owner.key(),
        name,
        framework,
    });
    Ok(())
}

pub fn update_agent(
    ctx: Context<UpdateAgent>,
    description: String,
    model: String,
    config: String,
) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    require!(agent.owner == ctx.accounts.owner.key(), AgentError::Unauthorized);
    
    let clock = Clock::get()?;
    agent.description = description;
    agent.model = model;
    agent.config = config;
    agent.last_active = clock.unix_timestamp;

    emit!(AgentUpdatedEvent {
        agent: agent.key(),
        owner: ctx.accounts.owner.key(),
    });
    Ok(())
}

pub fn set_agent_status(ctx: Context<AddTool>, status: u8) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    require!(agent.owner == ctx.accounts.owner.key(), AgentError::Unauthorized);
    
    agent.status = match status {
        0 => AgentStatus::None,
        1 => AgentStatus::Registered,
        2 => AgentStatus::Active,
        3 => AgentStatus::Paused,
        _ => AgentStatus::Deprecated,
    };

    emit!(AgentStatusChangedEvent {
        agent: agent.key(),
        status,
    });
    Ok(())
}

pub fn add_tool(ctx: Context<AddTool>, tool: String) -> Result<()> {
    let agent = &mut ctx.accounts.agent;
    require!(agent.owner == ctx.accounts.owner.key(), AgentError::Unauthorized);
    
    agent.tools.push(tool.clone());

    emit!(ToolAddedEvent {
        agent: agent.key(),
        tool,
    });
    Ok(())
}

pub fn get_agent(_ctx: Context<UpdateAgent>) -> Result<KubernaAgent> {
    Err(ProgramError::NotEnoughAccountData.into())
}