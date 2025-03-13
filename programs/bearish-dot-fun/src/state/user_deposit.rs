use anchor_lang::prelude::*;

use crate::error;

#[account]
#[derive(InitSpace)]
pub struct UserDeposit {
    pub amount: u64,
    pub affiliate: Pubkey,

    pub bump: u8,
}

impl UserDeposit {
    pub fn validate_amount(&self) -> Result<()> {
        require!(self.amount > 0, error::ErrorCodes::VauleZero);

        Ok(())
    }

    pub fn validate_affiliate(&self, user: Pubkey) -> Result<()> {
        require!(
            self.affiliate == Pubkey::default() || self.affiliate != user,
            error::ErrorCodes::InvalidAffiliate
        );

        Ok(())
    }
}
