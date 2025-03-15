import * as anchor from "@coral-xyz/anchor";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { bumpRangeInclusive, sampleGlobalRoundInfo } from "./utils/constants";
import { assert } from "chai";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;

    before(async () => {
        ({ owner, stablecoin, bearishDotFun } = await setup());
    });

    it("Can be initialized correctly", async () => {
        await programMethods.initialize(owner, stablecoin, sampleGlobalRoundInfo, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.equal(platformConfigAccount.owner.toString(), owner.publicKey.toString());
        assert.equal(platformConfigAccount.stablecoin.toString(), stablecoin.toString());
        assert.equal(
            platformConfigAccount.globalRoundInfo.round.toNumber(),
            sampleGlobalRoundInfo.round.toNumber()
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.duration.toNumber(),
            sampleGlobalRoundInfo.duration.toNumber()
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.allocation.winnersShare,
            sampleGlobalRoundInfo.allocation.winnersShare
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.allocation.affiliateShare,
            sampleGlobalRoundInfo.allocation.affiliateShare
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.allocation.jackpotShare,
            sampleGlobalRoundInfo.allocation.jackpotShare
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.allocation.platformShare,
            sampleGlobalRoundInfo.allocation.platformShare
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotAllocation.streak5,
            sampleGlobalRoundInfo.jackpotAllocation.streak5
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotAllocation.streak6,
            sampleGlobalRoundInfo.jackpotAllocation.streak6
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotAllocation.streak7,
            sampleGlobalRoundInfo.jackpotAllocation.streak7
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotAllocation.streak8,
            sampleGlobalRoundInfo.jackpotAllocation.streak8
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotAllocation.streak9,
            sampleGlobalRoundInfo.jackpotAllocation.streak9
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotAllocation.streak10,
            sampleGlobalRoundInfo.jackpotAllocation.streak10
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.minBetAmount.toNumber(),
            sampleGlobalRoundInfo.minBetAmount.toNumber()
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.priceAccount.toString(),
            sampleGlobalRoundInfo.priceAccount.toString()
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.stalenessThreshold.toNumber(),
            sampleGlobalRoundInfo.stalenessThreshold.toNumber()
        );
        assert.equal(
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber(),
            sampleGlobalRoundInfo.jackpotPoolAmount.toNumber()
        );
        assert.equal(
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
                sampleGlobalRoundInfo,
                bearishDotFun
            );
        } catch {}
    });
});
