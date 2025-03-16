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

        await programMethods.startRound(user1, roundIndex, bearishDotFun);
    });

    it("Doesn't allow anyone to end a round before the round duration", async () => {
        try {
            await programMethods.endRound(user1, roundIndex, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.roundHasNotEndedYet
            );
        }
    });

    it("Allows ending a round with no bets placed", async () => {
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);

        await programMethods.endRound(user1, roundIndex, bearishDotFun);

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
    });

    it("Doesn't allow ending the same round again", async () => {
        try {
            await programMethods.endRound(user1, roundIndex, bearishDotFun);
        } catch {}
    });
});
