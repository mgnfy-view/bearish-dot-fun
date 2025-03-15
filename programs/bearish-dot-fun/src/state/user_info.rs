use anchor_lang::prelude::*;

use crate::error;

#[account]
#[derive(InitSpace)]
pub struct UserInfo {
    pub amount: u64,
    pub affiliate: Pubkey,
    pub last_won_round: u64,
    pub times_won: u64,

    pub bump: u8,
}

impl UserInfo {
    pub fn validate_affiliate(&self, user: &Pubkey) -> Result<()> {
        require!(self.affiliate != *user, error::ErrorCodes::InvalidAffiliate);

        Ok(())
    }
}
