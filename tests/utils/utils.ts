import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Connection, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { BearishDotFun } from "../../target/types/bearish_dot_fun";

import { seeds } from "./constants";

async function createSplTokenMint(
    connection: Connection,
    owner: anchor.web3.Keypair,
    decimals: number
) {
    return await spl.createMint(connection, owner, owner.publicKey, owner.publicKey, decimals);
}

async function transfer(
    provider: anchor.AnchorProvider,
    from: anchor.web3.Keypair,
    to: anchor.web3.PublicKey,
    amount: number
) {
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to,
            lamports: amount,
        })
    );
    await sendAndConfirmTransaction(provider.connection, transaction, [from]);
}

const pda = {};

const programMethods = {
    async initialize(
        owner: anchor.web3.Keypair,
        feeRecipient: anchor.web3.PublicKey,
        program: anchor.Program<BearishDotFun>
    ) {},
};

export { createSplTokenMint, transfer, pda, programMethods };
