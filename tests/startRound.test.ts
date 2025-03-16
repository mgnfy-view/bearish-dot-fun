import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import {
    bumpRangeInclusive,
    errors,
    millisecondsPerSecond,
    sampleGlobalRoundInfo,
} from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const roundIndex = 1;

    before(async () => {
        ({ owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            sampleGlobalRoundInfo,
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );
    });

    it("Allows anyone to start a round", async () => {
        await programMethods.startRound(user1, roundIndex, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(platformConfigAccount.globalRoundInfo.round.toNumber(), roundIndex - 1);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(roundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.startTime.toNumber(), 0);
        assert.isAbove(roundAccount.startingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), 0);
        assert(
            roundAccount.bump >= bumpRangeInclusive[0] && roundAccount.bump <= bumpRangeInclusive[1]
        );
    });

    it("Doesn't allow anyone to start the same round twice", async () => {
        try {
            await programMethods.startRound(user1, roundIndex, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.roundAlreadyStarted
            );
        }
    });

    it("Allows anyone to start the next round once the current round ends", async () => {
        const nextRoundIndex = 2;

        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, roundIndex, bearishDotFun);

        await programMethods.startRound(user1, nextRoundIndex, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.round.toNumber(),
            nextRoundIndex - 1
        );

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(nextRoundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.startTime.toNumber(), 0);
        assert.isAbove(roundAccount.startingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), 0);
        assert(
            roundAccount.bump >= bumpRangeInclusive[0] && roundAccount.bump <= bumpRangeInclusive[1]
        );
    });
});
