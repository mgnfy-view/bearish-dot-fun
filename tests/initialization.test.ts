import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { bumpRangeInclusive, sampleGlobalRoundInfo } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;

    before(async () => {
        ({ owner, stablecoin, bearishDotFun } = await setup());
    });

    it("Can be initialized correctly", async () => {
        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.deepStrictEqual(platformConfigAccount.owner, owner.publicKey);
        assert.deepStrictEqual(platformConfigAccount.stablecoin, stablecoin);
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.round.toNumber(),
            sampleGlobalRoundInfo.round.toNumber()
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.duration.toNumber(),
            sampleGlobalRoundInfo.duration.toNumber()
        );
        assert.deepEqual(
            platformConfigAccount.globalRoundInfo.allocation,
            sampleGlobalRoundInfo.allocation
        );
        assert.deepEqual(
            platformConfigAccount.globalRoundInfo.jackpotAllocation,
            sampleGlobalRoundInfo.jackpotAllocation
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.minBetAmount.toNumber(),
            sampleGlobalRoundInfo.minBetAmount.toNumber()
        );
        assert.deepStrictEqual(
            platformConfigAccount.globalRoundInfo.priceAccount,
            sampleGlobalRoundInfo.priceAccount
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.stalenessThreshold.toNumber(),
            sampleGlobalRoundInfo.stalenessThreshold.toNumber()
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber(),
            sampleGlobalRoundInfo.jackpotPoolAmount.toNumber()
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber(),
            sampleGlobalRoundInfo.accumulatedPlatformFees.toNumber()
        );
        assert(
            platformConfigAccount.bump >= bumpRangeInclusive[0] &&
                platformConfigAccount.bump <= bumpRangeInclusive[1]
        );
        assert(
            platformConfigAccount.platformVaultBump >= bumpRangeInclusive[0] &&
                platformConfigAccount.platformVaultBump <= bumpRangeInclusive[1]
        );
    });

    it("Cannot be initialized again", async () => {
        try {
            await programMethods.initialize(
                owner,
                stablecoin,
                spl.TOKEN_PROGRAM_ID,
                sampleGlobalRoundInfo,
                bearishDotFun
            );
        } catch {}
    });
});
