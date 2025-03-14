use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{constants, error, events, Bet, PlatformConfig, Round};

#[derive(Accounts)]
#[instruction(round_index: u64)]
pub struct ClaimAffiliateWinnings<'info> {
    /// CHECK: The user who has placed a bet in the specified round.
    #[account()]
    pub user: AccountInfo<'info>,

    #[account()]
    pub affiliate: Signer<'info>,

    #[account(
        seeds = [constants::seeds::PLATFORM_CONFIG],
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
        token::authority = affiliate,
    )]
    pub affiliate_token_account: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl ClaimAffiliateWinnings<'_> {
    pub fn claim_affiliate_winnings(
        ctx: Context<ClaimAffiliateWinnings>,
        round_index: u64,
    ) -> Result<()> {
        let allocation = &ctx.accounts.platform_config.global_round_info.allocation;
        let stablecoin = &ctx.accounts.stablecoin;
        let round = &ctx.accounts.round;
        let round_vault = &mut ctx.accounts.round_vault;
        let user_bet = &mut ctx.accounts.user_bet;

        require!(
            round.ending_price != 0,
            error::ErrorCodes::PriceCannotBeZero
        );
        require!(
            !user_bet.has_affiliate_claimed_winnings,
            error::ErrorCodes::AlreadyClaimedWinnings
        );

        let have_longs_won = if round.ending_price > round.starting_price {
            true
        } else {
            false
        };
        require!(
            (have_longs_won && user_bet.is_long) || (!have_longs_won && !user_bet.is_long),
            error::ErrorCodes::IneligibleForClaim
        );

        user_bet.has_affiliate_claimed_winnings = true;

        let amount: u64;
        if have_longs_won {
            let affiliate_pool_amount_to_claim_winnings_from = round
                .total_bet_amount_short
                .checked_mul(allocation.affiliate_share as u64)
                .unwrap()
                .checked_div(constants::general::BPS as u64)
                .unwrap();
            amount = affiliate_pool_amount_to_claim_winnings_from
                .checked_div(round.affiliates_for_long_positions)
                .unwrap();
        } else {
            let affiliate_pool_amount_to_claim_winnings_from = round
                .total_bet_amount_long
                .checked_mul(allocation.affiliate_share as u64)
                .unwrap()
                .checked_div(constants::general::BPS as u64)
                .unwrap();
            amount = affiliate_pool_amount_to_claim_winnings_from
                .checked_div(round.affiliates_for_short_positions)
                .unwrap();
        }

        require!(amount > 0, error::ErrorCodes::ClaimAmountZero);

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
                    to: ctx.accounts.affiliate.to_account_info(),
                    authority: round_vault.to_account_info(),
                },
                round_vault_signer,
            ),
            amount,
            stablecoin.decimals,
        )?;

        emit!(events::AffiliateWinningsClaimed {
            affiliate: ctx.accounts.affiliate.key(),
            round_index: round_index,
            amount: amount
        });

        Ok(())
    }
}
