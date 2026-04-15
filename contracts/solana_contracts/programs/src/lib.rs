use anchor_lang::prelude::*;
use anchor_spl::token::{Token, Mint, TokenAccount, Transfer};

#[program]
pub mod kuberna_contracts {
    use super::*;

    // ============ ESCROW ============
    pub fn create_escrow(ctx: Context<CreateEscrow>, intent_id: String, amount: u64, duration: i64) -> Result<()> {
        let escrow = &mut ctx.accounts.escrow;
        escrow.requester = ctx.accounts.requester.key();
        escrow.amount = amount;
        escrow.fee = (amount * 250) / 10000;
        escrow.deadline = ctx.accounts.clock.unix_timestamp() + duration;
        escrow.status = 0;
        escrow.intent_id = intent_id;
        escrow.bump = ctx.bumps.escrow;
        emit!(EscrowCreated { escrow: escrow.key(), requester: escrow.requester, amount });
        Ok(())
    }

    pub fn assign_executor(ctx: Context<AssignExecutor>, executor: Pubkey) -> Result<()> {
        let e = &mut ctx.accounts.escrow;
        require!(e.requester == ctx.accounts.requester.key() && e.status == 1);
        e.executor = Some(executor);
        e.status = 2;
        emit!(ExecutorAssigned { escrow: e.key(), executor });
        Ok(())
    }

    pub fn complete_task(ctx: Context<CompleteTask>, proof: [u8; 32]) -> Result<()> {
        let e = &mut ctx.accounts.escrow;
        require!(e.executor == Some(ctx.accounts.executor.key()) && e.status == 2);
        e.status = 3;
        emit!(TaskCompleted { escrow: e.key(), proof });
        Ok(())
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        let e = &mut ctx.accounts.escrow;
        require!(e.requester == ctx.accounts.requester.key() && e.status == 3);
        e.status = 5;
        emit!(FundsReleased { escrow: e.key(), executor: e.executor.unwrap(), amount: e.amount });
        Ok(())
    }

    // ============ INTENT ============
    pub fn create_intent(ctx: Context<CreateIntent>, intent_id: String, budget: u64, description: String) -> Result<()> {
        let intent = &mut ctx.accounts.intent;
        intent.requester = ctx.accounts.requester.key();
        intent.budget = budget;
        intent.status = 0;
        intent.intent_id = intent_id;
        intent.description = description;
        intent.bump = ctx.bumps.intent;
        emit!(IntentCreated { intent: intent.key(), requester: intent.requester, budget });
        Ok(())
    }

    pub fn submit_bid(ctx: Context<SubmitBid>, bid_id: String, price: u64, eta: i64) -> Result<()> {
        let i = &mut ctx.accounts.intent;
        require!(i.status == 0);
        let bid = &mut ctx.accounts.bid;
        bid.agent = ctx.accounts.agent.key();
        bid.intent = i.key();
        bid.price = price;
        bid.status = 0;
        bid.eta = eta;
        bid.bid_id = bid_id;
        bid.bump = ctx.bumps.bid;
        emit!(BidSubmitted { bid: bid.key(), agent: bid.agent, intent: i.key(), price });
        Ok(())
    }

    pub fn accept_bid(ctx: Context<AcceptBid>) -> Result<()> {
        let i = &mut ctx.accounts.intent;
        let b = &mut ctx.accounts.bid;
        require!(i.requester == ctx.accounts.requester.key() && i.status == 0 && b.status == 0);
        i.status = 2;
        b.status = 1;
        emit!(BidAccepted { intent: i.key(), bid: b.key() });
        Ok(())
    }

    // ============ CERTIFICATE ============
    pub fn mint_certificate(ctx: Context<MintCertificate>, course_id: String, recipient: Pubkey, metadata: String) -> Result<()> {
        let cert = &mut ctx.accounts.certificate;
        cert.recipient = recipient;
        cert.course_id = course_id.clone();
        cert.metadata = metadata;
        cert.minted_at = ctx.accounts.clock.unix_timestamp();
        cert.bump = ctx.bumps.certificate;
        emit!(CertificateMinted { certificate: cert.key(), recipient, course_id });
        Ok(())
    }

    pub fn verify_certificate(ctx: Context<VerifyCertificate>) -> Result<bool> {
        emit!(CertificateVerified { certificate: ctx.accounts.certificate.key() });
        Ok(true)
    }

    // ============ PAYMENT ============
    pub fn process_payment(ctx: Context<ProcessPayment>, recipient: Pubkey, amount: u64, currency: String) -> Result<()> {
        let payment = &mut ctx.accounts.payment;
        payment.sender = ctx.accounts.sender.key();
        payment.recipient = recipient;
        payment.amount = amount;
        payment.currency = currency;
        payment.status = 1;
        payment.timestamp = ctx.accounts.clock.unix_timestamp();
        payment.bump = ctx.bumps.payment;
        emit!(PaymentProcessed { payment: payment.key(), sender: payment.sender, recipient, amount });
        Ok(())
    }

