use anchor_lang::prelude::*;

use crate::{constants, events, PlatformConfig};

#[derive(Accounts)]
pub struct TransferOwnership<'info> {
    #[account(address = platform_config.owner)]
    pub owner: Signer<'info>,

    #[account()]
    pub new_owner: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::seeds::PLATFORM_CONFIG],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

impl TransferOwnership<'_> {
    pub fn transfer_ownership(ctx: Context<TransferOwnership>) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;
        let new_owner = &ctx.accounts.new_owner;

        platform_config.owner = new_owner.key();

        emit!(events::OwnershipTransferred {
            owner: ctx.accounts.owner.key(),
            new_owner: new_owner.key()
        });

        Ok(())
    }
}
