import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { errors, sampleGlobalRoundInfo, decimals } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;
    let currentRoundIndex: number;
    const amount = 100 * 10 ** decimals;

    before(async () => {
        ({ owner, user1, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(
            owner,
            stablecoin,
            spl.TOKEN_PROGRAM_ID,
            sampleGlobalRoundInfo,
            bearishDotFun
        );

        await programMethods.deposit(user1, new anchor.BN(amount), bearishDotFun);

        await programMethods.startRound(user1, bearishDotFun);
        currentRoundIndex = (
            await bearishDotFun.account.platformConfig.fetch(pda.getPlatformConfig(bearishDotFun))
        ).globalRoundInfo.round.toNumber();

        await programMethods.placeBet(user1, new anchor.BN(amount), true, bearishDotFun);
    });

    it("Doesn't allow a user to claim winnings before the round ends", async () => {
        try {
            await programMethods.claimUserWinnings(user1, currentRoundIndex, bearishDotFun);
        } catch (error) {
            assert.strictEqual(
                (error as anchor.AnchorError).error.errorMessage,
                errors.roundHasNotEndedYet
            );
        }
    });
});
