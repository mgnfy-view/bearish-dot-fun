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

export { decimals, bumpRangeInclusive, seeds, errors };
