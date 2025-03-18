import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, runRound, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import {
    sampleGlobalRoundInfo,
    decimals,
    millisecondsPerSecond,
    priceAccounts,
    bps,
} from "./utils/constants";
import { User } from "./utils/types";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const amount = 100 * 10 ** decimals;
    const depositAmount = amount * 10;

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

    it("Allows a user to claim jackpot with streak 5", async () => {
        const userData: User[] = [
            {
                keypair: user1,
                amount: new anchor.BN(amount),
                isLong: true,
                claimWinnings: true,
            },
            {
                keypair: user2,
                amount: new anchor.BN(amount),
                isLong: false,
                claimWinnings: false,
            },
        ];

        await runRound(owner, userData, true, bearishDotFun);
        await runRound(owner, userData, true, bearishDotFun);
        await runRound(owner, userData, true, bearishDotFun);
        await runRound(owner, userData, true, bearishDotFun);

        userData[0].claimWinnings = false;
        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

        const jackpotPoolAmount = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.jackpotPoolAmount.toNumber();
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const winnersShare = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userBalanceAfter = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();
        const expectedJackpotWinnings =
            (jackpotPoolAmount * sampleGlobalRoundInfo.jackpotAllocation.streak5) / bps;
        assert.strictEqual(
            userBalanceAfter - userBalanceBefore - amount - winnersShare,
            expectedJackpotWinnings
        );
    });

    it("Allows a user to claim jackpot with streak 6", async () => {
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

        const jackpotPoolAmount = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.jackpotPoolAmount.toNumber();
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const winnersShare = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userBalanceAfter = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();
        const expectedJackpotWinnings =
            (jackpotPoolAmount * sampleGlobalRoundInfo.jackpotAllocation.streak6) / bps;
        assert.strictEqual(
            userBalanceAfter - userBalanceBefore - amount - winnersShare,
            expectedJackpotWinnings
        );
    });

    it("Allows a user to claim jackpot with streak 7", async () => {
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

        const jackpotPoolAmount = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.jackpotPoolAmount.toNumber();
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const winnersShare = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userBalanceAfter = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();
        const expectedJackpotWinnings =
            (jackpotPoolAmount * sampleGlobalRoundInfo.jackpotAllocation.streak7) / bps;
        assert.strictEqual(
            userBalanceAfter - userBalanceBefore - amount - winnersShare,
            expectedJackpotWinnings
        );
    });

    it("Allows a user to claim jackpot with streak 8", async () => {
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

        const jackpotPoolAmount = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.jackpotPoolAmount.toNumber();
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const winnersShare = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userBalanceAfter = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();
        const expectedJackpotWinnings =
            (jackpotPoolAmount * sampleGlobalRoundInfo.jackpotAllocation.streak8) / bps;
        assert.strictEqual(
            userBalanceAfter - userBalanceBefore - amount - winnersShare,
            expectedJackpotWinnings
        );
    });

    it("Allows a user to claim jackpot with streak 9", async () => {
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

        const jackpotPoolAmount = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.jackpotPoolAmount.toNumber();
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const winnersShare = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userBalanceAfter = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();
        const expectedJackpotWinnings =
            (jackpotPoolAmount * sampleGlobalRoundInfo.jackpotAllocation.streak9) / bps;
        assert.strictEqual(
            userBalanceAfter - userBalanceBefore - amount - winnersShare,
            expectedJackpotWinnings
        );
    });

    it("Allows a user to claim jackpot with streak 10", async () => {
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

        const jackpotPoolAmount = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.jackpotPoolAmount.toNumber();
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

        await programMethods.claimUserWinnings(user1, currentRoundIndex - 1, bearishDotFun);

        const winnersShare = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        const userBalanceAfter = userInfoAccount.amount.toNumber();
        const expectedJackpotWinnings =
            (jackpotPoolAmount * sampleGlobalRoundInfo.jackpotAllocation.streak10) / bps;
        assert.strictEqual(
            userBalanceAfter - userBalanceBefore - amount - winnersShare,
            expectedJackpotWinnings
        );
        assert.strictEqual(userInfoAccount.timesWon.toNumber(), 0);
    });
});
