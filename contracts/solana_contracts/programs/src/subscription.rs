use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateSubscription<'info> {
    #[account(
        init,
        payer = subscriber,
        space = 8 + Subscription::INIT_SPACE,
        seeds = [b"sub".as_ref(), subscriber.key().as_ref()],
        bump
    )]
    pub subscription: Account<'info, Subscription>,
    pub subscriber: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(mut, seeds = [b"sub".as_ref(), subscriber.key().as_ref()], bump = subscription.bump)]
    pub subscription: Account<'info, Subscription>,
    pub subscriber: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreatePlan<'info> {
    #[account(
        init,
        payer = owner,
        space = 8 + Plan::INIT_SPACE,
        seeds = [b"plan".as_ref(), &plan_id.to_le_bytes()],
        bump
    )]
    pub plan: Account<'info, Plan>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Subscription {
    pub subscriber: Pubkey,
    pub plan_id: u64,
    pub start_time: i64,
    pub next_payment_time: i64,
    pub amount_paid: u64,
    pub status: SubStatus,
    pub bump: u8,
}

impl Subscription {
    const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 1 + 1;
}

#[account]
#[derive(InitSpace)]
pub struct Plan {
    pub name: String,
    pub token: Pubkey,
    pub price: u64,
    pub plan_type: PlanType,
    pub duration_seconds: i64,
    pub active: bool,
    pub plan_id: u64,
    pub bump: u8,
}

impl Plan {
    const INIT_SPACE: usize = (4 + 64) + 32 + 8 + 1 + 8 + 1 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum SubStatus {
    None,
    Active,
    Paused,
    Cancelled,
    Expired,
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum PlanType {
    Monthly,
    Annual,
}

#[event]
pub struct SubscriptionCreatedEvent {
    pub subscription: Pubkey,
    pub subscriber: Pubkey,
    pub plan_id: u64,
}

#[event]
pub struct SubscriptionRenewedEvent {
    pub subscription: Pubkey,
    pub plan_id: u64,
    pub amount: u64,
}

#[event]
pub struct PlanCreatedEvent {
    pub plan_id: u64,
    pub name: String,
    pub price: u64,
}

#[error_code]
pub enum SubscriptionError {
    #[msg("Plan not found")]
    NotFound,
    #[msg("Plan not active")]
    PlanNotActive,
    #[msg("Subscription not active")]
    NotActive,
    #[msg("Already subscribed")]
    AlreadySubscribed,
}

const GRACE_PERIOD: i64 = 24 * 60 * 60;

pub fn create_subscription(ctx: Context<CreateSubscription>, plan: Account<Plan>) -> Result<()> {
    let sub = &mut ctx.accounts.subscription;
    let clock = ctx.accounts.clock.unix_timestamp();
    
    require!(plan.price > 0 && plan.active, SubscriptionError::PlanNotActive);

    sub.subscriber = ctx.accounts.subscriber.key();
    sub.plan_id = plan.plan_id;
    sub.start_time = clock;
    sub.next_payment_time = clock + plan.duration_seconds;
    sub.amount_paid = plan.price;
    sub.status = SubStatus::Active;
    sub.bump = ctx.bumps.get("subscription").copied().unwrap_or(1);

    emit!(SubscriptionCreatedEvent {
        subscription: sub.key(),
        subscriber: ctx.accounts.subscriber.key(),
        plan_id: plan.plan_id,
    });
    Ok(())
}

pub fn renew_subscription(ctx: Context<CreateSubscription>, plan: Account<Plan>) -> Result<()> {
    let sub = &mut ctx.accounts.subscription;
    require!(sub.status == SubStatus::Active || sub.status == SubStatus::Expired, SubscriptionError::NotActive);
    require!(plan.active, SubscriptionError::PlanNotActive);

    let clock = ctx.accounts.clock.unix_timestamp();
    sub.next_payment_time = clock + plan.duration_seconds;
    sub.amount_paid += plan.price;
    sub.status = SubStatus::Active;

    emit!(SubscriptionRenewedEvent {
        subscription: sub.key(),
        plan_id: plan.plan_id,
        amount: plan.price,
    });
    Ok(())
}

pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
    let sub = &mut ctx.accounts.subscription;
    require!(sub.status == SubStatus::Active, SubscriptionError::NotActive);
    sub.status = SubStatus::Cancelled;
    Ok(())
}

pub fn pause_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
    let sub = &mut ctx.accounts.subscription;
    require!(sub.status == SubStatus::Active, SubscriptionError::NotActive);
    sub.status = SubStatus::Paused;
    Ok(())
}

pub fn resume_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
    let sub = &mut ctx.accounts.subscription;
    require!(sub.status == SubStatus::Paused, SubscriptionError::NotActive);
    sub.status = SubStatus::Active;
    Ok(())
}

pub fn is_active(sub: Subscription) -> Result<bool> {
    let clock = Clock::get()?.unix_timestamp;
    Ok(sub.status == SubStatus::Active && clock < sub.next_payment_time + GRACE_PERIOD)
}

pub fn create_plan(
    ctx: Context<CreatePlan>,
    plan_id: u64,
    name: String,
    token: Pubkey,
    price: u64,
    plan_type: u8,
    duration_seconds: i64,
) -> Result<()> {
    let plan = &mut ctx.accounts.plan;
    require!(price > 0 && duration_seconds > 0, SubscriptionError::NotFound);

    plan.name = name.clone();
    plan.token = token;
    plan.price = price;
    plan.plan_type = match plan_type {
        0 => PlanType::Monthly,
        _ => PlanType::Annual,
    };
    plan.duration_seconds = duration_seconds;
    plan.active = true;
    plan.plan_id = plan_id;
    plan.bump = ctx.bumps.get("plan").copied().unwrap_or(1);

    emit!(PlanCreatedEvent {
        plan_id,
        name,
        price,
    });
    Ok(())
}