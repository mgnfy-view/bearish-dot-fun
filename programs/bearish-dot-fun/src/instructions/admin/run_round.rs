use anchor_lang::prelude::*;

use crate::{constants, events, utils, PlatformConfig, Round};

#[derive(Accounts)]
pub struct RunRound<'info> {
    #[account(
        mut,
        address = platform_config.owner,
    )]
    pub owner: Signer<'info>,

    #[account(
        seeds = [constants::seeds::ALLOCATION],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        init_if_needed,
        payer = owner,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + Round::INIT_SPACE,
        seeds = [
            constants::seeds::ROUND,
            &(platform_config.global_round_info.round + 1).to_be_bytes()
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

        let price = utils::get_price(
            &ctx.accounts.price_account,
            platform_config.global_round_info.staleness_threshold,
        );
        round.starting_price = price;

        let current_time = Clock::get()?.unix_timestamp as u64;
        round.start_time = current_time;

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

        let price = utils::get_price(
            &ctx.accounts.price_account,
            platform_config.global_round_info.staleness_threshold,
        );
        round.ending_price = price;
        platform_config.global_round_info.round += 1;

        round.validate_round_duration(platform_config.global_round_info.duration)?;

        emit!(events::RoundEnded {
            round: platform_config.global_round_info.round,
            ending_price: price
        });

        Ok(())
    }
}
