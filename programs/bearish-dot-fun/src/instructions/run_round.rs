use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{constants, error, events, utils, PlatformConfig, Round};

#[derive(Accounts)]
pub struct RunRound<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [constants::seeds::PLATFORM_CONFIG],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(address = platform_config.stablecoin)]
    pub stablecoin: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + Round::INIT_SPACE,
        seeds = [
            constants::seeds::ROUND,
            &(platform_config.global_round_info.round + 1).to_be_bytes()
        ],
        bump,
    )]
    pub round: Account<'info, Round>,

    #[account(
        init_if_needed,
        payer = user,
        seeds = [
            constants::seeds::ROUND_VAULT,
            &(platform_config.global_round_info.round + 1).to_be_bytes()
        ],
        bump,
        token::mint = stablecoin,
        token::authority = round_vault,
    )]
    pub round_vault: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: The pyth price account to fetch the latest price from.
    #[account(address = platform_config.global_round_info.price_account)]
    pub price_account: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
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

        let price = utils::get_price(
            &ctx.accounts.price_account,
            platform_config.global_round_info.staleness_threshold,
        );
        round.starting_price = price;

        round.bump = ctx.bumps.round;
        round.round_vault_bump = ctx.bumps.round_vault;

        round.validate_starting_price()?;

        emit!(events::RoundStarted {
            round: platform_config.global_round_info.round + 1,
            starting_price: price
        });

        Ok(())
    }

    pub fn end_round(ctx: Context<RunRound>) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;
        let round = &mut ctx.accounts.round;

        require!(
            round.ending_price == 0,
            error::ErrorCodes::RoundAlreadyEnded
        );

        let price = utils::get_price(
            &ctx.accounts.price_account,
            platform_config.global_round_info.staleness_threshold,
        );
        round.ending_price = price;
        platform_config.global_round_info.round += 1;

        if platform_config.global_round_info.allocation.jackpot_share > 0 {
            let have_longs_won = if round.ending_price > round.starting_price {
                true
            } else {
                false
            };

            if have_longs_won {
                round.jackpot_pool_amount = round
                    .total_bet_amount_short
                    .checked_mul(platform_config.global_round_info.allocation.jackpot_share as u64)
                    .unwrap()
                    .checked_div(constants::general::BPS as u64)
                    .unwrap();
            } else {
                round.jackpot_pool_amount = round
                    .total_bet_amount_long
                    .checked_mul(platform_config.global_round_info.allocation.jackpot_share as u64)
                    .unwrap()
                    .checked_div(constants::general::BPS as u64)
                    .unwrap();
            }
        }

        round.validate_round_duration(platform_config.global_round_info.duration)?;

        emit!(events::RoundEnded {
            round: platform_config.global_round_info.round,
            ending_price: price
        });

        Ok(())
    }
}
