use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount, Metadata as TokenMetadata};
use anchor_spl::metadata::MetadataAccount;

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
        certificate.bump = ctx.bumps.certificate;

        // Mint NFT using token program
        // Note: Full implementation would use metaplex for metadata
        
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
pub struct MintCertificate<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Certificate::INIT_SPACE,
        seeds = [b"certificate".as_ref(), recipient.as_ref(), course_id.as_ref()],
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

#[program]
pub mod kuberna_payment {
    use super::*;

    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        recipient: Pubkey,
        amount: u64,
    ) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        payment.sender = ctx.accounts.sender.key();
        payment.recipient = recipient;
        payment.amount = amount;
        payment.currency = "0G".to_string();
        payment.status = PaymentStatus::Completed;
        payment.timestamp = ctx.accounts.clock.unix_timestamp();
        payment.bump = ctx.bumps.payment;
        
        emit!(PaymentProcessed {
            payment: payment.key(),
            sender: ctx.accounts.sender.key(),
            recipient,
            amount,
        });
        Ok(())
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
    pub sender: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
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

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
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