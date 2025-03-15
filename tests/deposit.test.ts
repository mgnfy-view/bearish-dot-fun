import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { bumpRangeInclusive, errors, sampleGlobalRoundInfo } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const amount = 100 * anchor.web3.LAMPORTS_PER_SOL;

    before(async () => {
        ({ provider, owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(owner, stablecoin, sampleGlobalRoundInfo, bearishDotFun);
    });

    it("Allows a user to deposit tokens", async () => {
        const user1AssociatedTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            provider.connection,
            user1,
            stablecoin,
            user1.publicKey
        );
        await spl.mintTo(
            provider.connection,
            user1,
            stablecoin,
            user1AssociatedTokenAccount.address,
            owner,
            amount
        );

        await programMethods.deposit(user1, stablecoin, new anchor.BN(amount), bearishDotFun);

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccount.address)
        ).amount;
        assert.equal(Number(user1BalanceAfter), 0);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.equal(Number(platformVaultBalanceAfter), amount);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(userInfoAccount.amount.toNumber(), amount);
        assert.equal(
            userInfoAccount.affiliate.toString(),
            anchor.web3.PublicKey.default.toString()
        );
        assert.equal(userInfoAccount.lastWonRound.toNumber(), 0);
        assert.equal(userInfoAccount.timesWon.toNumber(), 0);
        assert(
            userInfoAccount.bump >= bumpRangeInclusive[0] &&
                userInfoAccount.bump <= bumpRangeInclusive[1]
        );
    });

    it("Allows a user to deposit tokens multiple times", async () => {
        const user1AssociatedTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            provider.connection,
            user1,
            stablecoin,
            user1.publicKey
        );

        await spl.mintTo(
            provider.connection,
            user1,
            stablecoin,
            user1AssociatedTokenAccount.address,
            owner,
            amount
        );

        await programMethods.deposit(user1, stablecoin, new anchor.BN(amount), bearishDotFun);

        const user1BalanceAfter = (
            await spl.getAccount(provider.connection, user1AssociatedTokenAccount.address)
        ).amount;
        assert.equal(Number(user1BalanceAfter), 0);

        const platformVaultBalanceAfter = (
            await spl.getAccount(provider.connection, pda.getPlatformVault(bearishDotFun))
        ).amount;
        assert.equal(Number(platformVaultBalanceAfter), amount * 2);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(userInfoAccount.amount.toNumber(), amount * 2);
        assert(
            userInfoAccount.bump >= bumpRangeInclusive[0] &&
                userInfoAccount.bump <= bumpRangeInclusive[1]
        );
    });

    it("Doesn't allow a user to deposit 0 tokens", async () => {
        const amount = 0;

        try {
            await programMethods.deposit(user1, stablecoin, new anchor.BN(amount), bearishDotFun);
        } catch (error) {
            assert.equal(
                (error as anchor.AnchorError).error.errorMessage,
                errors.depositAmountZero
            );
        }
    });
});
