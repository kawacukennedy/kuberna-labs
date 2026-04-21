use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_program::ID as SYSTEM_ID,
};

solana_program::declare_id!("DDuS8bNs3z6FGYJX2HvKD4JWN5nq6ZANCH6HbMVg7GY");

#[derive(BorshSerialize, BorshDeserialize, Debug, Clone)]
pub struct Escrow {
    pub requester: Pubkey,
    pub amount: u64,
    pub fee: u64,
    pub status: u8,
    pub bump: u8,
}

impl Escrow {
    const SEED: &'static [u8; 6] = b"escrow";

    pub fn getPDA(program_id: &Pubkey) -> (Pubkey, u8) {
        Pubkey::find_program_address(&[Self::SEED], program_id)
    }
}

pub fn create_escrow(program_id: &Pubkey, accounts: &[AccountInfo], amount: u64) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let requester = next_account_info(accounts_iter)?;
    let escrow = next_account_info(accounts_iter)?;
    let system_program = next_account_info(accounts_iter)?;

    if system_program.key != &SYSTEM_ID {
        return Err(ProgramError::IncorrectProgramId);
    }

    let (pda, bump) = Escrow::getPDA(program_id);
    let escrow_data = Escrow {
        requester: *requester.key,
        amount,
        fee: (amount * 250) / 10000,
        status: 0,
        bump,
    };
    escrow_data.serialize(&mut &mut escrow.data.borrow_mut()[..])?;
    Ok(())
}

entrypoint!(process_instruction);

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    if program_id != &crate::ID {
        return Err(ProgramError::IncorrectProgramId);
    }

    if instruction_data.len() < 4 {
        return Err(ProgramError::InvalidInstructionData);
    }

    let discriminator = u32::from_le_bytes([
        instruction_data[0],
        instruction_data[1],
        instruction_data[2],
        instruction_data[3],
    ]);

    match discriminator {
        0 => {
            if instruction_data.len() < 12 {
                return Err(ProgramError::InvalidInstructionData);
            }
            let amount = u64::try_from_slice(&instruction_data[4..12])?;
            create_escrow(program_id, accounts, amount)
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}
