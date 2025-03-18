import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods, runRound, sleep } from "./utils/utils";
import { setup } from "./utils/setup";
import {
    errors,
    sampleGlobalRoundInfo,
    decimals,
    millisecondsPerSecond,
    bps,
} from "./utils/constants";
import { User } from "./utils/types";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const amount = 100 * 10 ** decimals;
    const depositAmount = amount * 4;

    before(async () => {
        ({ provider, owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(depositAmount), bearishDotFun);
        await programMethods.deposit(user2, new anchor.BN(depositAmount), bearishDotFun);

        await programMethods.setAffiliate(user1, owner.publicKey, bearishDotFun);
    });

    it("Allows an affiliate to claim winnings", async () => {
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

        await programMethods.claimAffiliateWinnings(
            owner,
            user1.publicKey,
            currentRoundIndex - 1,
            bearishDotFun
        );

        const expectedWinnings = (amount * sampleGlobalRoundInfo.allocation.affiliateShare) / bps;
        const affiliateBalance = (
            await spl.getOrCreateAssociatedTokenAccount(
                provider.connection,
                owner,
                stablecoin,
                owner.publicKey
            )
        ).amount;
        assert.strictEqual(Number(affiliateBalance), expectedWinnings);

        const userBetAccount = await bearishDotFun.account.bet.fetch(
            pda.getUserBet(user1.publicKey, currentRoundIndex, bearishDotFun)
        );
        assert.isTrue(userBetAccount.hasAffiliateClaimedWinnings);
    });

    it("Doesn't allow an affiliate to claim winnings twice", async () => {
        const currentRoundIndex = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.round.toNumber();

        try {
            await programMethods.claimAffiliateWinnings(
                owner,
                user1.publicKey,
                currentRoundIndex - 1,
                bearishDotFun
            );
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.alreadyClaimedWinnings
            );
        }
    });

    it("Doesn't allow an affiliate to claim winnings for a losing user (ending price is the same as starting price)", async () => {
        await programMethods.startRound(user1, bearishDotFun);
        const currentRoundIndex =
            (
                await bearishDotFun.account.platformConfig.fetch(
                    pda.getPlatformConfig(bearishDotFun)
                )
            ).globalRoundInfo.round.toNumber() + 1;

        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);
        await programMethods.placeBet(user2, new anchor.BN(amount), false, bearishDotFun);

        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

        try {
            await programMethods.claimAffiliateWinnings(
                owner,
                user1.publicKey,
                currentRoundIndex - 1,
                bearishDotFun
            );
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.ineligibleForClaim
            );
        }
    });

    it("Doesn't allow an affiliate to claim winnings for a losing user (the other side winning)", async () => {
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

        const currentRoundIndex = await runRound(owner, userData, false, bearishDotFun);

        try {
            await programMethods.claimAffiliateWinnings(
                owner,
                user1.publicKey,
                currentRoundIndex - 1,
                bearishDotFun
            );
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.ineligibleForClaim
            );
        }
    });

    it("Doesn't allow an affiliate to claim winnings when affiliate is not set", async () => {
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

        try {
            await programMethods.claimAffiliateWinnings(
                owner,
                user2.publicKey,
                currentRoundIndex - 1,
                bearishDotFun
            );
        } catch {}
    });
});
