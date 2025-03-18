echo -e "Building project...\n"

anchor build

echo -e "\nRunning tests..."

anchor test tests/initialization.test.ts --skip-build
sleep 1s

anchor test tests/transferOwnership.test.ts --skip-build
sleep 1s

anchor test tests/setPlatformConfig.test.ts --skip-build
sleep 1s

anchor test tests/withdrawPlatformFees.test.ts --skip-build
sleep 1s

anchor test tests/setAffiliate.test.ts --skip-build
sleep 1s

anchor test tests/deposit.test.ts --skip-build
sleep 1s

anchor test tests/withdraw.test.ts --skip-build
sleep 1s

anchor test tests/startRound.test.ts --skip-build
sleep 1s

anchor test tests/placeBet.test.ts --skip-build
sleep 1s

anchor test tests/endRoundPart1.test.ts --skip-build
sleep 1s

anchor test tests/endRoundPart2.test.ts --skip-build
sleep 1s

anchor test tests/endRoundPart3.test.ts --skip-build
sleep 1s

anchor test tests/endRoundPart4.test.ts --skip-build
sleep 1s

anchor test tests/claimUserWinningsPart1.test.ts --skip-build
sleep 1s

anchor test tests/claimUserWinningsPart2.test.ts --skip-build
sleep 1s

anchor test tests/claimUserWinningsPart3.test.ts --skip-build
sleep 1s

anchor test tests/claimUserWinningsPart4.test.ts --skip-build
sleep 1s

anchor test tests/claimAffiliateWinnings.test.ts --skip-build
sleep 1s