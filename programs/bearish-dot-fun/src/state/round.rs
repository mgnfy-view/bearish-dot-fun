use anchor_lang::prelude::*;

use crate::error;

#[account]
#[derive(InitSpace)]
pub struct Round {
    pub start_time: u64,
    pub starting_price: u64,
    pub ending_price: u64,
    pub long_positions: u64,
    pub short_positions: u64,
    pub collected_amount: u64,

    pub bump: u8,
    pub round_vault_bump: u8,
}

impl Round {
    pub fn validate_starting_price(&self) -> Result<()> {
        require!(self.starting_price > 0, error::ErrorCodes::VauleZero);

        Ok(())
    }

    pub fn validate_ending_price(&self) -> Result<()> {
        require!(self.ending_price > 0, error::ErrorCodes::VauleZero);

        Ok(())
    }

    pub fn validate_round_duration(&self, min_duration: u64) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64;
        let duration = current_time.checked_sub(self.start_time).unwrap();

        require!(duration >= min_duration, error::ErrorCodes::InvalidDuration);

        Ok(())
    }
}
