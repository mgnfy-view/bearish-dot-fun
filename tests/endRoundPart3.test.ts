import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { getStablecoin, pda, programMethods, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import {
    sampleGlobalRoundInfo,
    millisecondsPerSecond,
    priceAccounts,
    decimals,
    bps,
} from "./utils/constants";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const roundIndex = 1;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ provider, owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            sampleGlobalRoundInfo,
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await getStablecoin(provider, stablecoin, owner, user1, amount);
        await programMethods.deposit(
            user1,
            stablecoin,
            new anchor.BN(amount),
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await getStablecoin(provider, stablecoin, owner, user2, amount);
        await programMethods.deposit(
            user2,
            stablecoin,
            new anchor.BN(amount),
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);
        await programMethods.startRound(user1, roundIndex, bearishDotFun);
    });

    it("Allows ending a round with shorts winning", async () => {
        await programMethods.placeBet(
            user1,
            new anchor.BN(amount),
            true,
            roundIndex,
            bearishDotFun
        );
        await programMethods.placeBet(
            user2,
            new anchor.BN(amount),
            false,
            roundIndex,
            bearishDotFun
        );

        // Changing the price account to SOL/USD price account so that shorts can win
        // since the price of SOL is way below BTC
        await programMethods.setPriceAccount(owner, priceAccounts.solUsd, bearishDotFun);
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);

        await programMethods.endRound(user1, roundIndex, bearishDotFun);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(roundIndex, bearishDotFun)
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

    it("Allows ending a round with shorts winning and 0 shorts", async () => {
        const nextRoundIndex = 2;

        await getStablecoin(provider, stablecoin, owner, user1, amount);
        await programMethods.deposit(
            user1,
            stablecoin,
            new anchor.BN(amount),
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);
        await programMethods.startRound(user1, nextRoundIndex, bearishDotFun);

        await programMethods.placeBet(
            user1,
            new anchor.BN(amount),
            true,
            nextRoundIndex,
            bearishDotFun
        );

        await programMethods.setPriceAccount(owner, priceAccounts.solUsd, bearishDotFun);
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);

        let platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        const accumulatedPlatformFeesBefore =
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber();
        const jackpotPoolAmountBefore =
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber();

        await programMethods.endRound(user1, nextRoundIndex, bearishDotFun);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(nextRoundIndex, bearishDotFun)
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

    it("Allows ending a round with shorts winning and all bets on short", async () => {
        const nextRoundIndex = 3;

        await getStablecoin(provider, stablecoin, owner, user1, amount);
        await programMethods.deposit(
            user1,
            stablecoin,
            new anchor.BN(amount),
            spl.TOKEN_PROGRAM_ID,
            bearishDotFun
        );

        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);
        await programMethods.startRound(user1, nextRoundIndex, bearishDotFun);

        await programMethods.placeBet(
            user1,
            new anchor.BN(amount),
            false,
            nextRoundIndex,
            bearishDotFun
        );

        await programMethods.setPriceAccount(owner, priceAccounts.solUsd, bearishDotFun);
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);

        let platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        const accumulatedPlatformFeesBefore =
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber();
        const jackpotPoolAmountBefore =
            platformConfigAccount.globalRoundInfo.jackpotPoolAmount.toNumber();

        await programMethods.endRound(user1, nextRoundIndex, bearishDotFun);

        const roundAccount = await bearishDotFun.account.round.fetch(
            pda.getRound(nextRoundIndex, bearishDotFun)
        );
        assert.isAbove(roundAccount.endingPrice.toNumber(), 0);
        assert.strictEqual(roundAccount.longPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.shortPositions.toNumber(), 1);
        assert.strictEqual(roundAccount.affiliatesForLongPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.affiliatesForShortPositions.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountLong.toNumber(), 0);
        assert.strictEqual(roundAccount.totalBetAmountShort.toNumber(), amount);

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