    // ============ AGENT ============
    pub fn register_agent(ctx: Context<RegisterAgent>, name: String, description: String, framework: String) -> Result<()> {
        let agent = &mut ctx.accounts.agent;
        agent.owner = ctx.accounts.owner.key();
        agent.name = name.clone();
        agent.description = description;
        agent.framework = framework;
        agent.status = 0;
        agent.total_tasks = 0;
        agent.successful_tasks = 0;
        agent.created_at = ctx.accounts.clock.unix_timestamp();
        agent.bump = ctx.bumps.agent;
        emit!(AgentRegistered { agent: agent.key(), owner: agent.owner, name });
        Ok(())
    }

    pub fn update_agent_status(ctx: Context<UpdateStatus>, new_status: u8) -> Result<()> {
        let a = &mut ctx.accounts.agent;
        require!(a.owner == ctx.accounts.owner.key());
        a.status = new_status;
        emit!(AgentStatusChanged { agent: a.key(), status: new_status });
        Ok(())
    }

    pub fn record_task(ctx: Context<RecordTask>, success: bool) -> Result<()> {
        let a = &mut ctx.accounts.agent;
        require!(a.owner == ctx.accounts.owner.key());
        a.total_tasks += 1;
        if success { a.successful_tasks += 1; }
        a.last_active = ctx.accounts.clock.unix_timestamp();
        emit!(TaskRecorded { agent: a.key(), success, total: a.total_tasks });
        Ok(())
    }

