import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, runRound } from "./utils/utils";
import { setup } from "./utils/setup";
import { errors, sampleGlobalRoundInfo, decimals, bps } from "./utils/constants";
import { User } from "./utils/types";

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

    it("Allows a user to claim with longs winning", async () => {
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

        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

        const expectedWinnings = (amount * sampleGlobalRoundInfo.allocation.winnersShare) / bps;
        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber() - depositAmount, expectedWinnings);
        assert.strictEqual(userInfoAccount.lastWonRound.toNumber(), currentRoundIndex);
        assert.strictEqual(userInfoAccount.timesWon.toNumber(), 1);

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user1.publicKey, currentRoundIndex, bearishDotFun)
        );
        assert.isTrue(userBetAccount.hasClaimedWinnings);
    });

    it("Doesn't allow a user to claim with longs winning and 0 longs", async () => {
        const userData: User[] = [
            {
                keypair: user1,
                amount: new anchor.BN(amount),
                isLong: false,
                claimWinnings: false,
            },
        ];

        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

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
        const userBalanceBefore = (
            await bearishDotFun.account.userInfo.fetch(
                pda.getUserInfo(user1.publicKey, bearishDotFun)
            )
        ).amount.toNumber();

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
                isLong: true,
                claimWinnings: true,
            },
        ];

        const currentRoundIndex = await runRound(owner, userData, true, bearishDotFun);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.strictEqual(userInfoAccount.amount.toNumber() - userBalanceBefore, 0);
        assert.strictEqual(userInfoAccount.lastWonRound.toNumber(), currentRoundIndex);
        assert.strictEqual(userInfoAccount.timesWon.toNumber(), 1);
    });
});
