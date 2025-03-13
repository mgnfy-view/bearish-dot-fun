use anchor_lang::prelude::*;

use crate::{constants, error};

#[derive(Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct Allocation {
    pub winners_share: u16,
    pub affiliate_share: u16,
    pub jackpot_share: u16,
    pub platform_share: u16,
}

#[derive(Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct GlobalRoundInfo {
    pub round: u64,
    pub duration: u64,
    pub allocation: Allocation,
    pub min_bet_amount: u64,
    pub price_account: Pubkey,
    pub staleness_threshold: u64,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub accumulated_platform_fees: u64,
    pub global_round_info: GlobalRoundInfo,

    pub bump: u8,
    pub platform_vault_bump: u8,
}

impl PlatformConfig {
    pub fn validate_duration(&self) -> Result<()> {
        require!(
            self.global_round_info.duration > 0,
            error::ErrorCodes::InvalidDuration
        );

        Ok(())
    }

    pub fn validate_allocation(&self) -> Result<()> {
        let allocation = &self.global_round_info.allocation;

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

    pub fn validate_price_account(&self) -> Result<()> {
        require!(
            self.global_round_info.price_account != Pubkey::default(),
            error::ErrorCodes::DefaultPubkey
        );

        Ok(())
    }
}
