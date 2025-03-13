use anchor_lang::prelude::*;
use pyth_sdk_solana::state::SolanaPriceAccount;

pub fn get_price(price_account: &AccountInfo, staleness_threshold: u64) -> u64 {
    let price_account = SolanaPriceAccount::account_info_to_feed(&price_account).unwrap();
    let current_time = Clock::get().unwrap().unix_timestamp;

    price_account
        .get_price_no_older_than(current_time, staleness_threshold)
        .unwrap()
        .price as u64
}
