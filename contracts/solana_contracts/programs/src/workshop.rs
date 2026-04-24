use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateWorkshop<'info> {
    #[account(
        init,
        payer = instructor,
        space = 8 + Workshop::INIT_SPACE,
        seeds = [b"workshop".as_ref(), title.as_bytes()],
        bump
    )]
    pub workshop: Account<'info, Workshop>,
    pub instructor: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterWorkshop<'info> {
    #[account(mut, seeds = [b"workshop".as_ref(), workshop.title.as_bytes()], bump = workshop.bump)]
    pub workshop: Account<'info, Workshop>,
    pub participant: Signer<'info>,
}

#[derive(Accounts)]
pub struct StartWorkshop<'info> {
    #[account(mut, seeds = [b"workshop".as_ref(), workshop.title.as_bytes()], bump = workshop.bump)]
    pub workshop: Account<'info, Workshop>,
    pub instructor: Signer<'info>,
}

#[derive(Accounts)]
pub struct EndWorkshop<'info> {
    #[account(mut, seeds = [b"workshop".as_ref(), workshop.title.as_bytes()], bump = workshop.bump)]
    pub workshop: Account<'info, Workshop>,
    pub instructor: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Workshop {
    pub instructor: Pubkey,
    pub title: String,
    pub description: String,
    pub start_time: i64,
    pub duration: i64,
    pub max_participants: u32,
    pub current_participants: u32,
    pub status: WorkshopStatus,
    pub bump: u8,
    #[max_len(100)]
    pub participants: Vec<Pubkey>,
    #[max_len(100)]
    pub attended: Vec<Pubkey>,
}

impl Workshop {
    const INIT_SPACE: usize = 32 + (4 + 100) + (4 + 256) + 8 + 8 + 4 + 4 + 1 + 1 + (4 + 800) + (4 + 800);
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum WorkshopStatus {
    Scheduled,
    Live,
    Completed,
    Cancelled,
}

#[event]
pub struct WorkshopCreatedEvent {
    pub workshop: Pubkey,
    pub title: String,
    pub instructor: Pubkey,
}

#[event]
pub struct WorkshopStartedEvent {
    pub workshop: Pubkey,
}

#[event]
pub struct WorkshopEndedEvent {
    pub workshop: Pubkey,
}

#[event]
pub struct ParticipantRegisteredEvent {
    pub workshop: Pubkey,
    pub participant: Pubkey,
}

#[event]
pub struct AttendanceMarkedEvent {
    pub workshop: Pubkey,
    pub participant: Pubkey,
}

#[error_code]
pub enum WorkshopError {
    #[msg("Workshop not found")]
    NotFound,
    #[msg("Workshop full")]
    Full,
    #[msg("Already registered")]
    AlreadyRegistered,
    #[msg("Workshop not scheduled")]
    NotScheduled,
    #[msg("Only instructor")]
    OnlyInstructor,
}

pub fn create_workshop(
    ctx: Context<CreateWorkshop>,
    title: String,
    description: String,
    start_time: i64,
    duration: i64,
    max_participants: u32,
) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    let clock = ctx.accounts.clock.unix_timestamp();
    
    require!(start_time > clock, WorkshopError::NotFound);

    workshop.instructor = ctx.accounts.instructor.key();
    workshop.title = title.clone();
    workshop.description = description;
    workshop.start_time = start_time;
    workshop.duration = duration;
    workshop.max_participants = max_participants;
    workshop.current_participants = 0;
    workshop.status = WorkshopStatus::Scheduled;
    workshop.bump = ctx.bumps.get("workshop").copied().unwrap_or(1);
    workshop.participants = vec![];
    workshop.attended = vec![];

    emit!(WorkshopCreatedEvent {
        workshop: workshop.key(),
        title,
        instructor: workshop.instructor,
    });
    Ok(())
}

pub fn register_workshop(ctx: Context<RegisterWorkshop>) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    let participant = ctx.accounts.participant.key();
    
    require!(workshop.start_time > 0, WorkshopError::NotFound);
    require!(!workshop.participants.contains(&participant), WorkshopError::AlreadyRegistered);
    require!(workshop.current_participants < workshop.max_participants || workshop.max_participants == 0, WorkshopError::Full);
    require!(workshop.status == WorkshopStatus::Scheduled, WorkshopError::NotScheduled);

    workshop.participants.push(participant);
    workshop.current_participants += 1;

    emit!(ParticipantRegisteredEvent {
        workshop: workshop.key(),
        participant,
    });
    Ok(())
}

pub fn unregister_workshop(ctx: Context<RegisterWorkshop>) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    let participant = ctx.accounts.participant.key();
    
    require!(workshop.participants.contains(&participant), WorkshopError::NotFound);
    require!(workshop.status == WorkshopStatus::Scheduled, WorkshopError::NotScheduled);

    if let Some(idx) = workshop.participants.iter().position(|&x| x == participant) {
        workshop.participants.remove(idx);
        workshop.current_participants = workshop.current_participants.saturating_sub(1);
    }
    
    Ok(())
}

pub fn start_workshop(ctx: Context<StartWorkshop>) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    require!(workshop.instructor == ctx.accounts.instructor.key(), WorkshopError::OnlyInstructor);
    require!(workshop.status == WorkshopStatus::Scheduled, WorkshopError::NotScheduled);

    workshop.status = WorkshopStatus::Live;

    emit!(WorkshopStartedEvent {
        workshop: workshop.key(),
    });
    Ok(())
}

pub fn end_workshop(ctx: Context<EndWorkshop>) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    require!(workshop.instructor == ctx.accounts.instructor.key(), WorkshopError::OnlyInstructor);
    require!(workshop.status == WorkshopStatus::Live, WorkshopError::NotScheduled);

    workshop.status = WorkshopStatus::Completed;

    emit!(WorkshopEndedEvent {
        workshop: workshop.key(),
    });
    Ok(())
}

pub fn mark_attendance(ctx: Context<RegisterWorkshop>, participant: Pubkey) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    require!(workshop.instructor == ctx.accounts.participant.key(), WorkshopError::OnlyInstructor);
    require!(workshop.participants.contains(&participant), WorkshopError::NotFound);
    require!(!workshop.attended.contains(&participant), WorkshopError::AlreadyRegistered);

    workshop.attended.push(participant);

    emit!(AttendanceMarkedEvent {
        workshop: workshop.key(),
        participant,
    });
    Ok(())
}

pub fn cancel_workshop(ctx: Context<EndWorkshop>) -> Result<()> {
    let workshop = &mut ctx.accounts.workshop;
    require!(workshop.instructor == ctx.accounts.instructor.key(), WorkshopError::OnlyInstructor);
    require!(workshop.status == WorkshopStatus::Scheduled, WorkshopError::NotScheduled);

    workshop.status = WorkshopStatus::Cancelled;
    Ok(())
}

pub fn has_attended(workshop: Workshop, participant: Pubkey) -> bool {
    workshop.attended.contains(&participant)
}