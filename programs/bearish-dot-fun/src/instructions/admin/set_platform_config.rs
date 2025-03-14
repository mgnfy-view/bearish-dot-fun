use anchor_lang::prelude::*;

use crate::{constants, events, Allocation, JackPotAllocation, PlatformConfig};

#[derive(Accounts)]
pub struct SetPlatformConfig<'info> {
    #[account(address = platform_config.owner)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::seeds::PLATFORM_CONFIG],
        bump = platform_config.bump,
    )]
    pub platform_config: Account<'info, PlatformConfig>,
}

impl SetPlatformConfig<'_> {
    pub fn set_duration(ctx: Context<SetPlatformConfig>, duration: u64) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;

        platform_config.global_round_info.duration = duration;

        platform_config.validate_duration()?;

        emit!(events::DurationSet { duration: duration });

        Ok(())
    }

    pub fn set_allocation(ctx: Context<SetPlatformConfig>, allocation: Allocation) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;

        platform_config.global_round_info.allocation = allocation.clone();

        platform_config.validate_allocation()?;

        emit!(events::AllocationSet {
            allocation: allocation
        });

        Ok(())
    }

    pub fn set_jackpot_allocation(
        ctx: Context<SetPlatformConfig>,
        jackpot_allocation: JackPotAllocation,
    ) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;

        platform_config.global_round_info.jackpot_allocation = jackpot_allocation.clone();

        platform_config.validate_jackpot_allocation()?;

        emit!(events::JackPotAllocationSet {
            jackpot_allocation: jackpot_allocation
        });

        Ok(())
    }

    pub fn set_min_bet_amount(ctx: Context<SetPlatformConfig>, min_bet_amount: u64) -> Result<()> {
        ctx.accounts
            .platform_config
            .global_round_info
            .min_bet_amount = min_bet_amount;

        emit!(events::MinBetAmountSet {
            min_bet_amount: min_bet_amount
        });

        Ok(())
    }

    pub fn set_price_account(ctx: Context<SetPlatformConfig>, price_account: Pubkey) -> Result<()> {
        let platform_config = &mut ctx.accounts.platform_config;

        platform_config.global_round_info.price_account = price_account;

        platform_config.validate_price_account()?;

        emit!(events::PriceAccountSet {
            price_account: price_account
        });

        Ok(())
    }

    pub fn set_staleness_threshold(
        ctx: Context<SetPlatformConfig>,
        staleness_threshold: u64,
    ) -> Result<()> {
        ctx.accounts
            .platform_config
            .global_round_info
            .staleness_threshold = staleness_threshold;

        emit!(events::StalenessThresholdSet {
            staleness_threshold: staleness_threshold
        });

        Ok(())
    }
}
