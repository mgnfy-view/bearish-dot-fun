echo -e "Building project...\n"

anchor build

echo -e "\nRunning tests..."

anchor test tests/initialization.test.ts --skip-build
sleep 2s

anchor test tests/transferOwnership.test.ts --skip-build
sleep 2s

anchor test tests/setAffiliate.test.ts --skip-build
sleep 2s

anchor test tests/deposit.test.ts --skip-build
sleep 2s

anchor test tests/withdraw.test.ts --skip-build
sleep 2s