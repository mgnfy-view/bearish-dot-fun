import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { decimals, errors, priceAccounts, sampleGlobalRoundInfo } from "./utils/constants";
import { Allocation, JackPotAllocation } from "./utils/types";

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
    });

    it("Allows setting duration", async () => {
        const duration = new anchor.BN(1000);

        await programMethods.setDuration(owner, duration, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.duration.toNumber(),
            duration.toNumber()
        );
    });

    it("Fails if duration is 0", async () => {
        try {
            await programMethods.setDuration(owner, new anchor.BN(0), bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.durationZero
            );
        }
    });

    it("Allows setting allocation", async () => {
        const allocation: Allocation = {
            winnersShare: 6000,
            affiliateShare: 500,
            jackpotShare: 3000,
            platformShare: 500,
        };

        await programMethods.setAllocation(owner, allocation, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.deepEqual(platformConfigAccount.globalRoundInfo.allocation, allocation);
    });

    it("Fails if allocation does not add up to 100%", async () => {
        const allocation: Allocation = {
            winnersShare: 6100,
            affiliateShare: 500,
            jackpotShare: 3000,
            platformShare: 500,
        };

        try {
            await programMethods.setAllocation(owner, allocation, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.invalidAllocation
            );
        }
    });

    it("Allows setting jackpot allocation", async () => {
        const jackpotAllocation: JackPotAllocation = {
            streak5: 1000,
            streak6: 1500,
            streak7: 2000,
            streak8: 2500,
            streak9: 3000,
            streak10: 3500,
        };

        await programMethods.setJackPotAllocation(owner, jackpotAllocation, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.deepEqual(
            platformConfigAccount.globalRoundInfo.jackpotAllocation,
            jackpotAllocation
        );
    });

    it("Fails if jackpot allocation percentage doesn't increase over larger streaks", async () => {
        const jackpotAllocation: JackPotAllocation = {
            streak5: 2000,
            streak6: 2000,
            streak7: 2000,
            streak8: 2000,
            streak9: 2000,
            streak10: 0,
        };

        try {
            await programMethods.setJackPotAllocation(owner, jackpotAllocation, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.invalidJackPotAllocation
            );
        }
    });

    it("Fails if a single jackpot allocation percentage is more than bips", async () => {
        const jackpotAllocation: JackPotAllocation = {
            streak5: 10001,
            streak6: 0,
            streak7: 0,
            streak8: 0,
            streak9: 0,
            streak10: 0,
        };

        try {
            await programMethods.setJackPotAllocation(owner, jackpotAllocation, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.exceedsMaxFee
            );
        }
    });

    it("Allows setting minimum amount to be used for betting", async () => {
        const minBetAmount = new anchor.BN(10 * 10 ** decimals);

        await programMethods.setMinBetAmount(owner, minBetAmount, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.minBetAmount.toNumber(),
            minBetAmount.toNumber()
        );
    });

    it("Allows setting price account", async () => {
        const newPriceAccount = priceAccounts.btcUsd;

        await programMethods.setPriceAccount(owner, newPriceAccount, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.deepEqual(platformConfigAccount.globalRoundInfo.priceAccount, newPriceAccount);
    });

    it("Doesn't allow setting deafault pubkey as price account", async () => {
        try {
            await programMethods.setPriceAccount(
                owner,
                anchor.web3.PublicKey.default,
                bearishDotFun
            );
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.priceAccountDefaultPubkey
            );
        }
    });

    it("Allows setting staleness threshold", async () => {
        const stalenessThreshold = new anchor.BN(1000);

        await programMethods.setStalenessThreshold(owner, stalenessThreshold, bearishDotFun);

        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.stalenessThreshold.toNumber(),
            stalenessThreshold.toNumber()
        );
    });

    it("Doesn't allow non-owner to change platform config", async () => {
        const duration = new anchor.BN(1000);

        try {
            await programMethods.setDuration(user1, duration, bearishDotFun);
        } catch {}
    });
});
