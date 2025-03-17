import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { decimals, errors, sampleGlobalRoundInfo } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let user1AssociatedTokenAccountAddress: anchor.web3.PublicKey;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ provider, owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(amount * 2), bearishDotFun);

        user1AssociatedTokenAccountAddress = await spl.getAssociatedTokenAddress(
            stablecoin,
            user1.publicKey
        );
    });

    it("Allows a user to withdraw deposited tokens", async () => {
        const withdrawAmount = amount;

        const user1BalanceBefore = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;

        await programMethods.withdraw(user1, new anchor.BN(withdrawAmount), bearishDotFun);

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;
        assert.strictEqual(Number(user1BalanceAfter) - Number(user1BalanceBefore), withdrawAmount);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.strictEqual(Number(platformVaultBalanceAfter), amount * 2 - withdrawAmount);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), amount * 2 - withdrawAmount);
    });

    it("Allows a user to withdraw deposited tokens multiple times as long as they have sufficient balance", async () => {
        const withdrawAmount = amount;

        const user1BalanceBefore = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;

        await programMethods.withdraw(user1, new anchor.BN(withdrawAmount), bearishDotFun);

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;
        assert.strictEqual(Number(user1BalanceAfter) - Number(user1BalanceBefore), withdrawAmount);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.strictEqual(Number(platformVaultBalanceAfter), 0);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), 0);
    });

    it("Does not allow a user to withdraw 0 tokens", async () => {
        try {
            await programMethods.withdraw(user1, new anchor.BN(new anchor.BN(0)), bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.withdrawAmountZero
            );
        }
    });

    it("Does not allow a user to withdraw more than deposited tokens", async () => {
        const withdrawAmount = amount * 2;

        try {
            await programMethods.withdraw(user1, new anchor.BN(withdrawAmount), bearishDotFun);
        } catch {}
    });
});
