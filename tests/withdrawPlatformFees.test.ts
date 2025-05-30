import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { User } from "./utils/types";
import { pda, programMethods, runRound } from "./utils/utils";
import { setup } from "./utils/setup";
import { sampleGlobalRoundInfo, decimals, bps } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let provider: anchor.AnchorProvider,
        owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    const amount = 100 * 10 ** decimals;
    const depositAmount = amount * 3;

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

        await runRound(owner, userData, true, bearishDotFun);

        const expectedAccumulatedPlatformFees =
            (amount * sampleGlobalRoundInfo.allocation.platformShare) / bps;
        const platformConfigAccount = await bearishDotFun.account.platformConfig.fetch(
            pda.getPlatformConfig(bearishDotFun)
        );
        assert.strictEqual(
            platformConfigAccount.globalRoundInfo.accumulatedPlatformFees.toNumber(),
            expectedAccumulatedPlatformFees
        );

        const ownerBalanceBefore = (
            await spl.getOrCreateAssociatedTokenAccount(
                provider.connection,
                owner,
                stablecoin,
                owner.publicKey
            )
        ).amount;

        await programMethods.withdrawPlatformFees(owner, bearishDotFun);

        const ownerBalanceAfter = (
            await spl.getOrCreateAssociatedTokenAccount(
                provider.connection,
                owner,
                stablecoin,
                owner.publicKey
            )
        ).amount;
        assert.strictEqual(
            Number(ownerBalanceAfter) - Number(ownerBalanceBefore),
            expectedAccumulatedPlatformFees
        );
    });
});
