const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");

describe("Staking Contract Unit Test", function() {
    //setting up
    let staking;
    let signer1;
    let signer2;
    beforeEach(async function() {
        [signer1, signer2] = await ethers.getSigners();
        const Staking = await ethers.getContractFactory("Staking", signer1);
        staking = await Staking.deploy({ value: ethers.utils.parseEther("20") });
        await staking.deployed();
    });

    describe("Testing Constructor", function() {
        it("should have some ethers", async () => {
            const contractBalance = await ethers.provider.getBalance(staking.address);
            expect(contractBalance).to.equal(ethers.utils.parseEther("20"));
        });
        it("should set owner", async () => {
            expect(await staking.owner()).to.equal(signer1.address);
        });

        it("should setsup tiers and lockPeriods", async () => {
            expect(await staking.lockPeriods(0)).to.equal(30);
            expect(await staking.lockPeriods(1)).to.equal(90);
            expect(await staking.lockPeriods(2)).to.equal(180);

            expect(await staking.tiers(30)).to.equal(700);
            expect(await staking.tiers(90)).to.equal(1000);
            expect(await staking.tiers(180)).to.equal(1200);
        });
    });

    describe("Testing stakeEther", function() {
        it("transfer ethers from stakers to contract", async () => {
            const provider = waffle.provider;
            let contractBalance;
            let signerBalance;
            const transferAmount = ethers.utils.parseEther("2.0");

            contractBalance = await provider.getBalance(staking.address);
            signerBalance = await signer1.getBalance();

            const trasnaction = await staking
                .connect(signer1)
                .stakeEther(30, { value: transferAmount });
            const receipt = await trasnaction.wait();
            const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice);

            //test the change in signer's balance
            expect(await signer1.getBalance()).to.equal(
                signerBalance.sub(transferAmount).sub(gasUsed)
            );

            //test the change in contract's balance
            expect(await provider.getBalance(staking.address)).to.equal(
                contractBalance.add(transferAmount)
            );
        });

        it("add position to Position struct", async () => {
            const provider = waffle.provider;
            const transferAmount = ethers.utils.parseEther("1.0");
            let position = await staking.positions(0);

            expect(position.positionId).to.equal(0);
            expect(position.walletAddress).to.equal("0x0000000000000000000000000000000000000000");
            expect(position.createdDate).to.equal(0);
            expect(position.unlockDate).to.equal(0);
            expect(position.percentInterest).to.equal(0);
            expect(position.weiStaked).to.equal(0);
            expect(position.weiInterest).to.equal(0);
            expect(position.open).to.equal(false);

            expect(await staking.currentPositionId()).to.equal(0);

            const trasnaction = await staking
                .connect(signer1)
                .stakeEther(30, { value: transferAmount });
            const receipt = await trasnaction.wait();

            const block = await provider.getBlock(receipt.blockNumber);

            position = await staking.positions(0);

            expect(position.positionId).to.equal(0);
            expect(position.walletAddress).to.equal(signer1.address);
            expect(position.createdDate).to.equal(block.timestamp);
            expect(position.unlockDate).to.equal(block.timestamp + 86400 * 30);
            expect(position.percentInterest).to.equal(700);
            expect(position.weiStaked).to.equal(transferAmount);
            expect(position.weiInterest).to.equal(
                ethers.BigNumber.from(transferAmount)
                    .mul(700)
                    .div(10000)
            );
            //expect(position.weiInterest).to.equal( staking.calculateInterest(700, transferAmount));
            expect(position.open).to.equal(true);

            expect(await staking.currentPositionId()).to.equal(1);
        });

        it("should adds the address and positionId to positionIdsByAddress", async () => {
            const transferAmount = ethers.utils.parseEther("0.2");
            await staking.connect(signer1).stakeEther(30, { value: transferAmount });
            await staking.connect(signer2).stakeEther(30, { value: transferAmount });
            await staking.connect(signer2).stakeEther(90, { value: transferAmount });

            expect(await staking.positionsIdsByAddress(signer1.address, 0)).to.equal(0);
            expect(await staking.positionsIdsByAddress(signer2.address, 0)).to.equal(1);
            expect(await staking.positionsIdsByAddress(signer2.address, 1)).to.equal(2);
        });
    });

    describe("Testing modifyLockPeriods function", function() {
        it("should create a new lock preiod by owner", async () => {
            await staking.connect(signer1).modifyLockPeriods(270, 1500);
            expect(await staking.tiers(270)).to.equal(1500);
            expect(await staking.lockPeriods(3)).to.equal(270);
        });
        it("should modify the existing lock period by owner", async () => {
            await staking.connect(signer1).modifyLockPeriods(30, 900);
            expect(await staking.tiers(30)).to.equal(900);
        });
        it("should revert if modified by non-owner", async () => {
            await expect(
                staking.connect(signer2).modifyLockPeriods(270, 1500)
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Testing getLockPeriods", function() {
        it("should return lockPeriods", async () => {
            const lockPeriods = await staking.getLockPeriods();
            const lp = lockPeriods.map(p => Number(p));
            //console.log(lp);
            expect(lp).to.eql([30, 90, 180]);
        });
    });

    describe("Testing getInterestRate", function() {
        it("should return the interest rate of supplied lock period", async () => {
            const interestRate = await staking.getInterestRate(30);
            expect(interestRate).to.equal(700);
        });
    });

    describe("Testing getPositionById", function() {
        it("should return the position for the supplied ID", async () => {
            const provider = waffle.provider;
            const transferAmount = ethers.utils.parseEther("2.0");
            const trasnaction = await staking
                .connect(signer1)
                .stakeEther(30, { value: transferAmount });
            const receipt = await trasnaction.wait();

            const block = await provider.getBlock(receipt.blockNumber);

            const position = await staking.connect(signer1).getPositionById(0);

            expect(position.positionId).to.equal(0);
            expect(position.walletAddress).to.equal(signer1.address);
            expect(position.createdDate).to.equal(block.timestamp);
            expect(position.unlockDate).to.equal(block.timestamp + 86400 * 30);
            expect(position.percentInterest).to.equal(700);
            expect(position.weiStaked).to.equal(transferAmount);
            expect(position.weiInterest).to.equal(
                ethers.BigNumber.from(transferAmount)
                    .mul(700)
                    .div(10000)
            );
            expect(position.open).to.equal(true);
        });
    });

    describe("Testing getPositionIdsForAddress", function() {
        it("should return the position id for the given wallet address", async () => {
            const transferAmount = ethers.utils.parseEther("2.0");
            const trasnaction = await staking
                .connect(signer1)
                .stakeEther(30, { value: transferAmount });
            await trasnaction.wait();

            const positionIds = await staking
                .connect(signer1)
                .getPositionIdsForAddress(signer1.address);
            expect(positionIds.map(p => Number(p))).to.eql([0]);
        });
    });

    describe("Testing changeUnlockDate", function() {
        it("should able to change the unlockDate of a given positionId by owner only", async () => {
            const transferAmount = ethers.utils.parseEther("2.0");
            const trasnaction = await staking
                .connect(signer2)
                .stakeEther(30, { value: transferAmount });
            await trasnaction.wait();
            const position = await staking.getPositionById(0);
            const newUnlockDate = position.unlockDate + 86400 * 30;

            await staking.connect(signer1).changeUnlockDate(0, newUnlockDate);
            const positionNew = await staking.getPositionById(0);
            //expect(positionNew.unlockDate).to.equal(newUnlockDate);
            expect(positionNew.unlockDate).to.equal(position.unlockDate + 86400 * 30);
        });

        it("should revert for non owner", async () => {
            const transferAmount = ethers.utils.parseEther("2.0");
            const trasnaction = await staking
                .connect(signer2)
                .stakeEther(30, { value: transferAmount });
            await trasnaction.wait();
            const position = await staking.getPositionById(0);
            const newUnlockDate = position.unlockDate + 86400 * 30;

            await expect(
                staking.connect(signer2).changeUnlockDate(0, newUnlockDate)
            ).to.be.revertedWith("Not owner");
        });
    });

    describe("Testing closePosition", function() {
        it("it transfer principal and interest after unlock date", async () => {
            const transferAmount = ethers.utils.parseEther("2.0");
            const trasnaction = await staking
                .connect(signer2)
                .stakeEther(30, { value: transferAmount });
            await trasnaction.wait();

            const position = await staking.getPositionById(0);

            const signer2BalanceStart = await signer2.getBalance();
            // move ahead in time
            await ethers.provider.send("evm_increaseTime", [86400 * 31]);
            await ethers.provider.send("evm_mine");

            const trasnaction2 = await staking.connect(signer2).closePosition(0);
            const receipt2 = await trasnaction2.wait();
            const gasUsed = receipt2.gasUsed.mul(receipt2.effectiveGasPrice);

            const signer2BalanceEnd = await signer2.getBalance();
            expect(signer2BalanceEnd).to.equal(
                signer2BalanceStart
                    .add(position.weiStaked)
                    .add(position.weiInterest)
                    .sub(gasUsed)
            );
        });

        it("it transfer only principal before unlock date", async () => {
            const transferAmount = ethers.utils.parseEther("3.0");
            const trasnaction = await staking
                .connect(signer2)
                .stakeEther(30, { value: transferAmount });
            await trasnaction.wait();

            const position = await staking.getPositionById(0);

            const signer2BalanceStart = await signer2.getBalance();

            // move ahead in time
            await ethers.provider.send("evm_increaseTime", [86400 * 10]);
            await ethers.provider.send("evm_mine");

            const trasnaction2 = await staking.connect(signer2).closePosition(0);
            const receipt2 = await trasnaction2.wait();
            const gasUsed = receipt2.gasUsed.mul(receipt2.effectiveGasPrice);

            const signer2BalanceEnd = await signer2.getBalance();
            expect(signer2BalanceEnd).to.equal(
                signer2BalanceStart.add(position.weiStaked).sub(gasUsed)
            );
        });
    });
});
