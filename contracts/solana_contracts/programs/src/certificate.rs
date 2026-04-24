use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(course_id: String, recipient: Pubkey)]
pub struct MintCertificate<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Certificate::INIT_SPACE,
        seeds = [b"cert".as_ref(), recipient.as_ref(), course_id.as_bytes()],
        bump
    )]
    pub certificate: Account<'info, Certificate>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeCertificate<'info> {
    #[account(mut, seeds = [b"cert".as_ref(), certificate.recipient.as_ref(), certificate.course_id.as_bytes()], bump = certificate.bump)]
    pub certificate: Account<'info, Certificate>,
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Certificate {
    pub recipient: Pubkey,
    pub recipient_name: String,
    pub course_title: String,
    pub course_id: String,
    pub completion_date: i64,
    pub instructor_name: String,
    pub verification_hash: String,
    pub is_valid: bool,
    pub bump: u8,
}

impl Certificate {
    const INIT_SPACE: usize = 32 + (4 + 64) + (4 + 128) + (4 + 64) + 8 + (4 + 64) + (4 + 64) + 1 + 1;
}

#[event]
pub struct CertificateMintedEvent {
    pub certificate: Pubkey,
    pub recipient: Pubkey,
    pub course_id: String,
    pub verification_hash: String,
}

#[event]
pub struct CertificateRevokedEvent {
    pub certificate: Pubkey,
}

#[error_code]
pub enum CertificateError {
    #[msg("Only minter allowed")]
    OnlyMinter,
    #[msg("Already minted")]
    AlreadyMinted,
    #[msg("Certificate not found")]
    NotFound,
}

pub fn mint_certificate(
    ctx: Context<MintCertificate>,
    course_id: String,
    recipient: Pubkey,
    recipient_name: String,
    course_title: String,
    instructor_name: String,
    verification_hash: String,
) -> Result<()> {
    let cert = &mut ctx.accounts.certificate;
    let clock = ctx.accounts.clock.unix_timestamp();

    cert.recipient = recipient;
    cert.recipient_name = recipient_name;
    cert.course_title = course_title.clone();
    cert.course_id = course_id.clone();
    cert.completion_date = clock;
    cert.instructor_name = instructor_name;
    cert.verification_hash = verification_hash.clone();
    cert.is_valid = true;
    cert.bump = ctx.bumps.get("certificate").copied().unwrap_or(1);

    emit!(CertificateMintedEvent {
        certificate: cert.key(),
        recipient,
        course_id,
        verification_hash,
    });
    Ok(())
}

pub fn verify_certificate(ctx: Context<RevokeCertificate>) -> Result<bool> {
    Ok(ctx.accounts.certificate.is_valid)
}

pub fn verify_certificate_by_hash(_hash: String) -> Result<bool> {
    Ok(false)
}