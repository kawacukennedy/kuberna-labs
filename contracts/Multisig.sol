// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

error Multisig__Invalid();
error Multisig__NotOwner();
error Multisig__AlreadyExecuted();
error Multisig__NotConfirmed();

contract KubernaMultisig is Ownable {
    uint256 public threshold;
    uint256 public nonce;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => Transaction) public transactions;

    struct Transaction {
        address to;
        address token;
        uint256 amount;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    event TransactionSubmitted(uint256 indexed id, address to, uint256 amount);
    event TransactionConfirmed(uint256 indexed id, address owner);
    event TransactionExecuted(uint256 indexed id);
    event TransactionCancelled(uint256 indexed id);

    constructor(address[] memory owners, uint256 _threshold) Ownable(msg.sender) {
        require(owners.length >= _threshold && _threshold > 0);
        for (uint256 i = 0; i < owners.length; i++) {
            require(owners[i] != address(0));
        }
        threshold = _threshold;
    }

    function submitTransaction(address to, address token, uint256 amount, bytes calldata data) external onlyOwner returns (uint256) {
        uint256 id = nonce++;
        transactions[id] = Transaction(to, token, amount, data, false, 0);
        emit TransactionSubmitted(id, to, amount);
        return id;
    }

    function confirmTransaction(uint256 id) external onlyOwner {
        Transaction storage t = transactions[id];
        require(!t.executed);
        require(!confirmations[id][msg.sender]);
        
        confirmations[id][msg.sender] = true;
        t.confirmations++;
        
        emit TransactionConfirmed(id, msg.sender);
    }

    function executeTransaction(uint256 id) external onlyOwner {
        Transaction storage t = transactions[id];
        require(!t.executed);
        require(t.confirmations >= threshold);
        
        t.executed = true;
        
        if (t.token == address(0)) {
            (bool success,) = payable(t.to).call{value: t.amount}(t.data);
            require(success);
        } else {
            (bool success,) = t.to.call(t.data);
            require(success || t.data.length == 0);
        }
        
        emit TransactionExecuted(id);
    }

    function cancelTransaction(uint256 id) external onlyOwner {
        Transaction storage t = transactions[id];
        require(!t.executed);
        t.executed = true;
        emit TransactionCancelled(id);
    }

    function getTransaction(uint256 id) external view returns (Transaction memory) {
        return transactions[id];
    }

    function isConfirmed(uint256 id, address owner) external view returns (bool) {
        return confirmations[id][owner];
    }

    receive() external payable {}
}
