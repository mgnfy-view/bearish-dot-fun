use anchor_lang::prelude::*;

use crate::{constants, error, events, Bet, PlatformConfig, Round, UserInfo};

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [constants::seeds::PLATFORM_CONFIG],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(
        mut,
        seeds = [
            constants::seeds::USER,
            user.key().as_ref()
        ],
        bump = user_info.bump,
    )]
    pub user_info: Account<'info, UserInfo>,

    #[account(
        mut,
        seeds = [
            constants::seeds::ROUND,
            (platform_config.global_round_info.round + 1).to_be_bytes().as_ref()
        ],
        bump = round.bump,
    )]
    pub round: Account<'info, Round>,

    #[account(
        init,
        payer = user,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + Bet::INIT_SPACE,
        seeds = [
            constants::seeds::USER_BET,
            user.key().as_ref(),
            (platform_config.global_round_info.round + 1).to_be_bytes().as_ref()
        ],
        bump,
    )]
    pub user_bet: Account<'info, Bet>,

    pub system_program: Program<'info, System>,
}

impl PlaceBet<'_> {
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, is_long: bool) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        let user_info = &mut ctx.accounts.user_info;
        let round = &mut ctx.accounts.round;
        let user_bet = &mut ctx.accounts.user_bet;

        user_info.amount -= amount;
        user_bet.amount += amount;

        user_bet.bump = ctx.bumps.user_bet;

        if is_long {
            round.long_positions += 1;
            round.total_bet_amount_long += amount;
            user_bet.is_long = true;

            if user_info.affiliate != Pubkey::default() {
                user_bet.affiliate = user_info.affiliate;
                round.affiliates_for_long_positions += 1;
            }
        } else {
            round.short_positions += 1;
            round.total_bet_amount_short += amount;

            if user_info.affiliate != Pubkey::default() {
                user_bet.affiliate = user_info.affiliate;
                round.affiliates_for_short_positions += 1;
            }
        }

        user_bet.validate_amount(platform_config.global_round_info.min_bet_amount)?;

        emit!(events::BetPlaced {
            user: ctx.accounts.user.key(),
            round: platform_config.global_round_info.round + 1,
            amount: amount,
            is_long: is_long,
            affiliate: user_info.affiliate,
        });

        Ok(())
    }
}
