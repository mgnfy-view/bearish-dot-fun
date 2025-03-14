use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::TransferChecked,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface},
};

use crate::{constants, events, Bet, PlatformConfig, Round, UserDeposit};

#[derive(Accounts)]
pub struct PlaceBet<'info> {
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
        bump = user_deposit.bump,
    )]
    pub user_deposit: Account<'info, UserDeposit>,

    #[account(
        mut,
        seeds = [
            constants::seeds::ROUND,
            &(platform_config.global_round_info.round + 1).to_be_bytes()
        ],
        bump = round.bump,
    )]
    pub round: Account<'info, Round>,

    #[account(
        mut,
        seeds = [
            constants::seeds::ROUND_VAULT,
            &(platform_config.global_round_info.round + 1).to_be_bytes()
        ],
        bump = round.round_vault_bump,
        token::mint = stablecoin,
        token::authority = round_vault,
    )]
    pub round_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = user,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + Bet::INIT_SPACE,
        seeds = [
            constants::seeds::USER_BET,
            user.key().as_ref()
        ],
        bump,
    )]
    pub user_bet: Account<'info, Bet>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl PlaceBet<'_> {
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, is_long: bool) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        let stablecoin = &ctx.accounts.stablecoin;
        let platform_vault = &ctx.accounts.platform_vault;
        let user_deposit = &mut ctx.accounts.user_deposit;
        let round = &mut ctx.accounts.round;
        let user_bet = &mut ctx.accounts.user_bet;

        user_deposit.amount -= amount;
        user_bet.amount += amount;

        if is_long {
            round.long_positions += 1;
            round.total_bet_amount_long += amount;
            user_bet.is_long = true;
        } else {
            round.short_positions += 1;
            round.total_bet_amount_short += amount;
        }

        let platform_vault_bump = &[platform_config.platform_vault_bump];
        let platform_vault_signer = &[&[constants::seeds::PLATFORM_VAULT, platform_vault_bump][..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: platform_vault.to_account_info(),
                    mint: stablecoin.to_account_info(),
                    to: ctx.accounts.round_vault.to_account_info(),
                    authority: platform_vault.to_account_info(),
                },
                platform_vault_signer,
            ),
            amount,
            stablecoin.decimals,
        )?;

        emit!(events::BetPlaced {
            user: ctx.accounts.user.key(),
            round: platform_config.global_round_info.round + 1,
            amount: amount,
            is_long: is_long
        });

        Ok(())
    }
}
