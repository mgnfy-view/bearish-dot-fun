use anchor_lang::prelude::*;
use anchor_spl::{
    token_2022::TransferChecked,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface},
};

use crate::{constants, error, events, PlatformConfig, UserInfo};

#[derive(Accounts)]
pub struct DepositAndWithdraw<'info> {
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
        mut,
        seeds = [constants::seeds::PLATFORM_VAULT],
        bump = platform_config.platform_vault_bump,
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
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + UserInfo::INIT_SPACE,
        seeds = [
            constants::seeds::USER,
            user.key().as_ref()
        ],
        bump,
    )]
    pub user_info: Account<'info, UserInfo>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl DepositAndWithdraw<'_> {
    pub fn deposit(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        let user = &ctx.accounts.user;
        let stablecoin = &ctx.accounts.stablecoin;
        let user_info = &mut ctx.accounts.user_info;

        require!(amount > 0, error::ErrorCodes::DepositAmountZero);

        user_info.amount += amount;

        if user_info.bump == 0 {
            user_info.bump = ctx.bumps.user_info;
        }

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

        emit!(events::Deposited {
            user: user.key(),
            stablecoin: stablecoin.key(),
            amount: amount
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<DepositAndWithdraw>, amount: u64) -> Result<()> {
        let stablecoin = &ctx.accounts.stablecoin;
        let platform_vault = &mut ctx.accounts.platform_vault;
        let user_info = &mut ctx.accounts.user_info;

        require!(amount > 0, error::ErrorCodes::WithdrawAmountZero);

        user_info.amount -= amount;

        let platform_vault_bump = &[ctx.accounts.platform_config.platform_vault_bump];
        let platform_vault_signer = &[&[constants::seeds::PLATFORM_VAULT, platform_vault_bump][..]];

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

        emit!(events::Withdrawn {
            user: ctx.accounts.user.key(),
            stablecoin: stablecoin.key(),
            amount: amount
        });

        Ok(())
    }
}
