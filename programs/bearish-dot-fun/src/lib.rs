pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;
pub mod utils;

use anchor_lang::prelude::*;
#[cfg(not(feature = "no-entrypoint"))]
use solana_security_txt::security_txt;

pub use events::*;
pub use instructions::*;
pub use state::*;
pub use utils::*;

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

    pub fn initialize(ctx: Context<Initialize>, global_round_info: GlobalRoundInfo) -> Result<()> {
        Initialize::initialize(ctx, global_round_info)
    }

    pub fn transfer_ownership(ctx: Context<TransferOwnership>) -> Result<()> {
        TransferOwnership::transfer_ownership(ctx)
    }

    pub fn set_duration(ctx: Context<SetPlatformConfig>, duration: u64) -> Result<()> {
        SetPlatformConfig::set_duration(ctx, duration)
    }

    pub fn set_allocation(ctx: Context<SetPlatformConfig>, allocation: Allocation) -> Result<()> {
        SetPlatformConfig::set_allocation(ctx, allocation)
    }

    pub fn set_jackpot_allocation(
        ctx: Context<SetPlatformConfig>,
        jackpot_allocation: JackPotAllocation,
    ) -> Result<()> {
        SetPlatformConfig::set_jackpot_allocation(ctx, jackpot_allocation)
    }

    pub fn set_min_bet_amount(ctx: Context<SetPlatformConfig>, min_bet_amount: u64) -> Result<()> {
        SetPlatformConfig::set_min_bet_amount(ctx, min_bet_amount)
    }

    pub fn set_price_account(ctx: Context<SetPlatformConfig>, price_account: Pubkey) -> Result<()> {
        SetPlatformConfig::set_price_account(ctx, price_account)
    }

    pub fn set_staleness_threshold(
        ctx: Context<SetPlatformConfig>,
        staleness_threshold: u64,
    ) -> Result<()> {
        SetPlatformConfig::set_staleness_threshold(ctx, staleness_threshold)
    }

    pub fn withdraw_platform_fees(ctx: Context<WithdrawPlatformFees>) -> Result<()> {
        WithdrawPlatformFees::withdraw_platform_fees(ctx)
    }

    pub fn deposit(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        DepositAndWithdraw::deposit(ctx, amount)
    }

    pub fn withdraw(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        DepositAndWithdraw::withdraw(ctx, amount)
    }

    pub fn set_affiliate(ctx: Context<SetAffiliate>, affiliate: Pubkey) -> Result<()> {
        SetAffiliate::set_affiliate(ctx, affiliate)
    }

    pub fn start_round(ctx: Context<RunRound>) -> Result<()> {
        RunRound::start_round(ctx)
    }

    pub fn end_round(ctx: Context<RunRound>) -> Result<()> {
        RunRound::end_round(ctx)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, is_long: bool) -> Result<()> {
        PlaceBet::place_bet(ctx, amount, is_long)
    }

    pub fn claim_user_winnings(ctx: Context<ClaimUserWinnings>, round_index: u64) -> Result<()> {
        ClaimUserWinnings::claim_user_winnings(ctx, round_index)
    }

    pub fn claim_affiliate_winnings(
        ctx: Context<ClaimAffiliateWinnings>,
        round_index: u64,
    ) -> Result<()> {
        ClaimAffiliateWinnings::claim_affiliate_winnings(ctx, round_index)
    }
}
