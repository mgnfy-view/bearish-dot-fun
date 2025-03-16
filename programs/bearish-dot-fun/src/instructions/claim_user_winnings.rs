use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

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

    #[account(address = platform_config.stablecoin)]
    pub stablecoin: InterfaceAccount<'info, Mint>,

    #[account(
        mut,
        seeds = [constants::seeds::PLATFORM_VAULT],
        bump = platform_config.platform_vault_bump,
        token::mint = stablecoin,
        token::authority = platform_vault
    )]
    pub platform_vault: InterfaceAccount<'info, TokenAccount>,

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
            &round_index.to_be_bytes()
        ],
        bump = round.bump,
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [
            constants::seeds::USER_BET,
            user.key().as_ref(),
            &round_index.to_be_bytes(),
        ],
        bump = user_bet.bump,
    )]
    pub user_bet: Account<'info, Bet>,

    #[account(
        mut,
        token::mint = stablecoin,
        token::authority = user,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl ClaimUserWinnings<'_> {
    pub fn claim_user_winnings(ctx: Context<ClaimUserWinnings>, round_index: u64) -> Result<()> {
        let global_round_info = &mut ctx.accounts.platform_config.global_round_info;
        let platform_vault = &mut ctx.accounts.platform_vault;
        let stablecoin = &ctx.accounts.stablecoin;
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
        user_info.amount += user_bet.amount;

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
            && round_index == user_info.last_won_round + 1
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
        user_info.last_won_round = round_index;

        if amount > 0 {
            let platform_vault_bump = &[ctx.accounts.platform_config.platform_vault_bump];
            let platform_vault_signer =
                &[&[constants::seeds::PLATFORM_VAULT, platform_vault_bump][..]];

            transfer_checked(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    TransferChecked {
                        from: platform_vault.to_account_info(),
                        mint: stablecoin.to_account_info(),
                        to: ctx.accounts.user_token_account.to_account_info(),
                        authority: platform_vault.to_account_info(),
                    },
                    platform_vault_signer,
                ),
                amount,
                stablecoin.decimals,
            )?;
        }

        emit!(events::WinningsClaimed {
            user: ctx.accounts.user.key(),
            round_index: round_index,
            is_long: user_bet.is_long,
            amount: amount
        });

        Ok(())
    }
}