    // ============ SUBSCRIPTION ============
    pub fn create_subscription(ctx: Context<CreateSubscription>, plan_id: u8, amount: u64) -> Result<()> {
        let sub = &mut ctx.accounts.subscription;
        sub.subscriber = ctx.accounts.subscriber.key();
        sub.plan_id = plan_id;
        sub.amount = amount;
        sub.start_time = ctx.accounts.clock.unix_timestamp();
        sub.next_payment = sub.start_time + 30 * 86400;
        sub.status = 0;
        sub.bump = ctx.bumps.subscription;
        emit!(SubscriptionCreated { subscription: sub.key(), subscriber: sub.subscriber, plan_id, amount });
        Ok(())
    }

    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        let s = &mut ctx.accounts.subscription;
        require!(s.subscriber == ctx.accounts.subscriber.key() && s.status == 0);
        s.status = 2;
        emit!(SubscriptionCancelled { subscription: s.key() });
        Ok(())
    }

    // ============ DISPUTE ============
    pub fn raise_dispute(ctx: Context<RaiseDisputeTask>, reason: String) -> Result<()> {
        let d = &mut ctx.accounts.dispute;
        d.task_id = ctx.accounts.task.key();
        d.raiser = ctx.accounts.raiser.key();
        d.reason = reason;
        d.status = 0;
        d.created_at = ctx.accounts.clock.unix_timestamp();
        d.bump = ctx.bumps.dispute;
        emit!(DisputeRaised { dispute: d.key(), task: d.task_id, raiser: d.raiser });
        Ok(())
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>, ruling: u8) -> Result<()> {
        let d = &mut ctx.accounts.dispute;
        require!(d.status == 0);
        d.status = ruling;
        d.resolved_at = ctx.accounts.clock.unix_timestamp();
        emit!(DisputeResolved { dispute: d.key(), ruling });
        Ok(())
    }

    // ============ TREASURY ============
    pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
        let t = &mut ctx.accounts.treasury;
        t.balance += amount;
        t.last_funded = ctx.accounts.clock.unix_timestamp();
        emit!(TreasuryFunded { treasury: t.key(), amount, balance: t.balance });
        Ok(())
    }

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, recipient: Pubkey, amount: u64) -> Result<()> {
        let t = &mut ctx.accounts.treasury;
        require!(t.balance >= amount);
        t.balance -= amount;
        emit!(TreasuryWithdrawn { treasury: t.key(), recipient, amount });
        Ok(())
    }

    // ============ FEE MANAGER ============
    pub fn set_fee(ctx: Context<SetFee>, fee_type: u8, new_fee: u64) -> Result<()> {
        let f = &mut ctx.accounts.fee;
        match fee_type {
            0 => f.platform_fee = new_fee,
            1 => f.agent_fee = new_fee,
            _ => return err!(FeeError::InvalidFeeType),
        }
        emit!(FeeUpdated { fee_type, new_fee });
        Ok(())
    }

    pub fn collect_fee(ctx: Context<CollectFee>, amount: u64) -> Result<()> {
        let f = &mut ctx.accounts.fee;
        let fee_amount = (amount * f.platform_fee) / 10000;
        f.collected += fee_amount;
        emit!(FeeCollected { amount, fee: fee_amount });
        Ok(())
    }

    // ============ WORKSHOP ============
    pub fn create_workshop(ctx: Context<CreateWorkshop>, title: String, max_participants: u32) -> Result<()> {
        let w = &mut ctx.accounts.workshop;
        w.instructor = ctx.accounts.instructor.key();
        w.title = title;
        w.max_participants = max_participants;
        w.current_participants = 0;
        w.start_time = ctx.accounts.clock.unix_timestamp();
        w.bump = ctx.bumps.workshop;
        emit!(WorkshopCreated { workshop: w.key(), instructor: w.instructor });
        Ok(())
    }

    pub fn register_workshop(ctx: Context<RegisterWorkshop>) -> Result<()> {
        let w = &mut ctx.accounts.workshop;
        require!(w.current_participants < w.max_participants);
        w.registered_participants.push(ctx.accounts.participant.key());
        w.current_participants += 1;
        emit!(ParticipantRegistered { workshop: w.key(), participant: ctx.accounts.participant.key() });
        Ok(())
    }

    // ============ COURSE NFT ============
    pub fn mint_course_access(ctx: Context<MintCourse>, course_id: String, recipient: Pubkey) -> Result<()> {
        let c = &mut ctx.accounts.course;
        c.recipient = recipient;
        c.course_id = course_id;
        c.enrolled_at = ctx.accounts.clock.unix_timestamp();
        c.bump = ctx.bumps.course;
        emit!(CourseMinted { course: c.key(), recipient });
        Ok(())
    }

    // ============ MULTISIG ============
    pub fn create_multisig(ctx: Context<CreateMultisig>, threshold: u8) -> Result<()> {
        let m = &mut ctx.accounts.multisig;
        m.owners = ctx.accounts.owners.to_vec();
        m.threshold = threshold;
        m.bump = ctx.bumps.multisig;
        emit!(MultisigCreated { multisig: m.key() });
        Ok(())
    }

    // ============ VESTING ============
    pub fn create_vesting(ctx: Context<CreateVesting>, beneficiary: Pubkey, total_amount: u64, duration: i64) -> Result<()> {
        let v = &mut ctx.accounts.vesting;
        v.beneficiary = beneficiary;
        v.total_amount = total_amount;
        v.released = 0;
        v.start_time = ctx.accounts.clock.unix_timestamp();
        v.end_time = v.start_time + duration;
        v.bump = ctx.bumps.vesting;
        emit!(VestingCreated { vesting: v.key(), beneficiary, total_amount });
        Ok(())
    }

    // ============ GOVERNANCE ============
    pub fn create_proposal(ctx: Context<CreateProposal>, description: String) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        p.creator = ctx.accounts.creator.key();
        p.description = description;
        p.votes_for = 0;
        p.votes_against = 0;
        p.status = 0;
        p.bump = ctx.bumps.proposal;
        emit!(ProposalCreated { proposal: p.key() });
        Ok(())
    }

    pub fn vote(ctx: Context<Vote>, support: bool) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        if support { p.votes_for += 1; } else { p.votes_against += 1; }
        emit!(VoteCast { proposal: p.key(), voter: ctx.accounts.voter.key(), support });
        Ok(())
    }

    // ============ PRICE ORACLE ============
    pub fn set_price(ctx: Context<SetPrice>, price: u64) -> Result<()> {
        let o = &mut ctx.accounts.oracle;
        o.price = price;
        o.updated_at = ctx.accounts.clock.unix_timestamp();
        o.bump = ctx.bumps.oracle;
        emit!(PriceUpdated { oracle: o.key(), price });
        Ok(())
    }

    pub fn get_price(ctx: Context<GetPrice>) -> Result<u64> {
        Ok(ctx.accounts.oracle.price)
    }

    // ============ ATTESTATION ============
    pub fn create_attestation(ctx: Context<CreateAttestation>, schema: String, data: String) -> Result<()> {
        let a = &mut ctx.accounts.attestation;
        a.issuer = ctx.accounts.issuer.key();
        a.schema = schema;
        a.data = data;
        a.valid = true;
        a.created_at = ctx.accounts.clock.unix_timestamp();
        a.bump = ctx.bumps.attestation;
        emit!(AttestationCreated { attestation: a.key(), issuer: a.issuer });
        Ok(())
    }

    pub fn revoke_attestation(ctx: Context<RevokeAttestation>) -> Result<()> {
        let a = &mut ctx.accounts.attestation;
        require!(a.issuer == ctx.accounts.issuer.key());
        a.valid = false;
        emit!(AttestationRevoked { attestation: a.key() });
        Ok(())
    }

    // ============ CROSSCHAIN ROUTER ============
    pub fn set_remote_chain(ctx: Context<SetRemoteChain>, chain_id: u32, router: Pubkey) -> Result<()> {
        let r = &mut ctx.accounts.router;
        r.chain_id = chain_id;
        r.remote_router = router;
        r.bump = ctx.bumps.router;
        emit!(ChainConfigured { chain_id, router });
        Ok(())
    }

    // ============ GOVERNANCE TOKEN ============
    pub fn init_governance_token(ctx: Context<InitGovernance>, mint: Pubkey) -> Result<()> {
        let gt = &mut ctx.accounts.governance;
        gt.mint = mint;
        gt.total_staked = 0;
        gt.bump = ctx.bumps.governance;
        emit!(GovernanceInitialized { mint });
        Ok(())
    }

    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
        let gt = &mut ctx.accounts.governance;
        let stake = &mut ctx.accounts.stake;
        require!(amount > 0, GovernanceError::NoVotingPower);
        stake.owner = ctx.accounts.owner.key();
        stake.amount += amount;
        gt.total_staked += amount;
        emit!(TokensStaked { owner: stake.owner, amount });
        Ok(())
    }

    pub fn create_governance_proposal(ctx: Context<CreateGovProposal>, description: String, target: Pubkey) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        p.creator = ctx.accounts.creator.key();
        p.description = description;
        p.target = target;
        p.votes_for = 0;
        p.votes_against = 0;
        p.end_time = ctx.accounts.clock.unix_timestamp() + 3 * 86400;
        p.executed = false;
        p.cancelled = false;
        p.bump = ctx.bumps.proposal;
        emit!(GovernanceProposalCreated { proposal: p.key(), creator: p.creator });
        Ok(())
    }

    pub fn vote_on_proposal(ctx: Context<VoteOnProposal>, support: bool) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        require!(p.end_time > ctx.accounts.clock.unix_timestamp(), GovernanceError::VotingEnded);
        require!(!p.executed && !p.cancelled, GovernanceError::ProposalNotFound);
        if support { p.votes_for += 1; } else { p.votes_against += 1; }
        emit!(ProposalVoted { proposal: p.key(), voter: ctx.accounts.voter.key(), support });
        Ok(())
    }

    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let p = &mut ctx.accounts.proposal;
        require!(p.end_time <= ctx.accounts.clock.unix_timestamp(), GovernanceError::VotingEnded);
        require!(!p.executed && !p.cancelled, GovernanceError::ProposalNotFound);
        require!(p.votes_for > p.votes_against, GovernanceError::ProposalNotFound);
        p.executed = true;
        emit!(GovernanceProposalExecuted { proposal: p.key() });
        Ok(())
    }

    // ============ REPUTATION NFT ============
    pub fn register_agent_reputation(ctx: Context<RegisterReputation>, agent: Pubkey) -> Result<()> {
        let rep = &mut ctx.accounts.reputation;
        rep.agent = agent;
        rep.total_tasks = 0;
        rep.successful_tasks = 0;
        rep.rating_sum = 0;
        rep.rating_count = 0;
        rep.last_updated = ctx.accounts.clock.unix_timestamp();
        rep.bump = ctx.bumps.reputation;
        emit!(AgentReputationRegistered { agent, reputation: rep.key() });
        Ok(())
    }

    pub fn update_agent_reputation(ctx: Context<UpdateReputation>, success: bool, response_time: u64) -> Result<()> {
        let r = &mut ctx.accounts.reputation;
        r.total_tasks += 1;
        if success { r.successful_tasks += 1; }
        r.last_updated = ctx.accounts.clock.unix_timestamp();
        emit!(ReputationUpdated { agent: r.agent, score: calculate_reputation_score(r), tasks: r.total_tasks });
        Ok(())
    }

    pub fn submit_agent_rating(ctx: Context<SubmitRating>, rating: u64) -> Result<()> {
        let r = &mut ctx.accounts.reputation;
        require!(rating >= 1 && rating <= 5, ReputationError::NotAuthorized);
        r.rating_sum += rating;
        r.rating_count += 1;
        r.last_updated = ctx.accounts.clock.unix_timestamp();
        emit!(RatingSubmitted { agent: r.agent, rating });
        Ok(())
    }

    pub fn award_badge(ctx: Context<AwardBadge>, name: String) -> Result<()> {
        let b = &mut ctx.accounts.badge;
        b.name = name;
        b.timestamp = ctx.accounts.clock.unix_timestamp();
        b.bump = ctx.bumps.badge;
        emit!(BadgeAwarded { badge: b.key(), name });
        Ok(())
    }
}

