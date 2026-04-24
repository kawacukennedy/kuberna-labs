use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(
        init,
        payer = creator,
        space = 8 + Multisig::INIT_SPACE,
        seeds = [b"multisig".as_ref()],
        bump
    )]
    pub multisig: Account<'info, Multisig>,
    pub creator: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tx_id: u64)]
pub struct SubmitTransaction<'info> {
    #[account(mut, seeds = [b"multisig".as_ref()], bump = multisig.bump)]
    pub multisig: Account<'info, Multisig>,
    #[account(
        init,
        payer = submitter,
        space = 8 + Transaction::INIT_SPACE,
        seeds = [b"tx".as_ref(), &tx_id.to_le_bytes()],
        bump
    )]
    pub transaction: Account<'info, Transaction>,
    pub submitter: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(tx_id: u64)]
pub struct ConfirmTransaction<'info> {
    #[account(mut, seeds = [b"multisig".as_ref()], bump = multisig.bump)]
    pub multisig: Account<'info, Multisig>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(tx_id: u64)]
pub struct ExecuteTransaction<'info> {
    #[account(mut, seeds = [b"multisig".as_ref()], bump = multisig.bump)]
    pub multisig: Account<'info, Multisig>,
    #[account(mut, seeds = [b"tx".as_ref(), &tx_id.to_le_bytes()], bump = transaction.bump)]
    pub transaction: Account<'info, Transaction>,
    pub executor: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Multisig {
    #[max_len(10)]
    pub owners: Vec<Pubkey>,
    pub threshold: u8,
    pub nonce: u64,
    pub last_executed: i64,
    pub bump: u8,
}

impl Multisig {
    const INIT_SPACE: usize = (4 + 100) + 1 + 8 + 8 + 1;
}

#[account]
#[derive(InitSpace)]
pub struct Transaction {
    pub to: Pubkey,
    pub token: Pubkey,
    pub amount: u64,
    pub data: Vec<u8>,
    pub executed: bool,
    pub confirmation_count: u8,
    pub tx_id: u64,
    pub bump: u8,
    #[max_len(20)]
    pub confirmations: Vec<Pubkey>,
}

impl Transaction {
    const INIT_SPACE: usize = 32 + 32 + 8 + (4 + 256) + 1 + 1 + 8 + 1 + (4 + 400);
}

#[event]
pub struct MultisigCreatedEvent {
    pub multisig: Pubkey,
    pub threshold: u8,
}

#[event]
pub struct TransactionSubmittedEvent {
    pub multisig: Pubkey,
    pub tx_id: u64,
    pub to: Pubkey,
    pub amount: u64,
}

#[event]
pub struct TransactionConfirmedEvent {
    pub multisig: Pubkey,
    pub tx_id: u64,
    pub owner: Pubkey,
}

#[event]
pub struct TransactionExecutedEvent {
    pub multisig: Pubkey,
    pub tx_id: u64,
}

#[error_code]
pub enum MultisigError {
    #[msg("Not an owner")]
    NotOwner,
    #[msg("Threshold not met")]
    ThresholdNotMet,
}

pub fn create_multisig(ctx: Context<CreateMultisig>, owners: Vec<Pubkey>, threshold: u8) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    require!(!owners.is_empty(), MultisigError::NotOwner);
    require!(threshold > 0 && threshold <= owners.len() as u8, MultisigError::ThresholdNotMet);

    multisig.owners = owners;
    multisig.threshold = threshold;
    multisig.nonce = 0;
    multisig.last_executed = ctx.accounts.clock.unix_timestamp();
    multisig.bump = ctx.bumps.get("multisig").copied().unwrap_or(1);

    emit!(MultisigCreatedEvent {
        multisig: multisig.key(),
        threshold,
    });
    Ok(())
}

pub fn submit_transaction(
    ctx: Context<SubmitTransaction>,
    to: Pubkey,
    token: Pubkey,
    amount: u64,
    data: Vec<u8>,
) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    require!(multisig.owners.contains(&ctx.accounts.submitter.key()), MultisigError::NotOwner);

    let tx = &mut ctx.accounts.transaction;
    tx.to = to;
    tx.token = token;
    tx.amount = amount;
    tx.data = data;
    tx.executed = false;
    tx.confirmation_count = 0;
    tx.tx_id = multisig.nonce;
    tx.bump = ctx.bumps.get("transaction").copied().unwrap_or(1);
    tx.confirmations = vec![];

    multisig.nonce += 1;

    emit!(TransactionSubmittedEvent {
        multisig: multisig.key(),
        tx_id: tx.tx_id,
        to,
        amount,
    });
    Ok(())
}

pub fn confirm_transaction(ctx: Context<ConfirmTransaction>, tx_id: u64) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    let owner = ctx.accounts.owner.key();
    require!(multisig.owners.contains(&owner), MultisigError::NotOwner);
    
    let tx = &mut ctx.accounts.transaction;
    require!(tx.confirmation_count < multisig.threshold, MultisigError::ThresholdNotMet);
    
    if !tx.confirmations.contains(&owner) {
        tx.confirmations.push(owner);
        tx.confirmation_count += 1;
    }

    emit!(TransactionConfirmedEvent {
        multisig: multisig.key(),
        tx_id,
        owner,
    });
    Ok(())
}

pub fn execute_transaction(ctx: Context<ExecuteTransaction>, tx_id: u64) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    let executor = ctx.accounts.executor.key();
    require!(multisig.owners.contains(&executor), MultisigError::NotOwner);

    let tx = &mut ctx.accounts.transaction;
    require!(tx.confirmation_count >= multisig.threshold, MultisigError::ThresholdNotMet);
    require!(!tx.executed, MultisigError::ThresholdNotMet);

    tx.executed = true;
    multisig.last_executed = Clock::get()?.unix_timestamp;

    emit!(TransactionExecutedEvent {
        multisig: multisig.key(),
        tx_id,
    });
    Ok(())
}

pub fn add_owner(ctx: Context<ConfirmTransaction>, owner: Pubkey) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    require!(!multisig.owners.contains(&owner), MultisigError::NotOwner);
    
    multisig.owners.push(owner);
    Ok(())
}

pub fn remove_owner(ctx: Context<ConfirmTransaction>, owner: Pubkey) -> Result<()> {
    let multisig = &mut ctx.accounts.multisig;
    let index = multisig.owners.iter().position(|&x| x == owner);
    require!(index.is_some(), MultisigError::NotOwner);
    require!((multisig.owners.len() - 1) >= multisig.threshold as usize, MultisigError::ThresholdNotMet);
    
    if let Some(idx) = index {
        multisig.owners.remove(idx);
    }
    Ok(())
}