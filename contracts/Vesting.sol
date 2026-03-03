// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error Vesting__Invalid();
error Vesting__NotVested();
error Vesting__AlreadyRevoked();

contract KubernaVesting is Ownable {
    IERC20 public token;
    uint256 public totalAllocated;
    uint256 public constant VESTING_PERIOD = 365 days;
    uint256 public constant CLIFF_PERIOD = 90 days;

    struct VestingSchedule {
        address beneficiary;
        uint256 totalAmount;
        uint256 startTime;
        uint256 revoked;
        uint256 released;
    }

    mapping(bytes32 => VestingSchedule) public vestingSchedules;
    mapping(address => bytes32[]) public beneficiarySchedules;

    event VestingCreated(bytes32 indexed id, address beneficiary, uint256 amount);
    event VestingReleased(bytes32 indexed id, uint256 amount);
    event VestingRevoked(bytes32 indexed id);

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0));
        token = IERC20(_token);
    }

    function createVesting(address beneficiary, uint256 amount, uint256 startTime) external onlyOwner returns (bytes32) {
        require(beneficiary != address(0));
        require(amount > 0);
        
        bytes32 id = keccak256(abi.encodePacked(beneficiary, block.timestamp));
        
        vestingSchedules[id] = VestingSchedule({
            beneficiary: beneficiary,
            totalAmount: amount,
            startTime: startTime,
            revoked: 0,
            released: 0
        });
        
        beneficiarySchedules[beneficiary].push(id);
        totalAllocated += amount;
        
        emit VestingCreated(id, beneficiary, amount);
        return id;
    }

    function release(bytes32 id) external {
        VestingSchedule storage schedule = vestingSchedules[id];
        require(schedule.beneficiary == msg.sender);
        require(schedule.revoked == 0);
        
        uint256 releasable = computeReleasable(id);
        require(releasable > 0);
        
        schedule.released += releasable;
        require(token.transfer(schedule.beneficiary, releasable));
        
        emit VestingReleased(id, releasable);
    }

    function computeReleasable(bytes32 id) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[id];
        if (schedule.revoked == 1) return 0;
        
        uint256 vested = computeVested(id);
        return vested - schedule.released;
    }

    function computeVested(bytes32 id) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[id];
        
        if (block.timestamp < schedule.startTime + CLIFF_PERIOD) return 0;
        if (block.timestamp >= schedule.startTime + VESTING_PERIOD) return schedule.totalAmount;
        
        uint256 timeVested = block.timestamp - schedule.startTime - CLIFF_PERIOD;
        uint256 vestingDuration = VESTING_PERIOD - CLIFF_PERIOD;
        
        return (schedule.totalAmount * timeVested) / vestingDuration;
    }

    function revoke(bytes32 id) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[id];
        require(schedule.revoked == 0);
        
        uint256 releasable = computeReleasable(id);
        if (releasable > 0) {
            schedule.released += releasable;
            token.transfer(schedule.beneficiary, releasable);
        }
        
        schedule.revoked = 1;
        totalAllocated -= (schedule.totalAmount - schedule.released);
        
        emit VestingRevoked(id);
    }

    function getBeneficiarySchedules(address beneficiary) external view returns (bytes32[] memory) {
        return beneficiarySchedules[beneficiary];
    }
}
