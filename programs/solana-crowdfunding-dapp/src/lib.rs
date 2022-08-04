use anchor_lang::prelude::*;
use anchor_lang::solana_program::entrypoint::ProgramResult;

declare_id!("Dy8b9Y5517w93arqDb8rhSDb2M1pFT64BFNF5oqsEK9C");

#[program]
pub mod solana_crowdfunding_dapp {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, description: String) -> Result<()> {
        let compaign = &mut ctx.accounts.compaign;
        compaign.name = name;
        compaign.description = description;
        compaign.amount_donated = 0;
        compaign.admin = *ctx.accounts.user.key;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> ProgramResult {
        let compaign = &mut ctx.accounts.compaign;
        let user = &mut ctx.accounts.user;
        let rent_balance = Rent::get()?.minimum_balance(compaign.to_account_info().data_len());

        if compaign.admin != *user.key {
            return Err(ProgramError::IncorrectProgramId);
        }
        if **compaign.to_account_info().lamports.borrow() - rent_balance < amount {
            return Err(ProgramError::InsufficientFunds);
        }

        **compaign.to_account_info().try_borrow_mut_lamports()? -= amount;
        **user.to_account_info().try_borrow_mut_lamports()? += amount;
        Ok(())
    }
    pub fn donate(ctx: Context<Donate>, amount: u64) -> ProgramResult {
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.user.key(),
            &ctx.accounts.compaign.key(),
            amount,
        );

        anchor_lang::solana_program::program::invoke(
            &ix, 
            &[ctx.accounts.user.to_account_info(), ctx.accounts.compaign.to_account_info()]
        )?;
        (&mut ctx.accounts.compaign).amount_donated += amount;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(init, payer=user, space=9000, seeds=[b"any string", user.key().as_ref()], bump)]
    pub compaign: Account<'info, Compaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info>{
    #[account(mut)]
    pub compaign : Account<'info, Compaign>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Accounts)]
pub struct Donate<'info>{
    #[account(mut)]
    pub compaign : Account<'info, Compaign>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Compaign{
    pub name: String,
    pub description: String,
    pub amount_donated: u64,
    pub admin: Pubkey,
}

