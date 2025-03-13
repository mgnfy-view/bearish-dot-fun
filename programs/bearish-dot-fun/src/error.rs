use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCodes {
    #[msg("Invalid allocation. Does not add up to 100%.")]
    InvalidAllocation,
}
