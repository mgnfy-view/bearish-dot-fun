import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import { errors, sampleGlobalRoundInfo, millisecondsPerSecond } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;

    before(async () => {
        ({ owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.startRound(user1, bearishDotFun);
    });

    it("Doesn't allow anyone to end a round before the round duration ends", async () => {
        try {
            await programMethods.endRound(user1, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.roundHasNotEndedYet
            );
        }
    });

    it("Allows ending a round with no bets placed", async () => {
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        const roundIndex = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.round.toNumber();
        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(roundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), 0);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber(),
            0
        );
        assert.strictEqual(platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber(), 0);
    });

    it("Doesn't allow ending the same round again", async () => {
        try {
            await programMethods.endRound(user1, bearishDotFun);
        } catch {}
    });
});
