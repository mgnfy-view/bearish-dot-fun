import * as anchor from "@coral-xyz/anchor";
import * as spl from "@solana/spl-token";
import { Connection, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { BearishDotFun } from "../../target/types/bearish_dot_fun";

import { Allocation, GlobalRoundInfo, JackPotAllocation } from "./types";
import { sampleGlobalRoundInfo, seeds } from "./constants";

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function getStablecoin(
    provider: anchor.AnchorProvider,
    stablecoin: anchor.web3.PublicKey,
    owner: anchor.web3.Keypair,
    user: anchor.web3.Keypair,
    amount: number
) {
    const userAssociatedTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
        provider.connection,
        user,
        stablecoin,
        user.publicKey
    );
    await spl.mintTo(
        provider.connection,
        user,
        stablecoin,
        userAssociatedTokenAccount.address,
        owner,
        amount
    );
}

const pda = {
    getPlatformConfig(program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(seeds.platformConfig)],
            program.programId
        )[0];
    },
    getPlatformVault(program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(seeds.platformVault)],
            program.programId
        )[0];
    },
    getUserInfo(user: anchor.web3.PublicKey, program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(seeds.user), user.toBuffer()],
            program.programId
        )[0];
    },
    getRound(index: number, program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(seeds.round), new anchor.BN(index).toArrayLike(Buffer, "be", 8)],
            program.programId
        )[0];
    },
    getUserBet(user: anchor.web3.PublicKey, index: number, program: anchor.Program<BearishDotFun>) {
        return anchor.web3.PublicKey.findProgramAddressSync(
            [
                Buffer.from(seeds.userBet),
                user.toBuffer(),
                new anchor.BN(index).toArrayLike(Buffer, "be", 8),
            ],
            program.programId
        )[0];
    },
};

const programMethods = {
    async initialize(
        owner: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        globalRoundInfo: GlobalRoundInfo,
        tokenProgramId: anchor.web3.PublicKey,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .initialize(globalRoundInfo)
            .accounts({
                owner: owner.publicKey,
                stablecoin: stablecoin,
                tokenProgram: tokenProgramId,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async transferOwnership(
        owner: anchor.web3.Keypair,
        newOwner: anchor.web3.Keypair,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .transferOwnership()
            .accounts({
                owner: owner.publicKey,
                newOwner: newOwner.publicKey,
            })
            .signers([owner, newOwner])
            .rpc();

        return txSignature;
    },
    async setDuration(
        owner: anchor.web3.Keypair,
        duration: anchor.BN,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setDuration(duration)
            .accounts({
                owner: owner.publicKey,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async setAllocation(
        owner: anchor.web3.Keypair,
        allocation: Allocation,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setAllocation(allocation)
            .accounts({
                owner: owner.publicKey,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async setJackPotAllocation(
        owner: anchor.web3.Keypair,
        jackpotAllocation: JackPotAllocation,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setJackpotAllocation(jackpotAllocation)
            .accounts({
                owner: owner.publicKey,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async setMinBetAmount(
        owner: anchor.web3.Keypair,
        minBetAmount: anchor.BN,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setMinBetAmount(minBetAmount)
            .accounts({
                owner: owner.publicKey,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async setPriceAccount(
        owner: anchor.web3.Keypair,
        priceAccount: anchor.web3.PublicKey,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setPriceAccount(priceAccount)
            .accounts({
                owner: owner.publicKey,
            })
            .signers([owner])
            .rpc();

        return txSignature;
    },
    async setStalenessThreshold(
        owner: anchor.web3.Keypair,
        stalenessThreshold: anchor.BN,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .setStalenessThreshold(stalenessThreshold)
            .accounts({
                owner: owner.publicKey,
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
        tokenProgramId: anchor.web3.PublicKey,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .deposit(amount)
            .accounts({
                user: user.publicKey,
                stablecoin,
                userTokenAccount: await spl.getAssociatedTokenAddress(stablecoin, user.publicKey),
                tokenProgram: tokenProgramId,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
    async withdraw(
        user: anchor.web3.Keypair,
        stablecoin: anchor.web3.PublicKey,
        amount: anchor.BN,
        tokenProgramId: anchor.web3.PublicKey,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .withdraw(amount)
            .accounts({
                user: user.publicKey,
                stablecoin,
                userTokenAccount: await spl.getAssociatedTokenAddress(stablecoin, user.publicKey),
                tokenProgram: tokenProgramId,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
    async startRound(
        user: anchor.web3.Keypair,
        index: number,
        program: anchor.Program<BearishDotFun>
    ) {
        const platformConfigAccount = await program.account.platformConfig.fetch(
            pda.getPlatformConfig(program)
        );
        const priceAccount = platformConfigAccount.globalRoundInfo.priceAccount;

        const txSignature = await program.methods
            .startRound()
            .accounts({
                user: user.publicKey,
                round: pda.getRound(index, program),
                priceAccount: priceAccount,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
    async endRound(
        user: anchor.web3.Keypair,
        index: number,
        program: anchor.Program<BearishDotFun>
    ) {
        const platformConfigAccount = await program.account.platformConfig.fetch(
            pda.getPlatformConfig(program)
        );
        const priceAccount = platformConfigAccount.globalRoundInfo.priceAccount;

        const txSignature = await program.methods
            .endRound()
            .accounts({
                user: user.publicKey,
                round: pda.getRound(index, program),
                priceAccount: priceAccount,
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
    async placeBet(
        user: anchor.web3.Keypair,
        amount: anchor.BN,
        isLong: boolean,
        index: number,
        program: anchor.Program<BearishDotFun>
    ) {
        const txSignature = await program.methods
            .placeBet(amount, isLong)
            .accounts({
                user: user.publicKey,
                round: pda.getRound(index, program),
                userBet: pda.getUserBet(user.publicKey, index, program),
            })
            .signers([user])
            .rpc();

        return txSignature;
    },
};

export { sleep, createSplTokenMint, transfer, getStablecoin, pda, programMethods };
