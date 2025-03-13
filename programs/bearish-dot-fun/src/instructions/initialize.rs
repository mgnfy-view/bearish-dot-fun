use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::{constants, events, Allocation, PlatformConfig};

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account()]
    pub stablecoin: InterfaceAccount<'info, Mint>,

    #[account(
        init_if_needed,
        payer = owner,
        seeds = [constants::seeds::PLATFORM_VAULT],
        bump,
        token::mint = stablecoin,
        token::authority = platform_vault
    )]
    pub platform_vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init,
        payer = owner,
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + PlatformConfig::INIT_SPACE,
        seeds = [constants::seeds::ALLOCATION],
        bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,

    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl Initialize<'_> {
    pub fn initialize(ctx: Context<Initialize>, allocation: Allocation) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;

        let owner_pubkey = ctx.accounts.owner.key();
        let stablecoin_pubkey = ctx.accounts.stablecoin.key();

        platform_config.owner = owner_pubkey;
        platform_config.stablecoin = stablecoin_pubkey;
        platform_config.allocation = allocation.clone();

        platform_config.bump = ctx.bumps.platform_config;
        platform_config.platform_vault_bump = ctx.bumps.platform_vault;

        platform_config.validate_allocation()?;

        emit!(events::Initialized {
            owner: owner_pubkey,
            stablecoin: stablecoin_pubkey,
            platform_vault: ctx.accounts.platform_vault.key(),
            allocation: allocation,
        });

        Ok(())
    }
}
