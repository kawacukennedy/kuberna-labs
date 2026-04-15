use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount, Transfer};

#[program]
pub mod kuberna_escrow {
    use super::*;

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        intent_id: String,
        amount: u64,
        _duration_seconds: i64,
    ) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.requester = ctx.accounts.requester.key();
        escrow.executor = None;
        escrow.token_mint = ctx.accounts.token_mint.key();
        escrow.amount = amount;
        escrow.fee = (amount * 250) / 10000;
        escrow.status = EscrowStatus::Created;
        escrow.intent_id = intent_id;
        escrow.bump = ctx.bumps.escrow;
        
        // Transfer tokens from requester to escrow vault
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.from.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.requester.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, amount)?;
        
        emit!(EscrowCreated {
            escrow: escrow.key(),
            requester: ctx.accounts.requester.key(),
            amount,
        });
        Ok(())
    }

    pub fn assign_executor(ctx: Context<AssignExecutor>, executor: Pubkey) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.requester == ctx.accounts.requester.key(), EscrowError::Unauthorized);
        require!(escrow.status == EscrowStatus::Funded, EscrowError::InvalidState);
        
        escrow.executor = Some(executor);
        escrow.status = EscrowStatus::Assigned;
        
        emit!(ExecutorAssigned { escrow: escrow.key(), executor });
        Ok(())
    }

    pub fn complete_task(ctx: Context<CompleteTask>, _proof: [u8; 32]) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(
            escrow.executor == Some(ctx.accounts.executor.key()),
            EscrowError::Unauthorized
        );
        require!(escrow.status == EscrowStatus::Assigned, EscrowError::InvalidState);
        
        escrow.status = EscrowStatus::Completed;
        
        emit!(TaskCompleted { escrow: escrow.key() });
        Ok(())
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        require!(escrow.requester == ctx.accounts.requester.key(), EscrowError::Unauthorized);
        require!(escrow.status == EscrowStatus::Completed, EscrowError::InvalidState);
        
        let executor = escrow.executor.unwrap();
        let amount = escrow.amount;
        
        // Transfer to executor via CPI (simplified)
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.executor_token.to_account_info(),
                authority: ctx.accounts.vault.to_account_info(),
            },
        );
        // Note: In production, use PDA for vault authority
        
        escrow.status = EscrowStatus::Released;
        
        emit!(FundsReleased { escrow: escrow.key(), executor, amount });
        Ok(())
    }

    pub fn raise_dispute(ctx: Context<RaiseDispute>, _reason: String) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        let disputer = ctx.accounts.disputer.key();
        
        require!(
            disputer == escrow.requester || escrow.executor == Some(disputer),
            EscrowError::Unauthorized
        );
        
        escrow.status = EscrowStatus::Disputed;
        
        emit!(DisputeRaised { escrow: escrow.key(), raiser: disputer });
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(
        init,
        payer = requester,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow".as_ref(), intent_id.as_ref()],
        bump
    )]
    pub escrow: Account<'info, Escrow>,
    #[account(
        init,
        payer = requester,
        associated_token::mint = token_mint,
        associated_token::authority = escrow,
        seeds = [b"vault".as_ref(), intent_id.as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    pub token_mint: Account<'info, token::Mint>,
    pub requester: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignExecutor<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    #[account(mut)]
    pub vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub executor_token: Account<'info, TokenAccount>,
    pub requester: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut, seeds = [b"escrow".as_ref(), intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub disputer: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub requester: Pubkey,
    pub executor: Option<Pubkey>,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub status: EscrowStatus,
    pub intent_id: String,
    pub bump: u8,
}

impl Escrow {
    const INIT_SPACE: usize = 32 + 32 + 32 + 8 + 8 + 1 + (4 + 64) + 1;
}

#[derive(Clone, Debug, PartialEq, AnchorSerialize, AnchorDeserialize)]
pub enum EscrowStatus {
    Created,
    Funded,
    Assigned,
    Completed,
    Disputed,
    Released,
}

#[event]
pub struct EscrowCreated {
    pub escrow: Pubkey,
    pub requester: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ExecutorAssigned {
    pub escrow: Pubkey,
    pub executor: Pubkey,
}

#[event]
pub struct TaskCompleted {
    pub escrow: Pubkey,
}

#[event]
pub struct FundsReleased {
    pub escrow: Pubkey,
    pub executor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct DisputeRaised {
    pub escrow: Pubkey,
    pub raiser: Pubkey,
}

#[error_code]
pub enum EscrowError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Invalid state")]
    InvalidState,
    #[msg("Deadline passed")]
    DeadlinePassed,
}