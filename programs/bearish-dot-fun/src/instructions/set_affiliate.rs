use anchor_lang::prelude::*;

use crate::{constants, events, UserDeposit};

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
        space = constants::general::ANCHOR_DISCRIMINATOR_SIZE + UserDeposit::INIT_SPACE,
        seeds = [
            constants::seeds::USER,
            user.key().as_ref()
        ],
        bump,
    )]
    pub user_deposit: Account<'info, UserDeposit>,

    pub system_program: Program<'info, System>,
}

impl SetAffiliate<'_> {
    pub fn set_affiliate(ctx: Context<SetAffiliate>) -> Result<()> {
        let user = &ctx.accounts.user;
        let affiliate = &ctx.accounts.affiliate;
        let user_deposit = &mut ctx.accounts.user_deposit;

        user_deposit.affiliate = affiliate.key();

        user_deposit.validate_affiliate(user.key)?;

        emit!(events::AffiliateSet {
            user: user.key(),
            affiliate: affiliate.key()
        });

        Ok(())
    }
}
