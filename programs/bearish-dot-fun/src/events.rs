use anchor_lang::prelude::*;

use crate::Allocation;

#[event]
pub struct Initialized {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub platform_vault: Pubkey,
    pub allocation: Allocation,
    pub min_bet_amount: u64,
}

#[event]
pub struct Deposited {
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
pub struct Withdrawn {
    pub user: Pubkey,
    pub stablecoin: Pubkey,
    pub amount: u64,
}
