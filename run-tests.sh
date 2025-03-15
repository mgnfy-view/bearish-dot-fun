echo -e "Building project...\n"

anchor build

echo -e "\nRunning tests..."

anchor test tests/initialization.test.ts --skip-build
sleep 1s