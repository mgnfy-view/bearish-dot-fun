import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { bumpRangeInclusive, decimals, errors, sampleGlobalRoundInfo } from "./utils/constants";

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

        user1AssociatedTokenAccountAddress = await spl.getAssociatedTokenAddress(
            stablecoin,
            user1.publicKey
        );
    });

    it("Allows a user to deposit tokens", async () => {
        const user1BalanceBefore = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;

        await programMethods.deposit(user1, new anchor.BN(amount), bearishDotFun);

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;
        assert.strictEqual(Number(user1BalanceBefore) - Number(user1BalanceAfter), amount);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.strictEqual(Number(platformVaultBalanceAfter), amount);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), amount);
        assert.deepStrictEqual(userInfoAccount.affiliate, anchor.web3.PublicKey.default);
        assert.strictEqual(userInfoAccount.lastWonRound.toNumber(), 0);
        assert.strictEqual(userInfoAccount.timesWon.toNumber(), 0);
        assert(
            userInfoAccount.bump >= bumpRangeInclusive[0] &&
                userInfoAccount.bump <= bumpRangeInclusive[1]
        );
    });

    it("Allows a user to deposit tokens multiple times", async () => {
        const user1BalanceBefore = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;

        await programMethods.deposit(user1, new anchor.BN(amount), bearishDotFun);

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccountAddress)
        ).amount;
        assert.strictEqual(Number(user1BalanceBefore) - Number(user1BalanceAfter), amount);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.strictEqual(Number(platformVaultBalanceAfter), amount * 2);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), amount * 2);
        assert(
            userInfoAccount.bump >= bumpRangeInclusive[0] &&
                userInfoAccount.bump <= bumpRangeInclusive[1]
        );
    });

    it("Doesn't allow a user to deposit 0 tokens", async () => {
        const amount = 0;

        try {
            await programMethods.deposit(user1, new anchor.BN(amount), bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.depositAmountZero
            );
        }
    });
});
