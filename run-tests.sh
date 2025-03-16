echo -e "Building project...\n"

anchor build

echo -e "\nRunning tests..."

anchor test tests/initialization.test.ts --skip-build
sleep 1s

anchor test tests/transferOwnership.test.ts --skip-build
sleep 1s

anchor test tests/setPlatformConfig.test.ts --skip-build
sleep 1s

anchor test tests/setAffiliate.test.ts --skip-build
sleep 1s

anchor test tests/deposit.test.ts --skip-build
sleep 1s

anchor test tests/withdraw.test.ts --skip-build
sleep 1s

anchor test tests/startRound.test.ts --skip-build
sleep 1s

anchor test tests/endRound.test.ts --skip-build
sleep 1s