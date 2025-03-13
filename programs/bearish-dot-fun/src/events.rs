use anchor_lang::prelude::*;

use crate::Allocation;

#[event]
pub struct Initialized {
    pub owner: Pubkey,
    pub stablecoin: Pubkey,
    pub platform_vault: Pubkey,
    pub allocation: Allocation,
}
