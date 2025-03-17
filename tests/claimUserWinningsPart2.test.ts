import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import {
    errors,
    sampleGlobalRoundInfo,
    decimals,
    millisecondsPerSecond,
    priceAccounts,
    bps,
} from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let currentRoundIndex: number;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(amount * 3), bearishDotFun);
        await programMethods.deposit(user2, new anchor.BN(amount * 3), bearishDotFun);

        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex =
            (
                await bearishDotFun.account.platformConfig.fetch(
                    pda.getPlatformConfig(bearishDotFun)
                )
            ).globalRoundInfo.round.toNumber() + 1;

        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);
        await programMethods.placeBet(user2, new anchor.BN(amount), false, bearishDotFun);
    });

    it("Allows a user to claim with longs winning", async () => {
        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);

        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const expectedWinnings = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber() - amount * 3, expectedWinnings);
        assert.strictEqual(userInfoAccount.lastWonRound.toNumber(), currentRoundIndex - 1);
        assert.strictEqual(userInfoAccount.timesWon.toNumber(), 1);

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user1.publicKey, currentRoundIndex, bearishDotFun)
        );
        assert.isTrue(userBetAccount.hasClaimedWinnings);
    });

    it("Doesn't allow a user to claim with longs winning and 0 longs", async () => {
        await programMethods.setPriceAccount(owner, priceAccounts.solUsd, bearishDotFun);
        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex++;

        await programMethods.placeBet(user1, new anchor.BN(amount), false, bearishDotFun);

        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        try {
            await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.ineligibleForClaim
            );
        }
    });

    it("Allows a user to claim with longs winning and all longs", async () => {
        await programMethods.setPriceAccount(owner, priceAccounts.solUsd, bearishDotFun);
        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex++;

        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);
        await programMethods.placeBet(user2, new anchor.BN(amount), true, bearishDotFun);

        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);
        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber() - userBalanceBefore, 0);
        assert.strictEqual(userInfoAccount.lastWonRound.toNumber(), currentRoundIndex - 1);
        assert.strictEqual(userInfoAccount.timesWon.toNumber(), 1);
    });
});
