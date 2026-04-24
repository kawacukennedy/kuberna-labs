use anchor_lang::prelude::*;

declare_id!("7Q76EehbSb1bBENUCJkP8igC2z1mLmiYy52AWhMVqpF9");

use anchor_lang::prelude::*;

declare_id!("onjiG76HDDSMVPAYiMzVKqfZVR7LRQ5JaLwJggupCmy");

pub mod escrow;
pub mod intent;
pub mod certificate;
pub mod payment;
pub mod agent;
pub mod subscription;
pub mod dispute;
pub mod treasury;
pub mod fee_manager;
pub mod workshop;
pub mod course;
pub mod multisig;
pub mod vesting;
pub mod governance;
pub mod price_oracle;
pub mod attestation;
pub mod cross_chain;
pub mod governance_token;
pub mod reputation;

use escrow::*;
use intent::*;
use certificate::*;
use payment::*;
use agent::*;
use subscription::*;
use dispute::*;
use treasury::*;
use fee_manager::*;
use workshop::*;
use course::*;
use multisig::*;
use vesting::*;
use governance::*;
use price_oracle::*;
use attestation::*;
use cross_chain::*;
use governance_token::*;
use reputation::*;

anchor_lang::declare_id!("TokenkegQfeXy6DdZRsN6MCgLGj6Df7dW3w9J7AXZ");
anchor_lang::declare_id!("ATokenGPvbuGV2rh23dJbrfKJdG3Tq8S2URt7Jfh");

#[program]
pub mod kuberna_solana {
    use super::*;

    pub fn register_agent(
        ctx: Context<RegisterAgent>,
        name: String,
        description: String,
        framework: String,
        model: String,
        config: String,
        tools: Vec<String>,
    ) -> Result<()> {
        agent::register_agent(ctx, name, description, framework, model, config, tools)
    }

    pub fn update_agent(
        ctx: Context<UpdateAgent>,
        description: String,
        model: String,
        config: String,
    ) -> Result<()> {
        agent::update_agent(ctx, description, model, config)
    }

    pub fn set_agent_status(ctx: Context<AddTool>, status: u8) -> Result<()> {
        agent::set_agent_status(ctx, status)
    }

    pub fn add_tool(ctx: Context<AddTool>, tool: String) -> Result<()> {
        agent::add_tool(ctx, tool)
    }

    pub fn create_attestation(
        ctx: Context<CreateAttestation>,
        recipient: Pubkey,
        schema: String,
        data: Vec<u8>,
        expiration_days: i64,
    ) -> Result<()> {
        attestation::create_attestation(ctx, recipient, schema, data, expiration_days)
    }

    pub fn revoke_attestation(ctx: Context<RevokeAttestation>) -> Result<()> {
        attestation::revoke_attestation(ctx)
    }

    pub fn verify_attestation(ctx: Context<RevokeAttestation>) -> Result<bool> {
        attestation::verify_attestation(ctx)
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
        certificate::mint_certificate(ctx, course_id, recipient, recipient_name, course_title, instructor_name, verification_hash)
    }

    pub fn verify_certificate(ctx: Context<RevokeCertificate>) -> Result<bool> {
        certificate::verify_certificate(ctx)
    }

    pub fn create_course(
        ctx: Context<CreateCourse>,
        name: String,
        description: String,
        metadata_uri: String,
        price: u64,
        payment_token: Pubkey,
        max_students: u32,
        has_certificate: bool,
        duration: i64,
    ) -> Result<()> {
        course::create_course(ctx, name, description, metadata_uri, price, payment_token, max_students, has_certificate, duration)
    }

    pub fn publish_course(ctx: Context<CreateCourse>) -> Result<()> {
        course::publish_course(ctx)
    }

    pub fn enroll_student(ctx: Context<EnrollStudent>, student: Pubkey) -> Result<()> {
        course::enroll_student(ctx, student)
    }

    pub fn grant_access(ctx: Context<EnrollStudent>, student: Pubkey) -> Result<()> {
        course::grant_access(ctx, student)
    }

    pub fn initialize_router(ctx: Context<InitializeRouter>) -> Result<()> {
        cross_chain::initialize_router(ctx)
    }