fn calculate_reputation_score(rep: &ReputationToken) -> u64 {
    if rep.total_tasks < 5 { return 0; }
    let success_rate = if rep.total_tasks > 0 { (rep.successful_tasks * 10000) / rep.total_tasks } else { 0 };
    let rating_score = if rep.rating_count > 0 { (rep.rating_sum * 100) / (rep.rating_count * 5) } else { 0 };
    (success_rate * 500 + rating_score * 500) / 10000
}

// ============ ACCOUNTS ============

#[derive(Accounts)]
pub struct CreateEscrow<'info> {
    #[account(init, payer = requester, space = 8 + Escrow::INIT_SPACE, seeds = [b"escrow", intent_id.as_ref()], bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssignExecutor<'info> {
    #[account(mut, seeds = [b"escrow", intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct CompleteTask<'info> {
    #[account(mut, seeds = [b"escrow", intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(mut, seeds = [b"escrow", intent_id.as_ref()], bump = escrow.bump)]
    pub escrow: Account<'info, Escrow>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct CreateIntent<'info> {
    #[account(init, payer = requester, space = 8 + Intent::INIT_SPACE, seeds = [b"intent", intent_id.as_ref()], bump)]
    pub intent: Account<'info, Intent>,
    pub requester: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SubmitBid<'info> {
    #[account(mut, seeds = [b"intent", intent_id.as_ref()], bump = intent.bump)]
    pub intent: Account<'info, Intent>,
    #[account(init, payer = agent, space = 8 + Bid::INIT_SPACE, seeds = [b"bid", bid_id.as_ref()], bump)]
    pub bid: Account<'info, Bid>,
    pub agent: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AcceptBid<'info> {
    #[account(mut, seeds = [b"intent", intent_id.as_ref()], bump = intent.bump)]
    pub intent: Account<'info, Intent>,
    #[account(mut, seeds = [b"bid", bid_id.as_ref()], bump = bid.bump)]
    pub bid: Account<'info, Bid>,
    pub requester: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintCertificate<'info> {
    #[account(init, payer = authority, space = 8 + Certificate::INIT_SPACE, seeds = [b"cert", recipient.key().as_ref(), course_id.as_ref()], bump)]
    pub certificate: Account<'info, Certificate>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyCertificate<'info> {
    pub certificate: Account<'info, Certificate>,
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(init, payer = sender, space = 8 + Payment::INIT_SPACE, seeds = [b"payment", sender.key().as_ref()], bump)]
    pub payment: Account<'info, Payment>,
    pub sender: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterAgent<'info> {
    #[account(init, payer = owner, space = 8 + Agent::INIT_SPACE, seeds = [b"agent", owner.key().as_ref()], bump)]
    pub agent: Account<'info, Agent>,
    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateStatus<'info> {
    #[account(mut, seeds = [b"agent", owner.key().as_ref()], bump = agent.bump)]
    pub agent: Account<'info, Agent>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordTask<'info> {
    #[account(mut, seeds = [b"agent", owner.key().as_ref()], bump = agent.bump)]
    pub agent: Account<'info, Agent>,
    pub owner: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct CreateSubscription<'info> {
    #[account(init, payer = subscriber, space = 8 + Subscription::INIT_SPACE, seeds = [b"sub", subscriber.key().as_ref()], bump)]
    pub subscription: Account<'info, Subscription>,
    pub subscriber: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CancelSubscription<'info> {
    #[account(mut, seeds = [b"sub", subscriber.key().as_ref()], bump = subscription.bump)]
    pub subscription: Account<'info, Subscription>,
    pub subscriber: Signer<'info>,
}

#[derive(Accounts)]
pub struct RaiseDisputeTask<'info> {
    #[account(init, payer = raiser, space = 8 + Dispute::INIT_SPACE, seeds = [b"dispute", task.key().as_ref()], bump)]
    pub dispute: Account<'info, Dispute>,
    pub task: Account<'info, Intent>,
    pub raiser: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut, seeds = [b"dispute", task.key().as_ref()], bump = dispute.bump)]
    pub dispute: Account<'info, Dispute>,
    pub resolver: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct FundTreasury<'info> {
    #[account(init, payer = funder, space = 8 + Treasury::INIT_SPACE, seeds = [b"treasury"], bump)]
    pub treasury: Account<'info, Treasury>,
    pub funder: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct WithdrawTreasury<'info> {
    #[account(mut, seeds = [b"treasury"], bump = treasury.bump)]
    pub treasury: Account<'info, Treasury>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetFee<'info> {
    #[account(init, payer = admin, space = 8 + FeeManager::INIT_SPACE, seeds = [b"fee"], bump)]
    pub fee: Account<'info, FeeManager>,
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CollectFee<'info> {
    #[account(mut, seeds = [b"fee"], bump = fee.bump)]
    pub fee: Account<'info, FeeManager>,
}

