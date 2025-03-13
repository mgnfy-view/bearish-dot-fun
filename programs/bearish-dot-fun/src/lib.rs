pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

pub use constants::*;
pub use events::*;
pub use instructions::*;
pub use state::*;

// Note: Add Solana security text
#[cfg(not(feature = "no-entrypoint"))]
security_txt! {
    name: "bearish-dot-fun",
    project_url: "https://github.com/mgnfy-view/bearish-dot-fun.git",
    contacts: "sahilgujrati12@gmail.com",
    policy: "",
    source_code: "https://github.com/mgnfy-view/bearish-dot-fun.git",
    preferred_languages: "en",
    auditors: ""
}

declare_id!("8oPebxyRHN3oUiDRypZuVcS3FYfsGYJtmCEBG2NaKVUD");

#[program]
pub mod bearish_dot_fun {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, allocation: Allocation) -> Result<()> {
        Initialize::initialize(ctx, allocation)
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        Deposit::deposit(ctx, amount)
    }

    pub fn set_affiliate(ctx: Context<SetAffiliate>) -> Result<()> {
        SetAffiliate::set_affiliate(ctx)
    }
}
