// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TransferHelper
 * @dev Secure token transfer library for ETH and ERC20 tokens
 */
library TransferHelper {
    using SafeERC20 for IERC20;

    error TransferHelper__EthTransferFailed();
    error TransferHelper__ZeroAmount();

    /**
     * @dev Transfer ETH or ERC20 tokens to a recipient
     * @param token Address(0) for ETH, or ERC20 token address
     * @param to Recipient address
     * @param amount Amount to transfer
     */
    function safeTransfer(address token, address to, uint256 amount) internal {
        if (amount == 0) revert TransferHelper__ZeroAmount();

        if (token == address(0)) {
            (bool success, ) = payable(to).call{value: amount}("");
            if (!success) revert TransferHelper__EthTransferFailed();
        } else {
            IERC20(token).safeTransfer(to, amount);
        }
    }

    /**
     * @dev Transfer ETH or ERC20 tokens from a sender (using transferFrom)
     */
    function safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        if (amount == 0) revert TransferHelper__ZeroAmount();
        IERC20(token).safeTransferFrom(from, to, amount);
    }

    /**
     * @dev Get balance of an account for ETH or ERC20
     */
    function balanceOf(address token, address account) internal view returns (uint256) {
        if (token == address(0)) {
            return account.balance;
        } else {
            return IERC20(token).balanceOf(account);
        }
    }
}
