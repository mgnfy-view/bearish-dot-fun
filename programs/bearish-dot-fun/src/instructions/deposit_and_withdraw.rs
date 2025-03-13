use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::TransferChecked,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface},
};

use crate::{constants, events, PlatformConfig, UserDeposit};

#[derive(Accounts)]
pub struct DepositAndWithdraw<'info> {
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
        token::mint = stablecoin,
        token::authority = platform_vault
    )]
    pub platform_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stablecoin,
        token::authority = user,
    )]
    pub user_token_account: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + UserDeposit::INIT_SPACE,
        seeds = [
            constants::seeds::USER,
            user.key().as_ref()
        ],
        bump,
    )]
    pub user_deposit: Account<'info, UserDeposit>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl DepositAndWithdraw<'_> {
    pub fn deposit(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        let user = &ctx.accounts.user;
        let stablecoin = &ctx.accounts.stablecoin;
        let user_deposit = &mut ctx.accounts.user_deposit;

        user_deposit.amount += amount;

        user_deposit.bump = ctx.bumps.user_deposit;

        transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    mint: stablecoin.to_account_info(),
                    to: ctx.accounts.platform_vault.to_account_info(),
                    authority: user.to_account_info(),
                },
            ),
            amount,
            stablecoin.decimals,
        )?;

        user_deposit.validate_amount()?;

        emit!(events::Deposited {
            user: user.key(),
            stablecoin: stablecoin.key(),
            amount: amount
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        let platform_config = &ctx.accounts.platform_config;
        let stablecoin = &ctx.accounts.stablecoin;
        let user_deposit = &mut ctx.accounts.user_deposit;

        user_deposit.amount -= amount;

        let platform_vault_bump = &[platform_config.platform_vault_bump];
        let platform_vault_signer = &[&[constants::seeds::PLATFORM_VAULT, platform_vault_bump][..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: ctx.accounts.platform_vault.to_account_info(),
                    mint: stablecoin.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.platform_vault.to_account_info(),
                },
                platform_vault_signer,
            ),
            amount,
            stablecoin.decimals,
        )?;

        emit!(events::Withdrawn {
            user: ctx.accounts.user.key(),
            stablecoin: stablecoin.key(),
            amount: amount
        });

        Ok(())
    }
}
