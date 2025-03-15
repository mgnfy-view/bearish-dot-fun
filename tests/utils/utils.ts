import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Connection, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { BearishDotFun } from "../../target/types/bearish_dot_fun";

import { GlobalRoundInfo } from "./types";
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

const pda = {
    getPlatformConfig(program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(seeds.platformConfig)],
            program.programId
        )[0];
    },
    getUserInfo(user: anchor.web3.PublicKey, program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(seeds.user), user.toBuffer()],
            program.programId
        )[0];
    },
};

const programMethods = {
    async initialize(
        owner: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        globalRoundInfo: GlobalRoundInfo,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .initialize(globalRoundInfo)
            .accounts({
                owner: owner.publicKey,
                stablecoin: stablecoin,
                tokenProgram: spl.TOKEN_PROGRAM_ID,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async setAffiliate(
        user: anchor.web3.Keypair,
        affiliate: anchor.web3.PublicKey,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setAffiliate(affiliate)
            .accounts({
                user: user.publicKey,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
    async deposit(
        user: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        amount: anchor.BN,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .deposit(amount)
            .accounts({
                user: user.publicKey,
                stablecoin,
                userTokenAccount: await spl.getAssociatedTokenAddress(stablecoin, user.publicKey),
                tokenProgram: spl.TOKEN_PROGRAM_ID,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
    async withdraw(
        user: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        amount: anchor.BN,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .withdraw(amount)
            .accounts({
                user: user.publicKey,
                stablecoin,
                userTokenAccount: await spl.getAssociatedTokenAddress(stablecoin, user.publicKey),
                tokenProgram: spl.TOKEN_PROGRAM_ID,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
};

export { createSplTokenMint, transfer, pda, programMethods };
