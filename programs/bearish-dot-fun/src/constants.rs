use anchor_lang::prelude::*;

pub mod seeds {
    use super::*;

    #[constant]
    pub const PLATFORM_CONFIG: &[u8] = b"platform_config";

    #[constant]
    pub const PLATFORM_VAULT: &[u8] = b"platform_vault";

    #[constant]
    pub const USER: &[u8] = b"user";

    #[constant]
    pub const ROUND: &[u8] = b"round";

    #[constant]
    pub const USER_BET: &[u8] = b"user_bet";
}

pub mod general {
    use super::*;

    #[constant]
    pub const BPS: u16 = 10_000;

    pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
}
