use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::TransferChecked,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface},
};

use crate::{constants, error, events, Bet, PlatformConfig, Round};

#[derive(Accounts)]
#[instruction(round_index: u64)]
pub struct ClaimUserWinnings<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [constants::seeds::ALLOCATION],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    #[account(address = platform_config.stablecoin)]
    pub stablecoin: InterfaceAccount<'info, Mint>,

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
            constants::seeds::ROUND_VAULT,
            &round_index.to_be_bytes()
        ],
        bump = round.round_vault_bump,
        token::mint = stablecoin,
        token::authority = round_vault,
    )]
    pub round_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            constants::seeds::USER_BET,
            user.key().as_ref()
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
        let allocation = &ctx.accounts.platform_config.global_round_info.allocation;
        let stablecoin = &ctx.accounts.stablecoin;
        let round = &ctx.accounts.round;
        let round_vault = &mut ctx.accounts.round_vault;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(round.ending_price != 0, error::ErrorCodes::VauleZero);

        let have_longs_won = if round.ending_price > round.starting_price {
            true
        } else {
            false
        };
        require!(
            (have_longs_won && user_bet.is_long) || (!have_longs_won && !user_bet.is_long),
            error::ErrorCodes::IneligibleForClaim
        );

        let amount: u64;
        if have_longs_won {
            let pool_amount_to_claim_winnings_from = round
                .total_bet_amount_short
                .checked_mul(allocation.winners_share as u64)
                .unwrap()
                .checked_div(constants::general::BPS as u64)
                .unwrap();

            amount = user_bet
                .amount
                .checked_mul(pool_amount_to_claim_winnings_from)
                .unwrap()
                .checked_div(round.total_bet_amount_long)
                .unwrap();
        } else {
            let pool_amount_to_claim_winnings_from = round
                .total_bet_amount_short
                .checked_mul(allocation.winners_share as u64)
                .unwrap()
                .checked_div(constants::general::BPS as u64)
                .unwrap();

            amount = user_bet
                .amount
                .checked_mul(pool_amount_to_claim_winnings_from)
                .unwrap()
                .checked_div(round.total_bet_amount_short)
                .unwrap();
        }

        require!(amount > 0, error::ErrorCodes::VauleZero);

        let round_index_be_bytes = round_index.to_be_bytes();
        let round_vault_bump = &[round.round_vault_bump];
        let round_vault_signer = &[&[
            constants::seeds::ROUND_VAULT,
            &round_index_be_bytes,
            round_vault_bump,
        ][..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: round_vault.to_account_info(),
                    mint: stablecoin.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: round_vault.to_account_info(),
                },
                round_vault_signer,
            ),
            amount,
            stablecoin.decimals,
        )?;

        emit!(events::WinningsClaimed {
            user: ctx.accounts.user.key(),
            round_index: round_index,
            is_long: user_bet.is_long,
            amount: amount
        });

        Ok(())
    }
}
