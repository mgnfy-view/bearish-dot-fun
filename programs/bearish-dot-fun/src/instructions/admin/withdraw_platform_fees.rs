use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{constants, error, events, PlatformConfig};

#[derive(Accounts)]
pub struct WithdrawPlatformFees<'info> {
    #[account(address = platform_config.owner)]
    pub owner: Signer<'info>,

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
        token::mint = stablecoin,
        token::authority = owner,
    )]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl WithdrawPlatformFees<'_> {
    pub fn withdraw_platform_fees(ctx: Context<WithdrawPlatformFees>) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;
        let stablecoin = &ctx.accounts.stablecoin;
        let platform_vault = &mut ctx.accounts.platform_vault;

        let accumulated_platform_fees = platform_config.global_round_info.accumulated_platform_fees;
        require!(
            accumulated_platform_fees > 0,
            error::ErrorCodes::PlatformFeeAmountZero
        );

        platform_config.global_round_info.accumulated_platform_fees = 0;

        let platform_vault_bump = &[platform_config.platform_vault_bump];
        let platform_vault_signer = &[&[constants::seeds::PLATFORM_VAULT, platform_vault_bump][..]];

        transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                TransferChecked {
                    from: platform_vault.to_account_info(),
                    mint: stablecoin.to_account_info(),
                    to: ctx.accounts.owner_token_account.to_account_info(),
                    authority: platform_vault.to_account_info(),
                },
                platform_vault_signer,
            ),
            accumulated_platform_fees,
            stablecoin.decimals,
        )?;

        emit!(events::CollectedPlatformFees {
            owner: ctx.accounts.owner.key(),
            amount: accumulated_platform_fees
        });

        Ok(())
    }
}
