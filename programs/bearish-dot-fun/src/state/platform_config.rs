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
pub struct JackPotAllocation {
    pub streak_5: u16,
    pub streak_6: u16,
    pub streak_7: u16,
    pub streak_8: u16,
    pub streak_9: u16,
    pub streak_10: u16,
}

#[derive(Clone, InitSpace, AnchorSerialize, AnchorDeserialize)]
pub struct GlobalRoundInfo {
    pub round: u64,
    pub duration: u64,
    pub allocation: Allocation,
    pub jackpot_allocation: JackPotAllocation,
    pub min_bet_amount: u64,
    pub price_account: Pubkey,
    pub staleness_threshold: u64,
    pub jackpot_pool_amount: u64,
    pub accumulated_platform_fees: u64,
}

#[account]
#[derive(InitSpace)]
pub struct PlatformConfig {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub global_round_info: GlobalRoundInfo,

    pub bump: u8,
    pub platform_vault_bump: u8,
}

impl PlatformConfig {
    pub fn validate_duration(&self) -> Result<()> {
        require!(
            self.global_round_info.duration > 0,
            error::ErrorCodes::DurationZero
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

    pub fn validate_jackpot_allocation(&self) -> Result<()> {
        let jackpot_allocation = &self.global_round_info.jackpot_allocation;

        require!(
            jackpot_allocation.streak_5 <= constants::general::BPS
                && jackpot_allocation.streak_6 <= constants::general::BPS
                && jackpot_allocation.streak_7 <= constants::general::BPS
                && jackpot_allocation.streak_8 <= constants::general::BPS
                && jackpot_allocation.streak_9 <= constants::general::BPS
                && jackpot_allocation.streak_10 <= constants::general::BPS,
            error::ErrorCodes::ExceedsMaxFee
        );
        require!(
            jackpot_allocation.streak_5 < jackpot_allocation.streak_6
                && jackpot_allocation.streak_6 < jackpot_allocation.streak_7
                && jackpot_allocation.streak_7 < jackpot_allocation.streak_8
                && jackpot_allocation.streak_8 < jackpot_allocation.streak_9
                && jackpot_allocation.streak_9 < jackpot_allocation.streak_10,
            error::ErrorCodes::InvalidJackPotAllocation
        );

        Ok(())
    }

    pub fn validate_price_account(&self) -> Result<()> {
        require!(
            self.global_round_info.price_account != Pubkey::default(),
            error::ErrorCodes::PriceAccountDefaultPubkey
        );

        Ok(())
    }
}
