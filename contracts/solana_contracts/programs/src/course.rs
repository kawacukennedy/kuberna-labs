use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct CreateCourse<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Course::INIT_SPACE,
        seeds = [b"course".as_ref(), course_id.as_bytes()],
        bump
    )]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(course_id: String)]
pub struct EnrollStudent<'info> {
    #[account(mut, seeds = [b"course".as_ref(), course_id.as_bytes()], bump = course.bump)]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Course {
    pub name: String,
    pub description: String,
    pub metadata_uri: String,
    pub price: u64,
    pub payment_token: Pubkey,
    pub status: CourseStatus,
    pub max_students: u32,
    pub enrolled_count: u32,
    pub has_certificate: bool,
    pub duration: i64,
    pub course_id: String,
    pub bump: u8,
    #[max_len(100)]
    pub enrolled_students: Vec<Pubkey>,
}

impl Course {
    const INIT_SPACE: usize = (4 + 64) + (4 + 256) + (4 + 128) + 8 + 32 + 1 + 4 + 4 + 1 + 8 + (4 + 64) + 1 + (4 + 1000);
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum CourseStatus {
    Draft,
    Published,
    Archived,
}

#[event]
pub struct CourseCreatedEvent {
    pub course: Pubkey,
    pub name: String,
    pub price: u64,
}

#[event]
pub struct CoursePublishedEvent {
    pub course: Pubkey,
}

#[event]
pub struct StudentEnrolledEvent {
    pub course: Pubkey,
    pub student: Pubkey,
}

#[error_code]
pub enum CourseError {
    #[msg("Course not found")]
    NotFound,
    #[msg("Course not published")]
    NotPublished,
    #[msg("Course full")]
    Full,
    #[msg("Student already enrolled")]
    AlreadyEnrolled,
}

pub fn create_course(
    ctx: Context<CreateCourse>,
    name: String,
    description: String,
    metadata_uri: String,
    price: u64,
    payment_token: Pubkey,
    max_students: u32,
    has_certificate: bool,
    duration: i64,
) -> Result<()> {
    let course = &mut ctx.accounts.course;

    course.name = name.clone();
    course.description = description;
    course.metadata_uri = metadata_uri;
    course.price = price;
    course.payment_token = payment_token;
    course.status = CourseStatus::Draft;
    course.max_students = max_students;
    course.enrolled_count = 0;
    course.has_certificate = has_certificate;
    course.duration = duration;
    course.course_id = name.clone();
    course.bump = ctx.bumps.get("course").copied().unwrap_or(1);
    course.enrolled_students = vec![];

    emit!(CourseCreatedEvent {
        course: course.key(),
        name,
        price,
    });
    Ok(())
}

pub fn publish_course(ctx: Context<CreateCourse>) -> Result<()> {
    let course = &mut ctx.accounts.course;
    require!(course.price > 0, CourseError::NotFound);
    
    course.status = CourseStatus::Published;

    emit!(CoursePublishedEvent {
        course: course.key(),
    });
    Ok(())
}

pub fn enroll_student(ctx: Context<EnrollStudent>, student: Pubkey) -> Result<()> {
    let course = &mut ctx.accounts.course;
    require!(course.status == CourseStatus::Published, CourseError::NotPublished);
    require!(course.enrolled_count < course.max_students || course.max_students == 0, CourseError::Full);
    
    course.enrolled_students.push(student);
    course.enrolled_count += 1;

    emit!(StudentEnrolledEvent {
        course: course.key(),
        student,
    });
    Ok(())
}

pub fn grant_access(ctx: Context<EnrollStudent>, student: Pubkey) -> Result<()> {
    let course = &mut ctx.accounts.course;
    require!(course.price > 0, CourseError::NotFound);
    
    if !course.enrolled_students.contains(&student) {
        course.enrolled_students.push(student);
        course.enrolled_count += 1;
    }
    
    Ok(())
}

pub fn remove_student(ctx: Context<EnrollStudent>, student: Pubkey) -> Result<()> {
    let course = &mut ctx.accounts.course;
    let index = course.enrolled_students.iter().position(|&x| x == student);
    if let Some(idx) = index {
        course.enrolled_students.remove(idx);
        course.enrolled_count = course.enrolled_count.saturating_sub(1);
    }
    
    Ok(())
}

pub fn is_enrolled(course: Pubkey, student: Pubkey) -> Result<bool> {
    Ok(false)
}