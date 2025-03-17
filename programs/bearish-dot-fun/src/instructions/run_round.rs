use anchor_lang::prelude::*;

use crate::{constants, error, events, utils, PlatformConfig, Round};

#[derive(Accounts)]
pub struct RunRound<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::seeds::PLATFORM_CONFIG],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init_if_needed,
        payer = user,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + Round::INIT_SPACE,
        seeds = [
            constants::seeds::ROUND,
            (platform_config.global_round_info.round + 1).to_be_bytes().as_ref()
        ],
        bump,
    )]
    pub round: Account<'info, Round>,

    /// CHECK: The pyth price account to fetch the latest price from.
    #[account(address = platform_config.global_round_info.price_account)]
    pub price_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}

impl RunRound<'_> {
    pub fn start_round(ctx: Context<RunRound>) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        let round = &mut ctx.accounts.round;

        require!(
            round.start_time == 0,
            error::ErrorCodes::RoundAlreadyStarted
        );

        let current_time = Clock::get()?.unix_timestamp as u64;
        round.start_time = current_time;

        let price = utils::general::get_price(
            &ctx.accounts.price_account,
            platform_config.global_round_info.staleness_threshold,
        );
        round.starting_price = price;

        round.bump = ctx.bumps.round;

        round.validate_starting_price()?;

        emit!(events::RoundStarted {
            round: platform_config.global_round_info.round + 1,
            starting_price: price
        });

        Ok(())
    }

    pub fn end_round(ctx: Context<RunRound>) -> Result<()> {
        let global_round_info = &mut ctx.accounts.platform_config.global_round_info;
        let round = &mut ctx.accounts.round;

        require!(
            round.ending_price == 0,
            error::ErrorCodes::RoundAlreadyEnded
        );

        let price = utils::general::get_price(
            &ctx.accounts.price_account,
            global_round_info.staleness_threshold,
        );
        round.ending_price = price;
        global_round_info.round += 1;

        if round.ending_price == round.starting_price {
            global_round_info.jackpot_pool_amount += u64::try_from(utils::math::mul_div_down(
                &((round.total_bet_amount_long + round.total_bet_amount_short) as u128),
                &((global_round_info.allocation.jackpot_share
                    + global_round_info.allocation.winners_share
                    + global_round_info.allocation.affiliate_share) as u128),
                &(constants::general::BPS as u128),
            ))
            .unwrap();

            global_round_info.accumulated_platform_fees +=
                u64::try_from(utils::math::mul_div_down(
                    &((round.total_bet_amount_long + round.total_bet_amount_short) as u128),
                    &(global_round_info.allocation.platform_share as u128),
                    &(constants::general::BPS as u128),
                ))
                .unwrap();
        } else {
            let have_longs_won =
                utils::math::is_greater_than(&round.ending_price, &round.starting_price);
            if have_longs_won {
                global_round_info.jackpot_pool_amount += u64::try_from(utils::math::mul_div_down(
                    &(round.total_bet_amount_short as u128),
                    &(global_round_info.allocation.jackpot_share as u128),
                    &(constants::general::BPS as u128),
                ))
                .unwrap();

                global_round_info.accumulated_platform_fees +=
                    u64::try_from(utils::math::mul_div_down(
                        &(round.total_bet_amount_short as u128),
                        &(global_round_info.allocation.platform_share as u128),
                        &(constants::general::BPS as u128),
                    ))
                    .unwrap();

                if round.total_bet_amount_long == 0 {
                    global_round_info.jackpot_pool_amount +=
                        u64::try_from(utils::math::mul_div_down(
                            &(round.total_bet_amount_short as u128),
                            &((global_round_info.allocation.winners_share
                                + global_round_info.allocation.affiliate_share)
                                as u128),
                            &(constants::general::BPS as u128),
                        ))
                        .unwrap();
                }
            } else {
                global_round_info.jackpot_pool_amount += u64::try_from(utils::math::mul_div_down(
                    &(round.total_bet_amount_long as u128),
                    &(global_round_info.allocation.jackpot_share as u128),
                    &(constants::general::BPS as u128),
                ))
                .unwrap();

                global_round_info.accumulated_platform_fees +=
                    u64::try_from(utils::math::mul_div_down(
                        &(round.total_bet_amount_long as u128),
                        &(global_round_info.allocation.platform_share as u128),
                        &(constants::general::BPS as u128),
                    ))
                    .unwrap();

                if round.total_bet_amount_short == 0 {
                    global_round_info.jackpot_pool_amount +=
                        u64::try_from(utils::math::mul_div_down(
                            &(round.total_bet_amount_long as u128),
                            &((global_round_info.allocation.winners_share
                                + global_round_info.allocation.affiliate_share)
                                as u128),
                            &(constants::general::BPS as u128),
                        ))
                        .unwrap();
                }
            }
        }

        round.validate_round_duration(global_round_info.duration)?;

        emit!(events::RoundEnded {
            round: global_round_info.round,
            ending_price: price
        });

        Ok(())
    }
}