#[derive(Accounts)]
pub struct CreateWorkshop<'info> {
    #[account(init, payer = instructor, space = 8 + Workshop::INIT_SPACE, seeds = [b"workshop", title.as_ref()], bump)]
    pub workshop: Account<'info, Workshop>,
    pub instructor: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterWorkshop<'info> {
    #[account(mut, seeds = [b"workshop", title.as_ref()], bump = workshop.bump)]
    pub workshop: Account<'info, Workshop>,
    pub participant: Signer<'info>,
}

#[derive(Accounts)]
pub struct MintCourse<'info> {
    #[account(init, payer = authority, space = 8 + Course::INIT_SPACE, seeds = [b"course", recipient.key().as_ref(), course_id.as_ref()], bump)]
    pub course: Account<'info, Course>,
    pub authority: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateMultisig<'info> {
    #[account(init, payer = creator, space = 8 + Multisig::INIT_SPACE, seeds = [b"multisig"], bump)]
    pub multisig: Account<'info, Multisig>,
    pub owners: Vec<AccountInfo<'info>>,
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateVesting<'info> {
    #[account(init, payer = funder, space = 8 + Vesting::INIT_SPACE, seeds = [b"vesting", beneficiary.key().as_ref()], bump)]
    pub vesting: Account<'info, Vesting>,
    pub funder: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateProposal<'info> {
    #[account(init, payer = creator, space = 8 + Proposal::INIT_SPACE, seeds = [b"proposal", description.as_ref()], bump)]
    pub proposal: Account<'info, Proposal>,
    pub creator: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Vote<'info> {
    #[account(mut, seeds = [b"proposal", description.as_ref()], bump = proposal.bump)]
    pub proposal: Account<'info, Proposal>,
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPrice<'info> {
    #[account(init, payer = updater, space = 8 + PriceOracle::INIT_SPACE, seeds = [b"oracle"], bump)]
    pub oracle: Account<'info, PriceOracle>,
    pub updater: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GetPrice<'info> {
    pub oracle: Account<'info, PriceOracle>,
}

