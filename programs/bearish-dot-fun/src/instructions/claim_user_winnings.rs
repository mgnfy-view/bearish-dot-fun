use anchor_lang::prelude::*;

use crate::{constants, error, events, utils, Bet, PlatformConfig, Round, UserInfo};

#[derive(Accounts)]
#[instruction(round_index: u64)]
pub struct ClaimUserWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
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
        seeds = [
            constants::seeds::ROUND,
            (round_index + 1).to_be_bytes().as_ref(),
        ],
        bump = round.bump,
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [
            constants::seeds::USER_BET,
            user.key().as_ref(),
            (round_index + 1).to_be_bytes().as_ref(),
        ],
        bump = user_bet.bump,
    )]
    pub user_bet: Account<'info, Bet>,

    pub system_program: Program<'info, System>,
}

impl ClaimUserWinnings<'_> {
    pub fn claim_user_winnings(ctx: Context<ClaimUserWinnings>, round_index: u64) -> Result<()> {
        let global_round_info = &mut ctx.accounts.platform_config.global_round_info;
        let user_info = &mut ctx.accounts.user_info;
        let round = &ctx.accounts.round;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(
            round.ending_price != 0,
            error::ErrorCodes::RoundHasNotEndedYet
        );
        require!(
            !user_bet.has_claimed_winnings,
            error::ErrorCodes::AlreadyClaimedWinnings
        );

        let have_longs_won =
            utils::math::is_greater_than(&round.ending_price, &round.starting_price);
        require!(
            round.ending_price != round.starting_price
                && ((have_longs_won && user_bet.is_long) || (!have_longs_won && !user_bet.is_long)),
            error::ErrorCodes::IneligibleForClaim
        );

        user_bet.has_claimed_winnings = true;

        let mut amount: u64;
        let pool_amount_to_claim_winnings_from: u64;
        if have_longs_won {
            pool_amount_to_claim_winnings_from = u64::try_from(utils::math::mul_div_down(
                &(round.total_bet_amount_short as u128),
                &(global_round_info.allocation.winners_share as u128),
                &(constants::general::BPS as u128),
            ))
            .unwrap();
            amount = u64::try_from(utils::math::mul_div_down(
                &(user_bet.amount as u128),
                &(pool_amount_to_claim_winnings_from as u128),
                &(round.total_bet_amount_long as u128),
            ))
            .unwrap();
        } else {
            pool_amount_to_claim_winnings_from = u64::try_from(utils::math::mul_div_down(
                &(round.total_bet_amount_long as u128),
                &(global_round_info.allocation.winners_share as u128),
                &(constants::general::BPS as u128),
            ))
            .unwrap();
            amount = u64::try_from(utils::math::mul_div_down(
                &(user_bet.amount as u128),
                &(pool_amount_to_claim_winnings_from as u128),
                &(round.total_bet_amount_short as u128),
            ))
            .unwrap();
        }

        user_info.times_won += 1;
        let streak_winnings_share = match user_info.times_won {
            10 => global_round_info.jackpot_allocation.streak_10,
            9 => global_round_info.jackpot_allocation.streak_9,
            8 => global_round_info.jackpot_allocation.streak_8,
            7 => global_round_info.jackpot_allocation.streak_7,
            6 => global_round_info.jackpot_allocation.streak_6,
            5 => global_round_info.jackpot_allocation.streak_5,
            _ => 0,
        };
        if streak_winnings_share > 0
            && round_index == user_info.last_won_round
            && global_round_info.jackpot_pool_amount > 0
        {
            let jackpot_amount = u64::try_from(utils::math::mul_div_down(
                &(global_round_info.jackpot_pool_amount as u128),
                &(streak_winnings_share as u128),
                &(constants::general::BPS as u128),
            ))
            .unwrap();
            amount += jackpot_amount;

            global_round_info.jackpot_pool_amount -= jackpot_amount;

            if user_info.times_won == 10 {
                user_info.times_won = 0;
            }
        }

        user_info.amount += user_bet.amount + amount;
        if round_index != user_info.last_won_round {
            user_info.times_won = 1;
        }
        user_info.last_won_round = round_index + 1;

        emit!(events::WinningsClaimed {
            user: ctx.accounts.user.key(),
            round_index: round_index,
            is_long: user_bet.is_long,
            amount: amount
        });

        Ok(())
    }
}
