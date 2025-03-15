use anchor_lang::prelude::*;

use crate::{Allocation, GlobalRoundInfo, JackPotAllocation};

#[event]
pub struct Initialized {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub platform_vault: Pubkey,
    pub global_round_info: GlobalRoundInfo,
}

#[event]
pub struct OwnershipTransferred {
    pub owner: Pubkey,
    pub new_owner: Pubkey,
}

#[event]
pub struct DurationSet {
    pub duration: u64,
}

#[event]
pub struct AllocationSet {
    pub allocation: Allocation,
}

#[event]
pub struct JackPotAllocationSet {
    pub jackpot_allocation: JackPotAllocation,
}

#[event]
pub struct MinBetAmountSet {
    pub min_bet_amount: u64,
}

#[event]
pub struct PriceAccountSet {
    pub price_account: Pubkey,
}

#[event]
pub struct StalenessThresholdSet {
    pub staleness_threshold: u64,
}

#[event]
pub struct Deposited {
    pub user: Pubkey,
    pub stablecoin: Pubkey,
    pub amount: u64,
}

#[event]
pub struct Withdrawn {
    pub user: Pubkey,
    pub stablecoin: Pubkey,
    pub amount: u64,
}

#[event]
pub struct AffiliateSet {
    pub user: Pubkey,
    pub affiliate: Pubkey,
}

#[event]
pub struct RoundStarted {
    pub round: u64,
    pub starting_price: u64,
}

#[event]
pub struct RoundEnded {
    pub round: u64,
    pub ending_price: u64,
}

#[event]
pub struct BetPlaced {
    pub user: Pubkey,
    pub round: u64,
    pub amount: u64,
    pub is_long: bool,
    pub affiliate: Pubkey,
}

#[event]
pub struct WinningsClaimed {
    pub user: Pubkey,
    pub round_index: u64,
    pub is_long: bool,
    pub amount: u64,
}

#[event]
pub struct AffiliateWinningsClaimed {
    pub affiliate: Pubkey,
    pub round_index: u64,
    pub amount: u64,
}

#[event]
pub struct CollectedPlatformFees {
    pub owner: Pubkey,
    pub amount: u64,
}