#[derive(Accounts)]
pub struct CreateAttestation<'info> {
    #[account(init, payer = issuer, space = 8 + Attestation::INIT_SPACE, seeds = [b"attestation", issuer.key().as_ref()], bump)]
    pub attestation: Account<'info, Attestation>,
    pub issuer: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeAttestation<'info> {
    #[account(mut, seeds = [b"attestation", issuer.key().as_ref()], bump = attestation.bump)]
    pub attestation: Account<'info, Attestation>,
    pub issuer: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetRemoteChain<'info> {
    #[account(init, payer = admin, space = 8 + CrossChainRouter::INIT_SPACE, seeds = [b"router", chain_id.to_le_bytes().as_ref()], bump)]
    pub router: Account<'info, CrossChainRouter>,
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitGovernance<'info> {
    #[account(init, payer = admin, space = 8 + GovernanceToken::INIT_SPACE, seeds = [b"governance"], bump)]
    pub governance: Account<'info, GovernanceToken>,
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut, seeds = [b"governance"], bump = governance.bump)]
    pub governance: Account<'info, GovernanceToken>,
    #[account(init, payer = owner, space = 8 + 40, seeds = [b"stake", owner.key().as_ref()], bump)]
    pub stake: Account<'info, StakeAccount>,
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateGovProposal<'info> {
    #[account(init, payer = creator, space = 8 + GovernanceProposal::INIT_SPACE, seeds = [b"gov_proposal", description.as_ref()], bump)]
    pub proposal: Account<'info, GovernanceProposal>,
    pub creator: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VoteOnProposal<'info> {
    #[account(mut, seeds = [b"gov_proposal", description.as_ref()], bump = proposal.bump)]
    pub proposal: Account<'info, GovernanceProposal>,
    pub voter: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut, seeds = [b"gov_proposal", description.as_ref()], bump = proposal.bump)]
    pub proposal: Account<'info, GovernanceProposal>,
    pub executor: Signer<'info>,
}