    pub fn set_chain_support(ctx: Context<SetChainSupport>, chain_id: u32, supported: bool) -> Result<()> {
        cross_chain::set_chain_support(ctx, chain_id, supported)
    }

    pub fn set_bridge_fee(ctx: Context<SetChainSupport>, new_fee: u64) -> Result<()> {
        cross_chain::set_bridge_fee(ctx, new_fee)
    }

    pub fn set_slippage_tolerance(ctx: Context<SetChainSupport>, tolerance: u64) -> Result<()> {
        cross_chain::set_slippage_tolerance(ctx, tolerance)
    }

    pub fn emergency_halt(ctx: Context<SetChainSupport>) -> Result<()> {
        cross_chain::emergency_halt(ctx)
    }

    pub fn resume(ctx: Context<SetChainSupport>) -> Result<()> {
        cross_chain::resume(ctx)
    }

    pub fn raise_dispute(
        ctx: Context<RaiseDispute>,
        escrow_id: [u8; 32],
        requester: Pubkey,
        executor: Pubkey,
        reason: String,
    ) -> Result<()> {
        dispute::raise_dispute(ctx, escrow_id, requester, executor, reason)
    }

    pub fn submit_evidence(ctx: Context<SubmitEvidence>, evidence: String, is_requester: bool) -> Result<()> {
        dispute::submit_evidence(ctx, evidence, is_requester)
    }

    pub fn vote_dispute(ctx: Context<VoteDispute>, vote: u8) -> Result<()> {
        dispute::vote(ctx, vote)
    }

    pub fn resolve_dispute(ctx: Context<ResolveDispute>) -> Result<u8> {
        dispute::resolve_dispute(ctx)
    }

    pub fn appeal_dispute(ctx: Context<ResolveDispute>) -> Result<()> {
        dispute::appeal_dispute(ctx)
    }

    pub fn create_escrow(
        ctx: Context<CreateEscrow>,
        intent_id: String,
        amount: u64,
        duration: i64,
    ) -> Result<()> {
        escrow::create_escrow(ctx, intent_id, amount, duration)
    }

    pub fn fund_escrow(ctx: Context<FundEscrow>) -> Result<()> {
        escrow::fund_escrow(ctx)
    }

    pub fn assign_executor(ctx: Context<AssignExecutor>, executor: Pubkey) -> Result<()> {
        escrow::assign_executor(ctx, executor)
    }

    pub fn complete_task(ctx: Context<CompleteTask>, proof: Vec<u8>) -> Result<()> {
        escrow::complete_task(ctx, proof)
    }

    pub fn release_funds(ctx: Context<ReleaseFunds>) -> Result<()> {
        escrow::release_funds(ctx)
    }

    pub fn auto_release(ctx: Context<CompleteTask>) -> Result<()> {
        escrow::auto_release(ctx)
    }

    pub fn raise_dispute_escrow(ctx: Context<RaiseDisputeEscrow>, reason: String) -> Result<()> {
        escrow::raise_dispute_escrow(ctx, reason)
    }

    pub fn resolve_dispute_escrow(ctx: Context<ResolveDisputeEscrow>, refund_to_requester: bool) -> Result<()> {
        escrow::resolve_dispute_escrow(ctx, refund_to_requester)
    }

    pub fn expire_and_refund(ctx: Context<FundEscrow>) -> Result<()> {
        escrow::expire_and_refund(ctx)
    }

    pub fn add_recipient(ctx: Context<DistributeFees>, account: Pubkey, share: u64) -> Result<()> {
        fee_manager::add_recipient(ctx, account, share)
    }

    pub fn remove_recipient(ctx: Context<DistributeFees>, account: Pubkey) -> Result<()> {
        fee_manager::remove_recipient(ctx, account)
    }

    pub fn collect_fee(ctx: Context<DistributeFees>, amount: u64) -> Result<()> {
        fee_manager::collect_fee(ctx, amount)
    }

    pub fn distribute_fees(ctx: Context<DistributeFees>, amount: u64) -> Result<()> {
        fee_manager::distribute_fees(ctx, amount)
    }

    pub fn create_intent(
        ctx: Context<CreateIntent>,
        intent_id: String,
        description: String,
        source_token: Pubkey,
        source_amount: u64,
        dest_token: Pubkey,
        min_dest_amount: u64,
        budget: u64,
        duration: i64,
    ) -> Result<()> {
        intent::create_intent(ctx, intent_id, description, source_token, source_amount, dest_token, min_dest_amount, budget, duration)
    }

