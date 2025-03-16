import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import {
    bumpRangeInclusive,
    errors,
    sampleGlobalRoundInfo,
    millisecondsPerSecond,
    decimals,
} from "./utils/constants";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const roundIndex = 1;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ provider, owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            sampleGlobalRoundInfo,
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

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
        await programMethods.deposit(
            user1,
            stablecoin,
            new anchor.BN(amount),
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await programMethods.setAffiliate(user2, owner.publicKey, bearishDotFun);
        const user2AssociatedTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
            provider.connection,
            user2,
            stablecoin,
            user2.publicKey
        );
        await spl.mintTo(
            provider.connection,
            user2,
            stablecoin,
            user2AssociatedTokenAccount.address,
            owner,
            amount
        );
        await programMethods.deposit(
            user2,
            stablecoin,
            new anchor.BN(amount),
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await programMethods.startRound(user1, roundIndex, bearishDotFun);
    });

    it("Allows placing bet for the current round (long without an affiliate)", async () => {
        await programMethods.placeBet(
            user1,
            new anchor.BN(amount),
            true,
            roundIndex,
            bearishDotFun
        );

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user1.publicKey, roundIndex, bearishDotFun)
        );
        assert.strictEqual(userBetAccount.amount.toNumber(), amount);
        assert.isTrue(userBetAccount.isLong);
        assert.deepEqual(userBetAccount.affiliate, anchor.web3.PublicKey.default);
        assert.isFalse(userBetAccount.hasClaimedWinnings);
        assert.isFalse(userBetAccount.hasAffiliateClaimedWinnings);
        assert(
            userBetAccount.bump >= bumpRangeInclusive[0] &&
                userBetAccount.bump <= bumpRangeInclusive[1]
        );

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), 0);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(roundIndex, bearishDotFun)
        );
        assert.strictEqual(roundAccount.longPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), amount);
    });

    it("Doesn't allow placing bet with amount 0", async () => {
        try {
            await programMethods.placeBet(
                user2,
                new anchor.BN(0),
                false,
                roundIndex,
                bearishDotFun
            );
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.betAmountZero
            );
        }
    });

    it("Allows placing bet for the current round (short with an affiliate)", async () => {
        await programMethods.placeBet(
            user2,
            new anchor.BN(amount),
            false,
            roundIndex,
            bearishDotFun
        );

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user2.publicKey, roundIndex, bearishDotFun)
        );
        assert.strictEqual(userBetAccount.amount.toNumber(), amount);
        assert.isFalse(userBetAccount.isLong);
        assert.deepEqual(userBetAccount.affiliate, owner.publicKey);
        assert.isFalse(userBetAccount.hasClaimedWinnings);
        assert.isFalse(userBetAccount.hasAffiliateClaimedWinnings);
        assert(
            userBetAccount.bump >= bumpRangeInclusive[0] &&
                userBetAccount.bump <= bumpRangeInclusive[1]
        );

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user2.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), 0);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(roundIndex, bearishDotFun)
        );
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), amount);
    });

    it("Doesn't allow placing bet for a completed round", async () => {
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, roundIndex, bearishDotFun);

        try {
            await programMethods.placeBet(
                user2,
                new anchor.BN(amount),
                false,
                roundIndex,
                bearishDotFun
            );
        } catch {}
    });
});
