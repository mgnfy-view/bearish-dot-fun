use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCodes {
    #[msg("Round duration cannot be 0.")]
    DurationZero,
    #[msg("Invalid allocation. Does not add up to 100%.")]
    InvalidAllocation,
    #[msg("Exceeds max fee in bips.")]
    ExceedsMaxFee,
    #[msg("Invalid jackpot allocation.")]
    InvalidJackPotAllocation,
    #[msg("Price account cannot be default pubkey.")]
    PriceAccountDefaultPubkey,
    #[msg("Deposit amount cannot be 0.")]
    DepositAmountZero,
    #[msg("Withdraw amount cannot be 0.")]
    WithdrawAmountZero,
    #[msg("Invalid affiliate address.")]
    InvalidAffiliate,
    #[msg("Price cannot be 0.")]
    PriceCannotBeZero,
    #[msg("Round has not ended yet.")]
    RoundHasNotEndedYet,
    #[msg("Round already started.")]
    RoundAlreadyStarted,
    #[msg("Round already ended.")]
    RoundAlreadyEnded,
    #[msg("Bet amount cannot be less than the minimum bet amount.")]
    BetAmountBelowMinBetAmount,
    #[msg("Already claimed winnings.")]
    AlreadyClaimedWinnings,
    #[msg("Ineligible for claim.")]
    IneligibleForClaim,
    #[msg("Already collected platform fees.")]
    AlreadyCollectedPlatformFees,
    #[msg("Claim amount cannot be 0.")]
    ClaimAmountZero,
    #[msg("Platform fee amount to collect is 0.")]
    PlatformFeeAmountZero,
}
