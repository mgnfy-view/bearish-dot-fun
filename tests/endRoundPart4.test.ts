import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import { sampleGlobalRoundInfo, millisecondsPerSecond, decimals, bps } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let currentRoundIndex: number;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(amount), bearishDotFun);

        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex =
            (
                await bearishDotFun.account.platformConfig.fetch(
                    pda.getPlatformConfig(bearishDotFun)
                )
            ).globalRoundInfo.round.toNumber() + 1;
    });

    it("Allows ending a round with neither shorts nor longs winning", async () => {
        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);

        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), amount);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), 0);

        const expectedAccumulatedPlatformFees =
            (amount * sampleGlobalRoundInfo.allocation.platformShare) / bps;
        const expectedJackPotAmount =
            (amount *
                (sampleGlobalRoundInfo.allocation.jackpotShare +
                    sampleGlobalRoundInfo.allocation.winnersShare +
                    sampleGlobalRoundInfo.allocation.affiliateShare)) /
            bps;
        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber(),
            expectedAccumulatedPlatformFees
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber(),
            expectedJackPotAmount
        );
    });
});
