import * as anchor from "@coral-xyz/anchor";
import { BearishDotFun } from "../../target/types/bearish_dot_fun";

import { transfer, createSplTokenMint } from "./utils";
import { decimals } from "./constants";

export async function setup() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const owner = (provider.wallet as anchor.Wallet).payer;

    const user1 = anchor.web3.Keypair.generate();
    const user2 = anchor.web3.Keypair.generate();

    const airdropAmount = 100 * anchor.web3.LAMPORTS_PER_SOL;
    await transfer(provider, owner, user1.publicKey, airdropAmount);
    await transfer(provider, owner, user2.publicKey, airdropAmount);

    const stablecoin = await createSplTokenMint(provider.connection, owner, decimals);

    const bearishDotFun = anchor.workspace.BearishDotFun as anchor.Program<BearishDotFun>;

    return {
        provider,
        owner,
        user1,
        user2,
        stablecoin,
        bearishDotFun,
    };
}
