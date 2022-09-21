// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

contract Staking {
    address public owner;
    struct Position {
        uint256 positionId;
        address walletAddress;
        uint256 createdDate;
        uint256 unlockDate;
        uint256 percentInterest;
        uint256 weiStaked;
        uint256 weiInterest;
        bool open;
    }
    Position position;
    uint256 public currentPositionId;
    mapping(uint256 => Position) public positions;
    mapping(address => uint256[]) public positionsIdsByAddress;
    mapping(uint256 => uint256) public tiers;
    uint256[] public lockPeriods;

    //making constructor payable means deploye of this contracts need to pay some ethers so that he can pay interest to the stakers
    constructor() payable {
        owner = msg.sender;
        currentPositionId = 0;

        tiers[30] = 700; // 7% APY interest for 30 days
        tiers[90] = 1000; // 10%
        tiers[180] = 1200; // 12%

        lockPeriods.push(30);
        lockPeriods.push(90);
        lockPeriods.push(180);
    }

    function stakeEther(uint256 numDays) external payable {
        require(tiers[numDays] > 0, "Invalid staking period provided");
        positions[currentPositionId] = Position(
            currentPositionId,
            msg.sender,
            block.timestamp,
            block.timestamp + (numDays * 1 days),
            tiers[numDays],
            msg.value,
            calculateInterest(tiers[numDays], msg.value),
            true
        );
        positionsIdsByAddress[msg.sender].push(currentPositionId);

        currentPositionId += 1;
    }

    function calculateInterest(uint256 basisPoints, uint256 weiAmount)
        private
        pure
        returns (uint256)
    {
        return (basisPoints * weiAmount) / 10000;
    }

    // owners can modify the loclPeriod
    function modifyLockPeriods(uint256 numDays, uint256 basisPoints) external {
        require(owner == msg.sender, "Not owner");
        tiers[numDays] = basisPoints; //if it exists then update else add new
        lockPeriods.push(numDays);
    }

    function getLockPeriods() external view returns (uint256[] memory) {
        return lockPeriods;
    }

    function getInterestRate(uint256 numDays) external view returns (uint256) {
        return tiers[numDays];
    }

    function getPositionById(uint256 poistionId) external view returns (Position memory) {
        return positions[poistionId];
    }

    function getPositionIdsForAddress(address walletAddress)
        external
        view
        returns (uint256[] memory)
    {
        return positionsIdsByAddress[walletAddress];
    }

    function changeUnlockDate(uint256 positionId, uint256 newUnlockDate) external {
        require(owner == msg.sender, "Not owner");
        positions[positionId].unlockDate = newUnlockDate;
    }

    function closePosition(uint256 positionId) external {
        require(
            positions[positionId].walletAddress == msg.sender,
            "You are not authorised to close this position"
        );
        require(positions[positionId].open == true, "Position is already closed");
        positions[positionId].open = false;

        if (block.timestamp >= positions[positionId].unlockDate) {
            uint256 amount = positions[positionId].weiStaked + positions[positionId].weiInterest;
            (bool sent, ) = payable(msg.sender).call{value: amount}("");
            require(sent, "Transaction failed");
        } else {
            // if they are withdrawing before the timeperiod they will get the original amount, no interest
            (bool sent, ) = payable(msg.sender).call{value: positions[positionId].weiStaked}("");
            require(sent, "Transaction failed");
        }
    }
}
