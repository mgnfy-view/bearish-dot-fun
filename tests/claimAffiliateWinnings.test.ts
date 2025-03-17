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
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let currentRoundIndex: number;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ provider, owner, user1, user2, stablecoin, bearishDotFun } = await setup());

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

        await programMethods.setAffiliate(user1, owner.publicKey, bearishDotFun);
        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);
        await programMethods.placeBet(user2, new anchor.BN(amount), false, bearishDotFun);
    });

    it("Allows an affiliate to claim winnings", async () => {
        await programMethods.setPriceAccount(owner, priceAccounts.btcUsd, bearishDotFun);

        await sleep(sampleGlobalRoundInfo.duration.toNumber() * millisecondsPerSecond);
        await programMethods.endRound(user1, bearishDotFun);

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
});
