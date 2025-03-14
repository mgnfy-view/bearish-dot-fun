use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::TransferChecked,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface},
};

use crate::{constants, error, events, PlatformConfig, Round};

#[derive(Accounts)]
#[instruction(round_index: u64)]
pub struct WithdrawAccumulatedFees<'info> {
    #[account(address = platform_config.owner)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        token::mint = stablecoin,
        token::authority = owner,
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
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

    pub token_program: Interface<'info, TokenInterface>,
}

impl WithdrawAccumulatedFees<'_> {
    pub fn withdraw_accumulated_fees(
        ctx: Context<WithdrawAccumulatedFees>,
        round_index: u64,
    ) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        let stablecoin = &ctx.accounts.stablecoin;
        let round = &mut ctx.accounts.round;
        let round_vault = &mut ctx.accounts.round_vault;

        require!(round.ending_price != 0, error::ErrorCodes::VauleZero);
        require!(
            !round.has_claimed_platform_fees,
            error::ErrorCodes::AlreadyCollectedPlatformFees
        );

        round.has_claimed_platform_fees = true;

        let have_longs_won = if round.ending_price > round.starting_price {
            true
        } else {
            false
        };
        let platform_fee_amount = if have_longs_won {
            round
                .total_bet_amount_short
                .checked_mul(platform_config.global_round_info.allocation.platform_share as u64)
                .unwrap()
                .checked_div(constants::general::BPS as u64)
                .unwrap()
        } else {
            round
                .total_bet_amount_long
                .checked_mul(platform_config.global_round_info.allocation.platform_share as u64)
                .unwrap()
                .checked_div(constants::general::BPS as u64)
                .unwrap()
        };

        require!(platform_fee_amount > 0, error::ErrorCodes::VauleZero);

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
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: round_vault.to_account_info(),
                },
                round_vault_signer,
            ),
            platform_fee_amount,
            stablecoin.decimals,
        )?;

        emit!(events::CollectedPlatformFees {
            owner: ctx.accounts.owner.key(),
            round_index: round_index,
            amount: platform_fee_amount
        });

        Ok(())
    }
}