    pub fn submit_bid(
        ctx: Context<SubmitBid>,
        bid_id: String,
        price: u64,
        estimated_time: i64,
    ) -> Result<()> {
        intent::submit_bid(ctx, bid_id, price, estimated_time)
    }

    pub fn accept_bid(ctx: Context<AcceptBid>, solver: Pubkey) -> Result<()> {
        intent::accept_bid(ctx, solver)
    }

    pub fn cancel_intent(ctx: Context<CancelIntent>) -> Result<()> {
        intent::cancel_intent(ctx)
    }

    pub fn complete_intent(ctx: Context<CompleteIntent>) -> Result<()> {
        intent::complete_intent(ctx)
    }

    pub fn set_escrow(ctx: Context<CompleteIntent>, escrow_id: [u8; 32]) -> Result<()> {
        intent::set_escrow(ctx, escrow_id)
    }

    pub fn expire_intent(ctx: Context<CompleteIntent>) -> Result<()> {
        intent::expire_intent(ctx)
    }

    pub fn create_multisig(ctx: Context<CreateMultisig>, owners: Vec<Pubkey>, threshold: u8) -> Result<()> {
        multisig::create_multisig(ctx, owners, threshold)
    }

    pub fn submit_transaction(
        ctx: Context<SubmitTransaction>,
        to: Pubkey,
        token: Pubkey,
        amount: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        multisig::submit_transaction(ctx, to, token, amount, data)
    }

    pub fn confirm_transaction(ctx: Context<ConfirmTransaction>, tx_id: u64) -> Result<()> {
        multisig::confirm_transaction(ctx, tx_id)
    }

    pub fn execute_transaction(ctx: Context<ExecuteTransaction>, tx_id: u64) -> Result<()> {
        multisig::execute_transaction(ctx, tx_id)
    }

    pub fn add_owner(ctx: Context<ConfirmTransaction>, owner: Pubkey) -> Result<()> {
        multisig::add_owner(ctx, owner)
    }

    pub fn remove_owner(ctx: Context<ConfirmTransaction>, owner: Pubkey) -> Result<()> {
        multisig::remove_owner(ctx, owner)
    }

    pub fn process_payment(
        ctx: Context<ProcessPayment>,
        recipient: Pubkey,
        amount: u64,
        token: Pubkey,
        currency: String,
    ) -> Result<()> {
        payment::process_payment(ctx, recipient, amount, token, currency)
    }

    pub fn batch_process_payment(
        ctx: Context<ProcessPayment>,
        recipient: Pubkey,
        amount: u64,
        token: Pubkey,
    ) -> Result<()> {
        payment::batch_process_payment(ctx, recipient, amount, token)
    }

    pub fn withdraw(ctx: Context<WithdrawFunds>, amount: u64) -> Result<()> {
        payment::withdraw(ctx, amount)
    }

    pub fn init_oracle(ctx: Context<InitOracle>) -> Result<()> {
        price_oracle::init_oracle(ctx)
    }

    pub fn set_price(ctx: Context<SetPrice>, price: u64) -> Result<()> {
        price_oracle::set_price(ctx, price)
    }

    pub fn confirm_price(ctx: Context<ConfirmPendingPrice>) -> Result<()> {
        price_oracle::confirm_price(ctx)
    }

    pub fn get_price(ctx: Context<ConfirmPendingPrice>) -> Result<u64> {
        price_oracle::get_price(ctx)
    }

    pub fn get_price_or_fallback(ctx: Context<ConfirmPendingPrice>, fallback: u64) -> Result<u64> {
        price_oracle::get_price_or_fallback(ctx, fallback)
    }

    pub fn pause_oracle(ctx: Context<SetPrice>) -> Result<()> {
        price_oracle::pause_oracle(ctx)
    }

    pub fn unpause_oracle(ctx: Context<SetPrice>) -> Result<()> {
        price_oracle::unpause_oracle(ctx)
    }

    pub fn create_subscription(ctx: Context<CreateSubscription>, plan: Account<Plan>) -> Result<()> {
        subscription::create_subscription(ctx, plan)
    }

