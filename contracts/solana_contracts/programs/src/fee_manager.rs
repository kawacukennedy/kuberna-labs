use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct SetFee<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + FeeManager::INIT_SPACE,
        seeds = [b"fee_manager".as_ref()],
        bump
    )]
    pub fee_manager: Account<'info, FeeManager>,
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectFee<'info> {
    #[account(mut, seeds = [b"fee_manager".as_ref()], bump = fee_manager.bump)]
    pub fee_manager: Account<'info, FeeManager>,
}

#[derive(Accounts)]
#[instruction(account: Pubkey)]
pub struct DistributeFees<'info> {
    #[account(mut, seeds = [b"fee_manager".as_ref()], bump = fee_manager.bump)]
    pub fee_manager: Account<'info, FeeManager>,
    pub recipient: SystemAccount<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct FeeManager {
    pub admin: Pubkey,
    pub platform_fee: u64,
    pub collected_fees: u64,
    pub bump: u8,
    #[max_len(20)]
    pub recipients: Vec<RecipientInfo>,
    #[max_len(10)]
    pub tiers: Vec<FeeTier>,
}

impl FeeManager {
    const INIT_SPACE: usize = 32 + 8 + 8 + 1 + (4 + 400) + (4 + 100);
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
pub struct RecipientInfo {
    pub account: Pubkey,
    pub share: u64,
    pub active: bool,
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize, Space)]
pub struct FeeTier {
    pub threshold: u64,
    pub percentage: u64,
}

#[event]
pub struct FeeDistributedEvent {
    pub recipient: Pubkey,
    pub amount: u64,
}

#[event]
pub struct FeeCollectedEvent {
    pub amount: u64,
}

#[error_code]
pub enum FeeError {
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Insufficient fees")]
    InsufficientFees,
    #[msg("Total shares exceed 10000")]
    SharesExceedLimit,
}

const BPS_DENOMINATOR: u64 = 10000;

pub fn add_recipient(ctx: Context<DistributeFees>, account: Pubkey, share: u64) -> Result<()> {
    let fee_manager = &mut ctx.accounts.fee_manager;
    require!(fee_manager.admin == ctx.accounts.authority.key(), FeeError::Unauthorized);
    
    let total_shares: u64 = fee_manager.recipients.iter()
        .filter(|r| r.active)
        .map(|r| r.share)
        .sum();
    
    require!(total_shares + share <= BPS_DENOMINATOR, FeeError::SharesExceedLimit);
    
    fee_manager.recipients.push(RecipientInfo {
        account,
        share,
        active: true,
    });
    
    Ok(())
}

pub fn remove_recipient(ctx: Context<DistributeFees>, account: Pubkey) -> Result<()> {
    let fee_manager = &mut ctx.accounts.fee_manager;
    require!(fee_manager.admin == ctx.accounts.authority.key(), FeeError::Unauthorized);
    
    for recipient in fee_manager.recipients.iter_mut() {
        if recipient.account == account {
            recipient.active = false;
            break;
        }
    }
    
    Ok(())
}

pub fn collect_fee(ctx: Context<DistributeFees>, amount: u64) -> Result<()> {
    let fee_manager = &mut ctx.accounts.fee_manager;
    
    let platform_amount = (amount * fee_manager.platform_fee) / BPS_DENOMINATOR;
    fee_manager.collected_fees += platform_amount;

    emit!(FeeCollectedEvent {
        amount: platform_amount,
    });
    Ok(())
}

pub fn distribute_fees(ctx: Context<DistributeFees>, amount: u64) -> Result<()> {
    let fee_manager = &mut ctx.accounts.fee_manager;
    require!(amount > 0, FeeError::InsufficientFees);

    let platform_amount = (amount * fee_manager.platform_fee) / BPS_DENOMINATOR;
    let distribute_amount = amount - platform_amount;

    for recipient in fee_manager.recipients.iter() {
        if !recipient.active {
            continue;
        }
        
        let share_amount = (distribute_amount * recipient.share) / BPS_DENOMINATOR;
        if share_amount == 0 {
            continue;
        }

        emit!(FeeDistributedEvent {
            recipient: recipient.account,
            amount: share_amount,
        });
    }
    
    Ok(())
}

pub fn get_tier_fee(tiers: Vec<FeeTier>, volume: u64) -> Result<u64> {
    for tier in tiers.iter().rev() {
        if volume >= tier.threshold {
            return Ok(tier.percentage);
        }
    }
    Ok(250)
}