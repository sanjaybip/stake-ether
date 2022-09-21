const { ethers, waffle } = require("hardhat");

async function main() {
    [signer1, signer2] = await ethers.getSigners();
    const Staking = await ethers.getContractFactory("Staking", signer1);
    const staking = await Staking.deploy({ value: ethers.utils.parseEther("50") });
    await staking.deployed();
    console.log(`Staking contract deployed at ${staking.address}`);
    /*
    * Uncomment this, in case you want to add some staking data for signer2 in your frontent.
    *
    console.log(`---------Creating Some Back Date Staking Position----------`);

    let provider = waffle.provider;
    let trasnaction;
    let receipt;
    let block;
    let newUnlockDate;

    await staking.connect(signer2).stakeEther(30, { value: ethers.utils.parseEther("0.5") });

    await staking.connect(signer2).stakeEther(90, { value: ethers.utils.parseEther("1") });

    await staking.connect(signer2).stakeEther(30, { value: ethers.utils.parseEther("2") });

    trasnaction = await staking
        .connect(signer2)
        .stakeEther(90, { value: ethers.utils.parseEther("1.5") });
    receipt = await trasnaction.wait();
    block = await provider.getBlock(receipt.blockNumber);
    newUnlockDate = block.timestamp - 86400 * 92;
    await staking.connect(signer1).changeUnlockDate(3, newUnlockDate);

    trasnaction = await staking
        .connect(signer2)
        .stakeEther(180, { value: ethers.utils.parseEther("1.75") });
    receipt = await trasnaction.wait();
    block = await provider.getBlock(receipt.blockNumber);
    newUnlockDate = block.timestamp - 86400 * 190;
    await staking.connect(signer1).changeUnlockDate(4, newUnlockDate);
    */
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
