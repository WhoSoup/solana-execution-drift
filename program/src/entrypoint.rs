//! Program entrypoint

use solana_program::{
    account_info::AccountInfo, clock::Clock, entrypoint, entrypoint::ProgramResult, msg,
    pubkey::Pubkey, sysvar::Sysvar,
};

entrypoint!(process_instruction);
fn process_instruction(
    _program_id: &Pubkey,
    _accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {
    let clock = Clock::get()?;
    msg!("unix_timestamp = {}", clock.unix_timestamp);
    Ok(())
}
