import * as anchor from "@coral-xyz/anchor";
import { BearishDotFun } from "../../target/types/bearish_dot_fun";

import { transfer } from "./utils";

export function setup() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const owner = (provider.wallet as anchor.Wallet).payer;

    const user1 = anchor.web3.Keypair.generate();
    const user2 = anchor.web3.Keypair.generate();

    const airdropAmount = 100 * anchor.web3.LAMPORTS_PER_SOL;
    transfer(provider, owner, user1.publicKey, airdropAmount);
    transfer(provider, owner, user2.publicKey, airdropAmount);

    const bearishDotFun = anchor.workspace.BearishDotFun as anchor.Program<BearishDotFun>;

    return {
        provider,
        owner,
        user1,
        user2,
        bearishDotFun,
    };
}
