import * as anchor from "@coral-xyz/anchor";
import { assert } from "chai";
import { BearishDotFun } from "../target/types/bearish_dot_fun";

import { pda, programMethods } from "./utils/utils";
import { setup } from "./utils/setup";
import { bumpRangeInclusive, errors, sampleGlobalRoundInfo } from "./utils/constants";

describe("bearish-dot-fun", () => {
    let owner: anchor.web3.Keypair,
        user1: anchor.web3.Keypair,
        user2: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        bearishDotFun: anchor.Program<BearishDotFun>;

    before(async () => {
        ({ owner, user1, user2, stablecoin, bearishDotFun } = await setup());

        await programMethods.initialize(owner, stablecoin, sampleGlobalRoundInfo, bearishDotFun);
    });

    it("Allows a user to set an affiliate", async () => {
        await programMethods.setAffiliate(user1, user2.publicKey, bearishDotFun);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(userInfoAccount.amount.toNumber(), 0);
        assert.equal(userInfoAccount.affiliate.toString(), user2.publicKey.toString());
        assert.equal(userInfoAccount.lastWonRound.toNumber(), 0);
        assert.equal(userInfoAccount.timesWon.toNumber(), 0);
        assert.equal(userInfoAccount.amount.toNumber(), 0);
        assert(
            userInfoAccount.bump >= bumpRangeInclusive[0] &&
                userInfoAccount.bump <= bumpRangeInclusive[1]
        );
    });

    it("Allows a user to change their affiliate", async () => {
        const newAffiliate = anchor.web3.Keypair.generate().publicKey;
        await programMethods.setAffiliate(user1, newAffiliate, bearishDotFun);

        const userAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(userAccount.affiliate.toString(), newAffiliate.toString());
    });

    it("Allows a user to remove an affiliate by setting default pubkey as their affiliate", async () => {
        await programMethods.setAffiliate(user1, anchor.web3.PublicKey.default, bearishDotFun);

        const userInfoAccount = await bearishDotFun.account.userInfo.fetch(
            pda.getUserInfo(user1.publicKey, bearishDotFun)
        );
        assert.equal(
            userInfoAccount.affiliate.toString(),
            anchor.web3.PublicKey.default.toString()
        );
    });

    it("Doesn't allow a user to set themselves as affiliate", async () => {
        try {
            await programMethods.setAffiliate(user1, user1.publicKey, bearishDotFun);
        } catch (error) {
            assert.equal((error as anchor.AnchorError).error.errorMessage, errors.invalidAffiliate);
        }
    });
});
