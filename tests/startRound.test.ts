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
    let currentRoundIndex: number;

    before(async () => {
        ({ owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );
    });

    it("Allows anyone to start a round", async () => {
        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex =
            (
                await bearishDotFun.account.platformConfig.fetch(
                    pda.getPlatformConfig(bearishDotFun)
                )
            ).globalRoundInfo.round.toNumber() + 1;

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.round.toNumber(),
            currentRoundIndex - 1
        );

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
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
            await programMethods.startRound(user1, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.roundAlreadyStarted
            );
        }
    });

    it("Allows anyone to start the next round once the current round ends", async () => {
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex++;

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.round.toNumber(),
            currentRoundIndex - 1
        );

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
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
        assert.isTrue(
            roundAccount.bump >= bumpRangeInclusive[0] && roundAccount.bump <= bumpRangeInclusive[1]
        );
    });
});
