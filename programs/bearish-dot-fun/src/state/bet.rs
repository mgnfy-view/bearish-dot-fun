use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Bet {
    pub amount: u64,
    pub is_long: bool,

    pub bump: u8,
}

impl Bet {}
