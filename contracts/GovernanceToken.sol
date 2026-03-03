// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernanceToken
 * @dev ERC20 token with governance capabilities for Kuberna Labs protocol.
 * 
 * This token serves as the governance token for the Kuberna Labs ecosystem,
 * allowing holders to participate in protocol governance, voting on proposals,
 * and staking for rewards.
 * 
 * Features:
 * - Mintable by owner for initial distribution
 * - Burnable by holders
 * - Delegation support for vote weight
 */
contract GovernanceToken is ERC20, ERC20Burnable, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    mapping(address => address) public delegates;
    mapping(address => uint256) public delegateCheckpoints;
    
    struct Checkpoint {
        uint256 fromBlock;
        uint256 votes;
    }
    
    mapping(address => Checkpoint[]) public checkpoints;

    /**
     * @dev Initializes the governance token.
     * @param _owner The owner address for minting permissions
     */
    constructor(address _owner) 
        ERC20("Kuberna Labs", "KNL") 
        Ownable(_owner) 
    {
        _mint(_owner, 100_000_000 * 10**18);
    }

    /**
     * @dev Creates new tokens and assigns them to the specified address.
     * @param to The address to receive the newly minted tokens
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }

    /**
     * @dev Delegates voting power to a delegatee.
     * @param delegatee The address to delegate voting power to
     */
    function delegate(address delegatee) external {
        address currentDelegate = delegates[msg.sender];
        uint256 amount = balanceOf(msg.sender);
        
        delegates[msg.sender] = delegatee;
        
        _moveDelegates(currentDelegate, delegatee, amount);
    }

    /**
     * @dev Gets the current voting power of an account.
     * @param account The account to check
     * @return The voting power
     */
    function getVotes(address account) external view returns (uint256) {
        Checkpoint[] storage ckpts = checkpoints[account];
        if (ckpts.length == 0) return 0;
        return ckpts[ckpts.length - 1].votes;
    }

    /**
     * @dev Gets the voting power at a specific block.
     * @param account The account to check
     * @param blockNumber The block number
     * @return The voting power at that block
     */
    function getPastVotes(address account, uint256 blockNumber) external view returns (uint256) {
        Checkpoint[] storage ckpts = checkpoints[account];
        if (ckpts.length == 0) return 0;
        
        uint256 low = 0;
        uint256 high = ckpts.length;
        
        while (low < high) {
            uint256 mid = (low + high) / 2;
            if (ckpts[mid].fromBlock > blockNumber) {
                high = mid;
            } else {
                low = mid + 1;
            }
        }
        
        if (low == 0) return 0;
        return ckpts[low - 1].votes;
    }

    function _moveDelegates(
        address from,
        address to,
        uint256 amount
    ) internal {
        if (from != to && amount > 0) {
            if (from != address(0)) {
                uint256 fromOld = _getVotes(from);
                uint256 fromNew = fromOld >= amount ? fromOld - amount : 0;
                _writeCheckpoint(from, fromOld, fromNew);
            }
            if (to != address(0)) {
                uint256 toOld = _getVotes(to);
                uint256 toNew = toOld + amount;
                _writeCheckpoint(to, toOld, toNew);
            }
        }
    }

    function _getVotes(address account) internal view returns (uint256) {
        Checkpoint[] storage ckpts = checkpoints[account];
        if (ckpts.length == 0) return 0;
        return ckpts[ckpts.length - 1].votes;
    }

    function _writeCheckpoint(
        address delegatee,
        uint256 oldVotes,
        uint256 newVotes
    ) internal {
        uint256 pos = checkpoints[delegatee].length;
        if (pos > 0 && checkpoints[delegatee][pos - 1].fromBlock == block.number) {
            checkpoints[delegatee][pos - 1].votes = newVotes;
        } else {
            checkpoints[delegatee].push(Checkpoint(block.number, newVotes));
        }
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        super._update(from, to, value);
        _moveDelegates(delegates[from], delegates[to], value);
    }
}
