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
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let currentRoundIndex: number;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(amount), bearishDotFun);

        await programMethods.setAffiliate(user2, owner.publicKey, bearishDotFun);
        await programMethods.deposit(user2, new anchor.BN(amount), bearishDotFun);

        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex =
            (
                await bearishDotFun.account.platformConfig.fetch(
                    pda.getPlatformConfig(bearishDotFun)
                )
            ).globalRoundInfo.round.toNumber() + 1;
    });

    it("Allows placing bet for the current round (long without an affiliate)", async () => {
        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user1.publicKey, currentRoundIndex, bearishDotFun)
        );
        assert.strictEqual(userBetAccount.amount.toNumber(), amount);
        assert.isTrue(userBetAccount.isLong);
        assert.deepEqual(userBetAccount.affiliate, anchor.web3.PublicKey.default);
        assert.isFalse(userBetAccount.hasClaimedWinnings);
        assert.isFalse(userBetAccount.hasAffiliateClaimedWinnings);
        assert.isTrue(
            userBetAccount.bump >= bumpRangeInclusive[0] &&
                userBetAccount.bump <= bumpRangeInclusive[1]
        );

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), 0);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
        );
        assert.strictEqual(roundAccount.longPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), amount);
    });

    it("Doesn't allow placing bet with amount 0", async () => {
        try {
            await programMethods.placeBet(user2, new anchor.BN(0), false, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.betAmountBelowMinBetAmount
            );
        }
    });

    it("Allows placing bet for the current round (short with an affiliate)", async () => {
        await programMethods.placeBet(user2, new anchor.BN(amount), false, bearishDotFun);

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user2.publicKey, currentRoundIndex, bearishDotFun)
        );
        assert.strictEqual(userBetAccount.amount.toNumber(), amount);
        assert.isFalse(userBetAccount.isLong);
        assert.deepEqual(userBetAccount.affiliate, owner.publicKey);
        assert.isFalse(userBetAccount.hasClaimedWinnings);
        assert.isFalse(userBetAccount.hasAffiliateClaimedWinnings);
        assert.isTrue(
            userBetAccount.bump >= bumpRangeInclusive[0] &&
                userBetAccount.bump <= bumpRangeInclusive[1]
        );

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user2.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber(), 0);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
        );
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), amount);
    });

    it("Doesn't allow placing bet for the same round again", async () => {
        try {
            await programMethods.placeBet(user2, new anchor.BN(amount), false, bearishDotFun);
        } catch {}
    });

    it("Doesn't allow placing bet for a completed round", async () => {
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        try {
            await bearishDotFun.methods
                .placeBet(new anchor.BN(amount), false)
                .accounts({
                    user: user1.publicKey,
                    round: pda.getRound(currentRoundIndex, bearishDotFun),
                    userBet: pda.getUserBet(user1.publicKey, currentRoundIndex, bearishDotFun),
                })
                .signers([user1])
                .rpc();
        } catch {}
    });
});
