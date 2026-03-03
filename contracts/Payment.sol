// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

error Payment__Invalid();

struct TokenConfig {
    bool enabled;
    uint256 minAmount;
    uint256 maxAmount;
    address oracle;
}

contract KubernaPayment is Ownable, ReentrancyGuard {
    uint256 public immutable MIN_WITHDRAWAL = 10 ether;
    uint256 public platformBalance;

    mapping(address => TokenConfig) public tokenConfigs;
    mapping(address => uint256) public userBalances;
    address[] public supportedTokens;

    event TokenAdded(address, uint256, uint256);
    event TokenRemoved(address);
    event PaymentReceived(address, address, uint256);
    event Withdrawal(address, address, uint256);
    event PlatformFeeCollected(address, uint256);

    constructor() Ownable(msg.sender) {
        supportedTokens.push(address(0));
        tokenConfigs[address(0)] = TokenConfig({enabled: true, minAmount: 0, maxAmount: type(uint256).max, oracle: address(0)});
    }

    function addToken(address token, uint256 minAmount, uint256 maxAmount) external onlyOwner {
        require(!tokenConfigs[token].enabled);
        
        tokenConfigs[token] = TokenConfig({enabled: true, minAmount: minAmount, maxAmount: maxAmount, oracle: address(0)});
        supportedTokens.push(token);
        
        emit TokenAdded(token, minAmount, maxAmount);
    }

    function removeToken(address token) external onlyOwner {
        require(tokenConfigs[token].enabled);
        tokenConfigs[token].enabled = false;
        emit TokenRemoved(token);
    }

    function processPayment(address token, uint256 amount) external payable nonReentrant {
        TokenConfig memory c = tokenConfigs[token];
        require(c.enabled);
        require(amount >= c.minAmount && amount <= c.maxAmount);

        if (token == address(0)) {
            require(msg.value == amount);
        } else {
            require(IERC20(token).transferFrom(msg.sender, address(this), amount));
        }

        unchecked {
            userBalances[msg.sender] += amount;
            platformBalance += amount;
        }
        
        emit PaymentReceived(msg.sender, token, amount);
    }

    function batchProcessPayment(address[] calldata tokens, uint256[] calldata amounts) external payable {
        require(tokens.length == amounts.length);
        
        for (uint256 i = 0; i < tokens.length; i++) {
            TokenConfig memory c = tokenConfigs[tokens[i]];
            require(c.enabled);
            
            if (tokens[i] == address(0)) {
                require(msg.value >= amounts[i]);
            } else {
                require(IERC20(tokens[i]).transferFrom(msg.sender, address(this), amounts[i]));
            }
            
            unchecked {
                userBalances[msg.sender] += amounts[i];
                platformBalance += amounts[i];
            }
            
            emit PaymentReceived(msg.sender, tokens[i], amounts[i]);
        }
    }

    function withdraw(address token, uint256 amount) external nonReentrant {
        require(amount >= MIN_WITHDRAWAL);
        require(userBalances[msg.sender] >= amount);

        unchecked { userBalances[msg.sender] -= amount; }

        _transfer(token, msg.sender, amount);

        emit Withdrawal(msg.sender, token, amount);
    }

    function withdrawFees(address token, uint256 amount) external onlyOwner nonReentrant {
        require(amount <= platformBalance);
        
        unchecked { platformBalance -= amount; }

        _transfer(token, owner(), amount);

        emit PlatformFeeCollected(token, amount);
    }

    function _transfer(address token, address to, uint256 amount) internal {
        if (amount == 0) return;
        if (token == address(0)) {
            (bool success,) = payable(to).call{value: amount}("");
            require(success);
        } else {
            require(IERC20(token).transfer(to, amount));
        }
    }

    function getBalance(address user) external view returns (uint256) { return userBalances[user]; }
    function getSupportedTokens() external view returns (address[] memory) { return supportedTokens; }

    receive() external payable {}
}
