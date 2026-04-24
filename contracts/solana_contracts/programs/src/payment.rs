use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + Payment::INIT_SPACE,
        seeds = [b"payment".as_ref(), sender.key().as_ref()],
        bump
    )]
    pub payment: Account<'info, Payment>,
    pub sender: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawFunds<'info> {
    #[account(mut, seeds = [b"payment".as_ref(), user.key().as_ref()], bump = payment.bump)]
    pub payment: Account<'info, Payment>,
    pub user: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Payment {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub token: Pubkey,
    pub currency: String,
    pub status: PaymentStatus,
    pub timestamp: i64,
    pub bump: u8,
}

impl Payment {
    const INIT_SPACE: usize = 32 + 32 + 8 + 32 + (4 + 10) + 1 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
}

#[event]
pub struct PaymentProcessedEvent {
    pub payment: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub token: Pubkey,
}

#[event]
pub struct WithdrawalEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub token: Pubkey,
}

#[error_code]
pub enum PaymentError {
    #[msg("Token not supported")]
    TokenNotSupported,
    #[msg("Amount out of range")]
    AmountOutOfRange,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Below minimum withdrawal")]
    BelowMinimum,
}

const MIN_WITHDRAWAL: u64 = 10_000_000_000;

pub fn process_payment(
    ctx: Context<ProcessPayment>,
    recipient: Pubkey,
    amount: u64,
    token: Pubkey,
    currency: String,
) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    let clock = ctx.accounts.clock.unix_timestamp();

    payment.sender = ctx.accounts.sender.key();
    payment.recipient = recipient;
    payment.amount = amount;
    payment.token = token;
    payment.currency = currency;
    payment.status = PaymentStatus::Completed;
    payment.timestamp = clock;
    payment.bump = ctx.bumps.get("payment").copied().unwrap_or(1);

    emit!(PaymentProcessedEvent {
        payment: payment.key(),
        sender: ctx.accounts.sender.key(),
        recipient,
        amount,
        token,
    });
    Ok(())
}

pub fn batch_process_payment(
    ctx: Context<ProcessPayment>,
    recipient: Pubkey,
    amount: u64,
    token: Pubkey,
) -> Result<()> {
    process_payment(ctx, recipient, amount, token, "SOL".to_string())
}

pub fn withdraw(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
    let payment = &mut ctx.accounts.payment;
    require!(amount >= MIN_WITHDRAWAL, PaymentError::BelowMinimum);
    require!(payment.amount >= amount, PaymentError::InsufficientBalance);

    payment.amount -= amount;

    emit!(WithdrawalEvent {
        user: ctx.accounts.user.key(),
        amount,
        token: payment.token,
    });
    Ok(())
}