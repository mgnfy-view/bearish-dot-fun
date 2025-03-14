use anchor_lang::prelude::*;

use crate::{constants, error, events, UserInfo};

#[derive(Accounts)]
pub struct SetAffiliate<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    /// CHECK: The afffiliate being set by the user.
    #[account()]
    pub affiliate: AccountInfo<'info>,

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
    pub fn set_affiliate(ctx: Context<SetAffiliate>) -> Result<()> {
        let user = &ctx.accounts.user;
        let affiliate = &ctx.accounts.affiliate;
        let user_info = &mut ctx.accounts.user_info;

        user_info.affiliate = affiliate.key();

        user_info.validate_affiliate(user.key)?;

        emit!(events::AffiliateSet {
            user: user.key(),
            affiliate: affiliate.key()
        });

        Ok(())
    }
}
