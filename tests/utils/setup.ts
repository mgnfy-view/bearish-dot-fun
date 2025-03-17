import * as anchor from "@coral-xyz/anchor";
import { BearishDotFun } from "../../target/types/bearish_dot_fun";

import { transferSOL, createSplTokenMint, getStablecoin } from "./utils";
import { decimals } from "./constants";

export async function setup() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);

    const owner = (provider.wallet as anchor.Wallet).payer;

    const user1 = anchor.web3.Keypair.generate();
    const user2 = anchor.web3.Keypair.generate();

    const airdropAmount = 100 * anchor.web3.LAMPORTS_PER_SOL;
    await transferSOL(provider, owner, user1.publicKey, airdropAmount);
    await transferSOL(provider, owner, user2.publicKey, airdropAmount);

    const stablecoin = await createSplTokenMint(provider.connection, owner, decimals);

    const amount = 1000 * 10 ** decimals;
    await getStablecoin(provider, stablecoin, owner, user1, amount);
    await getStablecoin(provider, stablecoin, owner, user2, amount);

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
