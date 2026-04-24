use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash as solana_hash;

#[derive(Accounts)]
pub struct CreateAttestation<'info> {
    #[account(
        init,
        payer = issuer,
        space = 8 + Attestation::INIT_SPACE,
        seeds = [b"attestation".as_ref(), &attestation.key().to_bytes()],
        bump
    )]
    pub attestation: Account<'info, Attestation>,
    pub issuer: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeAttestation<'info> {
    #[account(mut, seeds = [b"attestation".as_ref(), &attestation.key().to_bytes()], bump = attestation.bump)]
    pub attestation: Account<'info, Attestation>,
    pub issuer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Attestation {
    pub recipient: Pubkey,
    pub schema: String,
    pub data: Vec<u8>,
    pub issuer: Pubkey,
    pub issued_at: i64,
    pub expires_at: i64,
    pub revoked: bool,
    pub bump: u8,
}

impl Attestation {
    const INIT_SPACE: usize = 32 + (4 + 64) + (4 + 256) + 32 + 8 + 8 + 1 + 1;
}

#[event]
pub struct AttestationCreatedEvent {
    pub attestation: Pubkey,
    pub recipient: Pubkey,
    pub issuer: Pubkey,
    pub schema: String,
    pub expires_at: i64,
}

#[event]
pub struct AttestationRevokedEvent {
    pub attestation: Pubkey,
    pub revoker: Pubkey,
}

#[error_code]
pub enum AttestationError {
    #[msg("Invalid recipient")]
    InvalidRecipient,
    #[msg("Already revoked")]
    AlreadyRevoked,
    #[msg("Not authorized")]
    NotAuthorized,
}

pub fn create_attestation(
    ctx: Context<CreateAttestation>,
    recipient: Pubkey,
    schema: String,
    data: Vec<u8>,
    expiration_days: i64,
) -> Result<()> {
    let att = &mut ctx.accounts.attestation;
    let clock = ctx.accounts.clock.unix_timestamp();
    
    require!(recipient != Pubkey::default(), AttestationError::InvalidRecipient);
    
    att.recipient = recipient;
    att.schema = schema.clone();
    att.data = data;
    att.issuer = ctx.accounts.issuer.key();
    att.issued_at = clock;
    att.expires_at = clock + (expiration_days * 24 * 60 * 60);
    att.revoked = false;
    att.bump = ctx.bumps.get("attestation").copied().unwrap_or(1);

    emit!(AttestationCreatedEvent {
        attestation: att.key(),
        recipient,
        issuer: att.issuer,
        schema,
        expires_at: att.expires_at,
    });
    Ok(())
}

pub fn revoke_attestation(ctx: Context<RevokeAttestation>) -> Result<()> {
    let att = &mut ctx.accounts.attestation;
    require!(att.issuer == ctx.accounts.issuer.key(), AttestationError::NotAuthorized);
    require!(!att.revoked, AttestationError::AlreadyRevoked);
    
    att.revoked = true;

    emit!(AttestationRevokedEvent {
        attestation: att.key(),
        revoker: ctx.accounts.issuer.key(),
    });
    Ok(())
}

pub fn verify_attestation(ctx: Context<RevokeAttestation>) -> Result<bool> {
    let att = &ctx.accounts.attestation;
    let clock = Clock::get()?.unix_timestamp;
    
    if att.revoked {
        return Ok(false);
    }
    if clock > att.expires_at {
        return Ok(false);
    }
    Ok(true)
}