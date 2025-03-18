import * as anchor from "@coral-xyz/anchor";

interface Allocation {
    winnersShare: number;
    affiliateShare: number;
    jackpotShare: number;
    platformShare: number;
}

interface JackPotAllocation {
    streak5: number;
    streak6: number;
    streak7: number;
    streak8: number;
    streak9: number;
    streak10: number;
}

interface GlobalRoundInfo {
    round: anchor.BN;
    duration: anchor.BN;
    allocation: Allocation;
    jackpotAllocation: JackPotAllocation;
    minBetAmount: anchor.BN;
    priceAccount: anchor.web3.PublicKey;
    stalenessThreshold: anchor.BN;
    jackpotPoolAmount: anchor.BN;
    accumulatedPlatformFees: anchor.BN;
}

interface User {
    keypair: anchor.web3.Keypair;
    amount: anchor.BN;
    isLong: boolean;
    claimWinnings: boolean;
}

export { Allocation, JackPotAllocation, GlobalRoundInfo, User };
