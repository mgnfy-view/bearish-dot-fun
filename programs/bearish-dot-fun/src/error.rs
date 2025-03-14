use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCodes {
    #[msg("Value should be greater than 0.")]
    VauleZero,
    #[msg("Default pubkey.")]
    DefaultPubkey,
    #[msg("Invalid round duration.")]
    InvalidDuration,
    #[msg("Invalid allocation. Does not add up to 100%.")]
    InvalidAllocation,
    #[msg("Invalid affiliate address.")]
    InvalidAffiliate,
    #[msg("Round already started.")]
    RoundAlreadyStarted,
    #[msg("Ineligible for claim.")]
    IneligibleForClaim,
}
