pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("8oPebxyRHN3oUiDRypZuVcS3FYfsGYJtmCEBG2NaKVUD");

#[program]
pub mod bearish_dot_fun {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
}