#[derive(Accounts)]
pub struct RegisterReputation<'info> {
    #[account(init, payer = admin, space = 8 + ReputationToken::INIT_SPACE, seeds = [b"reputation", agent.key().as_ref()], bump)]
    pub reputation: Account<'info, ReputationToken>,
    pub admin: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateReputation<'info> {
    #[account(mut, seeds = [b"reputation", agent.key().as_ref()], bump = reputation.bump)]
    pub reputation: Account<'info, ReputationToken>,
    pub agent: Account<'info, Agent>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct SubmitRating<'info> {
    #[account(mut, seeds = [b"reputation", agent.key().as_ref()], bump = reputation.bump)]
    pub reputation: Account<'info, ReputationToken>,
    pub agent: Account<'info, Agent>,
    pub rater: Signer<'info>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct AwardBadge<'info> {
    #[account(init, payer = admin, space = 8 + ReputationBadge::INIT_SPACE, seeds = [b"badge", agent.key().as_ref(), name.as_ref()], bump)]
    pub badge: Account<'info, ReputationBadge>,
    pub admin: Signer<'info>,
    pub agent: Account<'info, Agent>,
    pub clock: Sysvar<'info, Clock>,
    pub system_program: Program<'info, System>,
}

// ============ DATA STRUCTURES ============

#[account]
#[derive(InitSpace)]
pub struct Escrow { pub requester: Pubkey, pub executor: Option<Pubkey>, pub amount: u64, pub fee: u64, pub deadline: i64, pub status: u8, pub intent_id: String, pub bump: u8 }
impl Escrow { pub const INIT_SPACE: usize = 32 + 32 + 8 + 8 + 8 + 1 + (4 + 64) + 1; }

#[account]
#[derive(InitSpace)]
pub struct Intent { pub requester: Pubkey, pub budget: u64, pub status: u8, pub intent_id: String, pub description: String, pub bump: u8 }
impl Intent { pub const INIT_SPACE: usize = 32 + 8 + 1 + (4 + 64) + (4 + 256) + 1; }

#[account]
#[derive(InitSpace)]
pub struct Bid { pub agent: Pubkey, pub intent: Pubkey, pub price: u64, pub status: u8, pub eta: i64, pub bid_id: String, pub bump: u8 }
impl Bid { pub const INIT_SPACE: usize = 32 + 32 + 8 + 1 + 8 + (4 + 64) + 1; }

#[account]
#[derive(InitSpace)]
pub struct Certificate { pub recipient: Pubkey, pub course_id: String, pub metadata: String, pub minted_at: i64, pub bump: u8 }
impl Certificate { pub const INIT_SPACE: usize = 32 + (4 + 64) + (4 + 256) + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Payment { pub sender: Pubkey, pub recipient: Pubkey, pub amount: u64, pub currency: String, pub status: u8, pub timestamp: i64, pub bump: u8 }
impl Payment { pub const INIT_SPACE: usize = 32 + 32 + 8 + (4 + 10) + 1 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Agent { pub owner: Pubkey, pub name: String, pub description: String, pub framework: String, pub status: u8, pub total_tasks: u64, pub successful_tasks: u64, pub created_at: i64, pub last_active: i64, pub bump: u8 }
impl Agent { pub const INIT_SPACE: usize = 32 + (4 + 32) + (4 + 128) + (4 + 32) + 1 + 8 + 8 + 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Subscription { pub subscriber: Pubkey, pub plan_id: u8, pub amount: u64, pub start_time: i64, pub next_payment: i64, pub status: u8, pub bump: u8 }
impl Subscription { pub const INIT_SPACE: usize = 32 + 1 + 8 + 8 + 8 + 1 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Dispute { pub task_id: Pubkey, pub raiser: Pubkey, pub reason: String, pub status: u8, pub created_at: i64, pub resolved_at: i64, pub bump: u8 }
impl Dispute { pub const INIT_SPACE: usize = 32 + 32 + (4 + 256) + 1 + 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Treasury { pub balance: u64, pub last_funded: i64, pub bump: u8 }
impl Treasury { pub const INIT_SPACE: usize = 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct FeeManager { pub platform_fee: u64, pub agent_fee: u64, pub collected: u64, pub bump: u8 }
impl FeeManager { pub const INIT_SPACE: usize = 8 + 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Workshop { pub instructor: Pubkey, pub title: String, pub max_participants: u32, pub current_participants: u32, pub registered_participants: Vec<Pubkey>, pub start_time: i64, pub bump: u8 }
impl Workshop { pub const INIT_SPACE: usize = 32 + (4 + 100) + 4 + 4 + (4 + 200) + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Course { pub recipient: Pubkey, pub course_id: String, pub enrolled_at: i64, pub bump: u8 }
impl Course { pub const INIT_SPACE: usize = 32 + (4 + 64) + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Multisig { pub owners: Vec<Pubkey>, pub threshold: u8, pub bump: u8 }
impl Multisig { pub const INIT_SPACE: usize = (4 + 200) + 1 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Vesting { pub beneficiary: Pubkey, pub total_amount: u64, pub released: u64, pub start_time: i64, pub end_time: i64, pub bump: u8 }
impl Vesting { pub const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Proposal { pub creator: Pubkey, pub description: String, pub votes_for: u64, pub votes_against: u64, pub status: u8, pub bump: u8 }
impl Proposal { pub const INIT_SPACE: usize = 32 + (4 + 256) + 8 + 8 + 1 + 1; }

#[account]
#[derive(InitSpace)]
pub struct PriceOracle { pub price: u64, pub updated_at: i64, pub bump: u8 }
impl PriceOracle { pub const INIT_SPACE: usize = 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct Attestation { pub issuer: Pubkey, pub schema: String, pub data: String, pub valid: bool, pub created_at: i64, pub bump: u8 }
impl Attestation { pub const INIT_SPACE: usize = 32 + (4 + 64) + (4 + 256) + 1 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct CrossChainRouter { pub chain_id: u32, pub remote_router: Pubkey, pub bump: u8 }
impl CrossChainRouter { pub const INIT_SPACE: usize = 4 + 32 + 1; }

#[account]
#[derive(InitSpace)]
pub struct GovernanceToken { pub mint: Pubkey, pub total_staked: u64, pub bump: u8 }
impl GovernanceToken { pub const INIT_SPACE: usize = 32 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct GovernanceProposal { pub creator: Pubkey, pub description: String, pub target: Pubkey, pub votes_for: u64, pub votes_against: u64, pub end_time: i64, pub executed: bool, pub cancelled: bool, pub bump: u8 }
impl GovernanceProposal { pub const INIT_SPACE: usize = 32 + (4 + 256) + 32 + 8 + 8 + 8 + 1 + 1 + 1; }

#[account]
#[derive(InitSpace)]
pub struct ReputationToken { pub agent: Pubkey, pub total_tasks: u64, pub successful_tasks: u64, pub rating_sum: u64, pub rating_count: u64, pub last_updated: i64, pub bump: u8 }
impl ReputationToken { pub const INIT_SPACE: usize = 32 + 8 + 8 + 8 + 8 + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct ReputationBadge { pub name: String, pub timestamp: i64, pub bump: u8 }
impl ReputationBadge { pub const INIT_SPACE: usize = (4 + 64) + 8 + 1; }

#[account]
#[derive(InitSpace)]
pub struct StakeAccount { pub owner: Pubkey, pub amount: u64 }
impl StakeAccount { pub const INIT_SPACE: usize = 32 + 8; }

// ============ EVENTS ============

#[event] pub struct EscrowCreated { pub escrow: Pubkey, pub requester: Pubkey, pub amount: u64 }
#[event] pub struct ExecutorAssigned { pub escrow: Pubkey, pub executor: Pubkey }
#[event] pub struct TaskCompleted { pub escrow: Pubkey, pub proof: [u8; 32] }
#[event] pub struct FundsReleased { pub escrow: Pubkey, pub executor: Pubkey, pub amount: u64 }
#[event] pub struct IntentCreated { pub intent: Pubkey, pub requester: Pubkey, pub budget: u64 }
#[event] pub struct BidSubmitted { pub bid: Pubkey, pub agent: Pubkey, pub intent: Pubkey, pub price: u64 }
#[event] pub struct BidAccepted { pub intent: Pubkey, pub bid: Pubkey }
#[event] pub struct CertificateMinted { pub certificate: Pubkey, pub recipient: Pubkey, pub course_id: String }
#[event] pub struct CertificateVerified { pub certificate: Pubkey }
#[event] pub struct PaymentProcessed { pub payment: Pubkey, pub sender: Pubkey, pub recipient: Pubkey, pub amount: u64 }
#[event] pub struct AgentRegistered { pub agent: Pubkey, pub owner: Pubkey, pub name: String }
#[event] pub struct AgentStatusChanged { pub agent: Pubkey, pub status: u8 }
#[event] pub struct TaskRecorded { pub agent: Pubkey, pub success: bool, pub total: u64 }
#[event] pub struct SubscriptionCreated { pub subscription: Pubkey, pub subscriber: Pubkey, pub plan_id: u8, pub amount: u64 }
#[event] pub struct SubscriptionCancelled { pub subscription: Pubkey }
#[event] pub struct DisputeRaised { pub dispute: Pubkey, pub task: Pubkey, pub raiser: Pubkey }
#[event] pub struct DisputeResolved { pub dispute: Pubkey, pub ruling: u8 }
#[event] pub struct TreasuryFunded { pub treasury: Pubkey, pub amount: u64, pub balance: u64 }
#[event] pub struct TreasuryWithdrawn { pub treasury: Pubkey, pub recipient: Pubkey, pub amount: u64 }
#[event] pub struct FeeUpdated { pub fee_type: u8, pub new_fee: u64 }
#[event] pub struct FeeCollected { pub amount: u64, pub fee: u64 }
#[event] pub struct WorkshopCreated { pub workshop: Pubkey, pub instructor: Pubkey }
#[event] pub struct ParticipantRegistered { pub workshop: Pubkey, pub participant: Pubkey }
#[event] pub struct CourseMinted { pub course: Pubkey, pub recipient: Pubkey }
#[event] pub struct MultisigCreated { pub multisig: Pubkey }
#[event] pub struct VestingCreated { pub vesting: Pubkey, pub beneficiary: Pubkey, pub total_amount: u64 }
#[event] pub struct ProposalCreated { pub proposal: Pubkey }
#[event] pub struct VoteCast { pub proposal: Pubkey, pub voter: Pubkey, pub support: bool }
#[event] pub struct PriceUpdated { pub oracle: Pubkey, pub price: u64 }
#[event] pub struct AttestationCreated { pub attestation: Pubkey, pub issuer: Pubkey }
#[event] pub struct AttestationRevoked { pub attestation: Pubkey }
#[event] pub struct ChainConfigured { pub chain_id: u32, pub router: Pubkey }
#[event] pub struct GovernanceInitialized { pub mint: Pubkey }
#[event] pub struct TokensStaked { pub owner: Pubkey, pub amount: u64 }
#[event] pub struct GovernanceProposalCreated { pub proposal: Pubkey, pub creator: Pubkey }
#[event] pub struct ProposalVoted { pub proposal: Pubkey, pub voter: Pubkey, pub support: bool }
#[event] pub struct GovernanceProposalExecuted { pub proposal: Pubkey }
#[event] pub struct AgentReputationRegistered { pub agent: Pubkey, pub reputation: Pubkey }
#[event] pub struct ReputationUpdated { pub agent: Pubkey, pub score: u64, pub tasks: u64 }
#[event] pub struct RatingSubmitted { pub agent: Pubkey, pub rating: u64 }
#[event] pub struct BadgeAwarded { pub badge: Pubkey, pub name: String }

// ============ ERRORS ============

#[error_code]
pub enum EscrowError { #[msg("Invalid amount")] InvalidAmount, #[msg("Unauthorized")] Unauthorized, #[msg("Invalid state")] InvalidState }
#[error_code]
pub enum FeeError { #[msg("Invalid fee type")] InvalidFeeType }
#[error_code]
pub enum GovernanceError { #[msg("No voting power")] NoVotingPower, #[msg("Proposal not found")] ProposalNotFound, #[msg("Voting ended")] VotingEnded, #[msg("Already voted")] AlreadyVoted }
#[error_code]
pub enum ReputationError { #[msg("Invalid token")] InvalidToken, #[msg("Not authorized")] NotAuthorized }

declare_id!("Kuberna1111111111111111111111111111");
pub use kuberna_contracts::*;