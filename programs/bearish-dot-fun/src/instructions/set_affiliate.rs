use anchor_lang::prelude::*;

use crate::{constants, error, events, UserInfo};

#[derive(Accounts)]
pub struct SetAffiliate<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

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
}

impl SetAffiliate<'_> {
    pub fn set_affiliate(ctx: Context<SetAffiliate>, affiliate: Pubkey) -> Result<()> {
        let user = &ctx.accounts.user;
        let user_info = &mut ctx.accounts.user_info;

        user_info.affiliate = affiliate;

        if user_info.bump == 0 {
            user_info.bump = ctx.bumps.user_info;
        }

        user_info.validate_affiliate(user.key)?;

        emit!(events::AffiliateSet {
            user: user.key(),
            affiliate: affiliate
        });

        Ok(())
    }
}
