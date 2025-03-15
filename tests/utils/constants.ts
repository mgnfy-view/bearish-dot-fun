import * as anchor from "@coral-xyz/anchor";

import { GlobalRoundInfo } from "./types";

const decimals = 9;
const bumpRangeInclusive = [1, 255];

const seeds = {
    platformConfig: "platform_config",
    platformVault: "platform_vault",
    user: "user",
    round: "round",
    userBet: "user_bet",
};

const errors = {
    durationZero: "Round duration cannot be 0.",
    invalidAllocation: "Invalid allocation. Does not add up to 100%.",
    exceedsMaxFee: "Exceeds max fee in bips.",
    invalidJackPotAllocation: "Invalid jackpot allocation.",
    priceAccountDefaultPubkey: "Price account cannot be default pubkey.",
    depositAmountZero: "Deposit amount cannot be 0.",
    withdrawAmountZero: "Withdraw amount cannot be 0.",
    invalidAffiliate: "Invalid affiliate address.",
    priceCannotBeZero: "Price cannot be 0.",
    roundHasNotEndedYet: "Round has not ended yet.",
    roundAlreadyStarted: "Round already started.",
    roundAlreadyEnded: "Round already ended.",
    betAmountZero: "Bet amount cannot be 0.",
    alreadyClaimedWinnings: "Already claimed winnings.",
    ineligibleForClaim: "Ineligible for claim.",
    alreadyCollectedPlatformFees: "Already collected platform fees.",
    claimAmountZero: "Claim amount cannot be 0.",
    platformFeeAmountZero: "Platform fee amount to collect is 0.",
};

const sampleGlobalRoundInfo: GlobalRoundInfo = {
    round: new anchor.BN(0),
    duration: new anchor.BN(10),
    allocation: {
        winnersShare: 4500,
        affiliateShare: 500,
        jackpotShare: 4000,
        platformShare: 1000,
    },
    jackpotAllocation: {
        streak5: 1000,
        streak6: 1500,
        streak7: 2000,
        streak8: 2500,
        streak9: 3000,
        streak10: 10000,
    },
    minBetAmount: new anchor.BN(0),
    priceAccount: new anchor.web3.PublicKey("4cSM2e6rvbGQUFiJbqytoVMi5GgghSMr8LwVrT9VPSPo"),
    stalenessThreshold: new anchor.BN(600),
    jackpotPoolAmount: new anchor.BN(0),
    accumulatedPlatformFees: new anchor.BN(0),
};

export { decimals, bumpRangeInclusive, seeds, errors, sampleGlobalRoundInfo };
