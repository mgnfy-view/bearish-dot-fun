use anchor_lang::prelude::*;

use crate::error;

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub amount: u64,
    pub is_long: bool,
    pub affiliate: Pubkey,
    pub has_claimed_winnings: bool,
    pub has_affiliate_claimed_winnings: bool,

    pub bump: u8,
}

impl Bet {
    pub fn validate_amount(&self) -> Result<()> {
        require!(self.amount > 0, error::ErrorCodes::BetAmountZero);

        Ok(())
    }
}
