import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { bumpRangeInclusive, errors, sampleGlobalRoundInfo } from "./utils/constants";

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
            sampleGlobalRoundInfo,
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );
    });

    it("Allows anyone to start a round", async () => {
        const roundIndex = 1;

        await programMethods.startRound(user1, roundIndex, bearishDotFun);

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
        const roundIndex = 1;

        try {
            await programMethods.startRound(user1, roundIndex, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.roundAlreadyStarted
            );
        }
    });
});