    pub fn renew_subscription(ctx: Context<CreateSubscription>, plan: Account<Plan>) -> Result<()> {
        subscription::renew_subscription(ctx, plan)
    }

    pub fn cancel_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        subscription::cancel_subscription(ctx)
    }

    pub fn pause_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        subscription::pause_subscription(ctx)
    }

    pub fn resume_subscription(ctx: Context<CancelSubscription>) -> Result<()> {
        subscription::resume_subscription(ctx)
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
        subscription::create_plan(ctx, plan_id, name, token, price, plan_type, duration_seconds)
    }

    pub fn fund_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
        treasury::fund_treasury(ctx, amount)
    }

    pub fn withdraw_treasury(ctx: Context<WithdrawTreasury>, recipient: Pubkey, amount: u64) -> Result<()> {
        treasury::withdraw_treasury(ctx, recipient, amount)
    }

    pub fn create_proposal_treasury(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        recipient: Pubkey,
        token: Pubkey,
        amount: u64,
        description: String,
    ) -> Result<()> {
        treasury::create_proposal(ctx, proposal_id, recipient, token, amount, description)
    }

    pub fn cast_vote_treasury(ctx: Context<CastVote>, support: bool) -> Result<()> {
        treasury::cast_vote(ctx, support)
    }

    pub fn execute_proposal(ctx: Context<CastVote>) -> Result<()> {
        treasury::execute_proposal(ctx)
    }

    pub fn cancel_proposal(ctx: Context<CastVote>) -> Result<()> {
        treasury::cancel_proposal(ctx)
    }

    pub fn create_vesting(
        ctx: Context<CreateVesting>,
        beneficiary: Pubkey,
        total_amount: u64,
        start_time: i64,
    ) -> Result<()> {
        vesting::create_vesting(ctx, beneficiary, total_amount, start_time)
    }

    pub fn release_vesting(ctx: Context<ReleaseVesting>) -> Result<()> {
        vesting::release_vesting(ctx)
    }

    pub fn revoke_vesting(ctx: Context<ReleaseVesting>) -> Result<()> {
        vesting::revoke_vesting(ctx)
    }

    pub fn create_workshop(
        ctx: Context<CreateWorkshop>,
        title: String,
        description: String,
        start_time: i64,
        duration: i64,
        max_participants: u32,
    ) -> Result<()> {
        workshop::create_workshop(ctx, title, description, start_time, duration, max_participants)
    }

    pub fn register_workshop(ctx: Context<RegisterWorkshop>) -> Result<()> {
        workshop::register_workshop(ctx)
    }

    pub fn unregister_workshop(ctx: Context<RegisterWorkshop>) -> Result<()> {
        workshop::unregister_workshop(ctx)
    }

    pub fn start_workshop(ctx: Context<StartWorkshop>) -> Result<()> {
        workshop::start_workshop(ctx)
    }

    pub fn end_workshop(ctx: Context<EndWorkshop>) -> Result<()> {
        workshop::end_workshop(ctx)
    }

    pub fn mark_attendance(ctx: Context<RegisterWorkshop>, participant: Pubkey) -> Result<()> {
        workshop::mark_attendance(ctx, participant)
    }

    pub fn cancel_workshop(ctx: Context<EndWorkshop>) -> Result<()> {
        workshop::cancel_workshop(ctx)
    }

    pub fn create_proposal(ctx: Context<CreateProposal>, description: String) -> Result<()> {
        governance::create_proposal(ctx, description)
    }

    pub fn vote(ctx: Context<Vote>, support: bool) -> Result<()> {
        governance::vote(ctx, support)
    }

    pub fn init_governance_token(ctx: Context<InitGovernanceToken>, mint: Pubkey) -> Result<()> {
        governance_token::init_governance_token(ctx, mint)
    }

    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
        governance_token::stake_tokens(ctx, amount)
    }

    pub fn register_agent_reputation(ctx: Context<RegisterAgentReputation>) -> Result<()> {
        reputation::register_agent_reputation(ctx)
    }

    pub fn update_agent_reputation(
        ctx: Context<UpdateAgentReputation>,
        success: bool,
        response_time: u32,
    ) -> Result<()> {
        reputation::update_agent_reputation(ctx, success, response_time)
    }
}