use anchor_lang::prelude::*;

use crate::{Allocation, GlobalRoundInfo};

#[event]
pub struct Initialized {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub platform_vault: Pubkey,
    pub global_round_info: GlobalRoundInfo,
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
