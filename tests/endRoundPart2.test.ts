import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { User } from "./utils/types";
import { pda, programMethods, runRound } from "./utils/utils";
import { setup } from "./utils/setup";
import { sampleGlobalRoundInfo, decimals, bps } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const amount = 100 * 10 ** decimals;
    const depositAmount = amount * 3;

    before(async () => {
        ({ owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(depositAmount), bearishDotFun);
        await programMethods.deposit(user2, new anchor.BN(depositAmount), bearishDotFun);
    });

    it("Allows ending a round with longs winning", async () => {
        const userData: User[] = [
            {
                keypair: user1,
                amount: new anchor.BN(amount),
                isLong: true,
                claimWinnings: false,
            },
            {
                keypair: user2,
                amount: new anchor.BN(amount),
                isLong: false,
                claimWinnings: false,
            },
        ];

        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), amount);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), amount);

        const expectedAccumulatedPlatformFees =
            (amount * sampleGlobalRoundInfo.allocation.platformShare) / bps;
        const expectedJackPotAmount =
            (amount * sampleGlobalRoundInfo.allocation.jackpotShare) / bps;
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

    it("Allows ending a round with longs winning and 0 longs", async () => {
        let platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        const accumulatedPlatformFeesBefore =
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber();
        const jackpotPoolAmountBefore =
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber();

        const userData: User[] = [
            {
                keypair: user1,
                amount: new anchor.BN(amount),
                isLong: false,
                claimWinnings: false,
            },
        ];

        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(currentRoundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), amount);

        const expectedAccumulatedPlatformFees =
            (amount * sampleGlobalRoundInfo.allocation.platformShare) / bps;
        const expectedJackPotAmount =
            (amount *
                (sampleGlobalRoundInfo.allocation.jackpotShare +
                    sampleGlobalRoundInfo.allocation.winnersShare +
                    sampleGlobalRoundInfo.allocation.affiliateShare)) /
            bps;
        platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber() -
                accumulatedPlatformFeesBefore,
            expectedAccumulatedPlatformFees
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber() -
                jackpotPoolAmountBefore,
            expectedJackPotAmount
        );
    });

    it("Allows ending a round with longs winning and all bets on long", async () => {
        let platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        const accumulatedPlatformFeesBefore =
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber();
        const jackpotPoolAmountBefore =
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber();

        const userData: User[] = [
            {
                keypair: user1,
                amount: new anchor.BN(amount),
                isLong: true,
                claimWinnings: false,
            },
        ];

        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

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

        platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber() -
                accumulatedPlatformFeesBefore,
            0
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber() -
                jackpotPoolAmountBefore,
            0
        );
    });
});
