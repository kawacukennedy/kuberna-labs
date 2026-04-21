use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
pub struct MintCertificate<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Certificate::INIT_SPACE,
        seeds = [b"certificate".as_ref(), recipient.key().as_ref(), course_id.as_ref()],
        bump
    )]
    pub certificate: Account<'info, Certificate>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyCertificate<'info> {
    pub certificate: Account<'info, Certificate>,
}

#[account]
#[derive(InitSpace)]
pub struct Certificate {
    pub recipient: Pubkey,
    pub course_id: String,
    pub metadata_uri: String,
    pub minted_at: i64,
    pub bump: u8,
}

impl Certificate {
    const INIT_SPACE: usize = 32 + (4 + 64) + (4 + 128) + 8 + 1;
}

#[event]
pub struct CertificateMinted {
    pub certificate: Pubkey,
    pub recipient: Pubkey,
    pub course_id: String,
}

#[event]
pub struct CertificateVerified {
    pub certificate: Pubkey,
    pub recipient: Pubkey,
    pub course_id: String,
}

#[error_code]
pub enum CertificateError {
    #[msg("Unauthorized")]
    Unauthorized,
}

#[program]
pub mod kuberna_certificate {
    use super::*;

    pub fn mint_certificate(
        ctx: Context<MintCertificate>,
        course_id: String,
        recipient: Pubkey,
        metadata_uri: String,
    ) -> Result<()> {
        let certificate = &mut ctx.accounts.certificate;
        certificate.recipient = recipient;
        certificate.course_id = course_id.clone();
        certificate.metadata_uri = metadata_uri;
        certificate.minted_at = ctx.accounts.clock.unix_timestamp();
        certificate.bump = ctx.bumps.get("certificate").copied().unwrap_or(1);

        emit!(CertificateMinted {
            certificate: certificate.key(),
            recipient,
            course_id,
        });
        Ok(())
    }

    pub fn verify_certificate(ctx: Context<VerifyCertificate>) -> Result<bool> {
        let cert = &ctx.accounts.certificate;
        emit!(CertificateVerified {
            certificate: cert.key(),
            recipient: cert.recipient,
            course_id: cert.course_id.clone(),
        });
        Ok(true)
    }
}

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
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub sender: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub clock: Sysvar<'info, Clock>,
}

#[account]
#[derive(InitSpace)]
pub struct Payment {
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub currency: String,
    pub status: PaymentStatus,
    pub timestamp: i64,
    pub bump: u8,
}

impl Payment {
    const INIT_SPACE: usize = 32 + 32 + 8 + (4 + 10) + 1 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum PaymentStatus {
    Pending,
    Completed,
    Failed,
}

#[event]
pub struct PaymentProcessed {
    pub payment: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
}

#[program]
pub mod kuberna_payment {
    use super::*;

    pub fn process_payment(ctx: Context<ProcessPayment>, amount: u64) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        payment.sender = ctx.accounts.sender.key();
        payment.recipient = ctx.accounts.to.key();
        payment.amount = amount;
        payment.currency = "0G".to_string();
        payment.status = PaymentStatus::Completed;
        payment.timestamp = ctx.accounts.clock.unix_timestamp();
        payment.bump = ctx.bumps.get("payment").copied().unwrap_or(1);

        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.to.to_account_info(),
                authority: ctx.accounts.sender.to_account_info(),
            },
        );
        anchor_spl::token::transfer(cpi_ctx, amount)?;

        emit!(PaymentProcessed {
            payment: payment.key(),
            sender: ctx.accounts.sender.key(),
            recipient: ctx.accounts.to.key(),
            amount,
        });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateDispute<'info> {
    #[account(
        init,
        payer = raiser,
        space = 8 + Dispute::INIT_SPACE,
        seeds = [b"dispute".as_ref(), intent_id.as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    pub raiser: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut, seeds = [b"dispute".as_ref(), intent_id.as_ref()], bump = dispute.bump)]
    pub dispute: Account<'info, Dispute>,
    pub resolver: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Dispute {
    pub raiser: Pubkey,
    pub intent_id: String,
    pub reason: String,
    pub status: DisputeStatus,
    pub created_at: i64,
    pub bump: u8,
}

impl Dispute {
    const INIT_SPACE: usize = 32 + (4 + 64) + (4 + 256) + 1 + 8 + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
#[repr(u8)]
pub enum DisputeStatus {
    Open,
    Resolved,
    Rejected,
}

#[event]
pub struct DisputeCreated {
    pub dispute: Pubkey,
    pub raiser: Pubkey,
}

#[program]
pub mod kuberna_dispute {
    use super::*;

    pub fn create_dispute(
        ctx: Context<CreateDispute>,
        intent_id: String,
        reason: String,
    ) -> Result<()> {
        let dispute = &mut ctx.accounts.dispute;
        dispute.raiser = ctx.accounts.raiser.key();
        dispute.intent_id = intent_id;
        dispute.reason = reason;
        dispute.status = DisputeStatus::Open;
        dispute.created_at = ctx.accounts.clock.unix_timestamp();
        dispute.bump = ctx.bumps.get("dispute").copied().unwrap_or(1);

        emit!(DisputeCreated {
            dispute: dispute.key(),
            raiser: ctx.accounts.raiser.key(),
        });
        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, _resolution: String) -> Result<()> {
        let dispute = &mut ctx.accounts.dispute;
        dispute.status = DisputeStatus::Resolved;
        Ok(())
    }
}
