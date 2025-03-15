pub mod math {
    pub fn is_greater_than(x: &u64, y: &u64) -> bool {
        if *x > *y {
            true
        } else {
            false
        }
    }

    pub fn mul_div_down(x: &u128, y: &u128, d: &u128) -> u128 {
        x.checked_mul(*y).unwrap().checked_div(*d).unwrap()
    }
}

pub mod general {
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
}
