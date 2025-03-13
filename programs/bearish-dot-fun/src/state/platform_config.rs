use anchor_lang::prelude::*;

use crate::{constants, error};

#[derive(Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct Allocation {
    pub winners_share: u16,
    pub affiliate_share: u16,
    pub jackpot_share: u16,
    pub platform_share: u16,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub allocation: Allocation,
    pub min_bet_amount: u64,
    pub accumulated_platform_fees: u64,

    pub bump: u8,
    pub platform_vault_bump: u8,
}

impl PlatformConfig {
    pub fn validate_allocation(&self) -> Result<()> {
        let allocation = &self.allocation;

        let sum = allocation.winners_share
            + allocation.affiliate_share
            + allocation.jackpot_share
            + allocation.platform_share;
        require!(
            sum == constants::general::BPS,
            error::ErrorCodes::InvalidAllocation
        );

        Ok(())
    }
}
