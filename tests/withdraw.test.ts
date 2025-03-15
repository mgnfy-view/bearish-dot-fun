import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { errors, sampleGlobalRoundInfo } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let user1AssociatedTokenAccount: anchor.web3.PublicKey;
    const amount = 100 * anchor.web3.LAMPORTS_PER_SOL;

    before(async () => {
        ({ provider, owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(owner, stablecoin, sampleGlobalRoundInfo, bearishDotFun);

        user1AssociatedTokenAccount = (
            await spl.getOrCreateAssociatedTokenAccount(
                provider.connection,
                user1,
                stablecoin,
                user1.publicKey
            )
        ).address;

        await spl.mintTo(
            provider.connection,
            user1,
            stablecoin,
            user1AssociatedTokenAccount,
            owner,
            amount
        );
        await programMethods.deposit(user1, stablecoin, new anchor.BN(amount), bearishDotFun);
    });

    it("Allows a user to withdraw deposited tokens", async () => {
        const withdrawAmount = amount / 2;

        await programMethods.withdraw(
            user1,
            stablecoin,
            new anchor.BN(withdrawAmount),
            bearishDotFun
        );

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccount)
        ).amount;
        assert.equal(Number(user1BalanceAfter), withdrawAmount);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.equal(Number(platformVaultBalanceAfter), amount - withdrawAmount);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(userInfoAccount.amount.toNumber(), amount - withdrawAmount);
    });

    it("Allows a user to withdraw deposited tokens multiple times as long as they have sufficient balance", async () => {
        const withdrawAmount = amount / 2;

        await programMethods.withdraw(
            user1,
            stablecoin,
            new anchor.BN(withdrawAmount),
            bearishDotFun
        );

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccount)
        ).amount;
        assert.equal(Number(user1BalanceAfter), amount);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.equal(Number(platformVaultBalanceAfter), 0);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(userInfoAccount.amount.toNumber(), 0);
    });

    it("Does not allow a user to withdraw 0 tokens", async () => {
        try {
            await programMethods.withdraw(
                user1,
                stablecoin,
                new anchor.BN(new anchor.BN(0)),
                bearishDotFun
            );
        } catch (error) {
            assert.equal(
                (error as anchor.AnchorError).error.errorMessage,
                errors.withdrawAmountZero
            );
        }
    });

    it("Does not allow a user to withdraw more than deposited tokens", async () => {
        const withdrawAmount = amount * 2;

        try {
            await programMethods.withdraw(
                user1,
                stablecoin,
                new anchor.BN(withdrawAmount),
                bearishDotFun
            );
        } catch {}
    });
});
