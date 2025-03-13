use anchor_lang::prelude::*;

pub mod seeds {
    use super::*;

    #[constant]
    pub const PLATFORM_VAULT: &[u8] = b"platform_vault";

    #[constant]
    pub const ALLOCATION: &[u8] = b"allocation";
}

pub mod general {
    use super::*;

    #[constant]
    pub const BPS: u16 = 10_000;

    pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;
}
