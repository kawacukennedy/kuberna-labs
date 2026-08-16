// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error FeeManager__Invalid();

struct FeeTier {
    uint256 threshold;
    uint256 percentage;
}

struct Recipient {
    address account;
    uint256 share;
    bool active;
}

/**
 * @title KubernaFeeManager
 * @dev Manages platform fees, fee tiers, and fee distribution to recipients.
 */
contract KubernaFeeManager is Ownable {
    uint256 public platformFee = 250;
    FeeTier[] public tiers;
    Recipient[] public recipients;
    mapping(address => uint256) public recipientShares;
    mapping(address => bool) public isRecipient;

    constructor() Ownable(msg.sender) {
        tiers.push(FeeTier({threshold: 0, percentage: 250}));
        tiers.push(FeeTier({threshold: 100 ether, percentage: 200}));
        tiers.push(FeeTier({threshold: 1000 ether, percentage: 150}));
    }

    event FeeUpdated(uint256);
    event RecipientAdded(address, uint256);
    event RecipientRemoved(address);
    event FeeDistributed(address, uint256);
    event TierAdded(uint256 threshold, uint256 percentage);
    event TierRemoved(uint256 index);

    /**
     * @dev Sets the platform fee rate.
     * @param fee The new platform fee in BPS (max 1000 = 10%).
     */
    function setPlatformFee(uint256 fee) external onlyOwner {
        require(fee <= 1000);
        platformFee = fee;
        emit FeeUpdated(fee);
    }

    /**
     * @dev Adds a new fee recipient with a share allocation.
     * @param account The recipient address.
     * @param share The recipient's share in BPS (total active shares must not exceed 10000).
     */
    function addRecipient(address account, uint256 share) external onlyOwner {
        require(!isRecipient[account]);
        require(_totalActiveShares() + share <= 10000, "Total shares exceed 10000 BPS");

        recipients.push(Recipient(account, share, true));
        recipientShares[account] = share;
        isRecipient[account] = true;

        emit RecipientAdded(account, share);
    }

    /**
     * @dev Removes a recipient by setting their active status to false.
     * @param account The recipient address to remove.
     */
    function removeRecipient(address account) external onlyOwner {
        require(isRecipient[account]);

        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i].account == account) {
                recipients[i].active = false;
                break;
            }
        }

        isRecipient[account] = false;
        emit RecipientRemoved(account);
    }

    /**
     * @dev Distributes fees to all active recipients.
     * @param token The token address (address(0) for ETH).
     * @param amount The total amount to distribute.
     */
    function distributeFees(address token, uint256 amount) external {
        require(amount > 0);

        uint256 platformAmount = (amount * platformFee) / 10000;
        uint256 distributeAmount = amount - platformAmount;

        for (uint256 i = 0; i < recipients.length; i++) {
            Recipient memory r = recipients[i];
            if (!r.active) continue;

            uint256 shareAmount = (distributeAmount * r.share) / 10000;
            if (shareAmount == 0) continue;

            if (token == address(0)) {
                (bool success, ) = payable(r.account).call{value: shareAmount}("");
                require(success);
            } else {
                require(IERC20(token).transfer(r.account, shareAmount));
            }

            emit FeeDistributed(r.account, shareAmount);
        }
    }

    /**
     * @dev Gets the applicable fee tier for a given volume.
     * @param volume The transaction volume to check.
     * @return The fee percentage in BPS for the applicable tier.
     */
    function getTierFee(uint256 volume) public view returns (uint256) {
        for (uint256 i = tiers.length; i > 0; i--) {
            if (volume >= tiers[i - 1].threshold) {
                return tiers[i - 1].percentage;
            }
        }
        return platformFee;
    }

    /**
     * @dev Returns all registered recipients.
     * @return Array of all Recipient structs.
     */
    function getRecipients() external view returns (Recipient[] memory) {
        return recipients;
    }

    /**
     * @dev Add a new fee tier.
     * @param threshold The volume threshold for this tier.
     * @param percentage The fee percentage in BPS (max 1000).
     */
    function addTier(uint256 threshold, uint256 percentage) external onlyOwner {
        require(percentage <= 1000, "Fee too high");
        tiers.push(FeeTier({threshold: threshold, percentage: percentage}));
        emit TierAdded(threshold, percentage);
    }

    /**
     * @dev Remove a fee tier by index.
     * @param index The index of the tier to remove.
     */
    function removeTier(uint256 index) external onlyOwner {
        require(index < tiers.length, "Invalid index");
        tiers[index] = tiers[tiers.length - 1];
        tiers.pop();
        emit TierRemoved(index);
    }

    /**
     * @dev Get total active recipient shares.
     */
    function _totalActiveShares() internal view returns (uint256 total) {
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i].active) {
                total += recipients[i].share;
            }
        }
    }

    receive() external payable {}
}
