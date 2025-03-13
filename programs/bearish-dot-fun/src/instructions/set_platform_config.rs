use anchor_lang::prelude::*;

use crate::{constants, events, Allocation, PlatformConfig};

#[derive(Accounts)]
pub struct SetPlatformConfig<'info> {
    #[account(address = platform_config.owner)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::seeds::ALLOCATION],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

impl SetPlatformConfig<'_> {
    pub fn set_allocation(ctx: Context<SetPlatformConfig>, allocation: Allocation) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;

        platform_config.allocation = allocation.clone();

        platform_config.validate_allocation()?;

        emit!(events::AllocationSet {
            allocation: allocation
        });

        Ok(())
    }

    pub fn set_min_bet_amount(ctx: Context<SetPlatformConfig>, min_bet_amount: u64) -> Result<()> {
        ctx.accounts.platform_config.min_bet_amount = min_bet_amount;

        emit!(events::MinBetAmountSet {
            min_bet_amount: min_bet_amount
        });

        Ok(())
    }
}
