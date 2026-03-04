// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

error Multisig__Invalid();
error Multisig__NotOwner();
error Multisig__AlreadyExecuted();
error Multisig__NotConfirmed();
error Multisig__AlreadyOwner();
error Multisig__NotAnOwner();
error Multisig__InvalidThreshold();
error Multisig__AlreadyConfirmed();
error Multisig__OnlySelf();

contract KubernaMultisig {
    uint256 public threshold;
    uint256 public ownerCount;
    uint256 public nonce;

    mapping(address => bool) public isOwner;
    address[] public owners;
    mapping(uint256 => mapping(address => bool)) public confirmations;
    mapping(uint256 => Transaction) public transactions;

    struct Transaction {
        address to;
        address token;
        uint256 amount;
        bytes data;
        bool executed;
        uint256 confirmationCount;
    }

    event TransactionSubmitted(uint256 indexed id, address to, uint256 amount);
    event TransactionConfirmed(uint256 indexed id, address owner);
    event TransactionRevoked(uint256 indexed id, address owner);
    event TransactionExecuted(uint256 indexed id);
    event TransactionCancelled(uint256 indexed id);
    event OwnerAdded(address indexed owner);
    event OwnerRemoved(address indexed owner);
    event ThresholdChanged(uint256 newThreshold);

    modifier onlyMultisigOwner() {
        if (!isOwner[msg.sender]) revert Multisig__NotOwner();
        _;
    }

    modifier onlySelf() {
        if (msg.sender != address(this)) revert Multisig__OnlySelf();
        _;
    }

    modifier txExists(uint256 id) {
        require(id < nonce, "Transaction does not exist");
        _;
    }

    modifier notExecuted(uint256 id) {
        if (transactions[id].executed) revert Multisig__AlreadyExecuted();
        _;
    }

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length > 0, "Owners required");
        require(_threshold > 0 && _threshold <= _owners.length, "Invalid threshold");

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid owner address");
            require(!isOwner[owner], "Duplicate owner");

            isOwner[owner] = true;
            owners.push(owner);
        }

        ownerCount = _owners.length;
        threshold = _threshold;
    }

    function submitTransaction(
        address to,
        address token,
        uint256 amount,
        bytes calldata data
    ) external onlyMultisigOwner returns (uint256) {
        uint256 id = nonce++;
        transactions[id] = Transaction({
            to: to,
            token: token,
            amount: amount,
            data: data,
            executed: false,
            confirmationCount: 0
        });

        emit TransactionSubmitted(id, to, amount);
        return id;
    }

    function confirmTransaction(uint256 id)
        external
        onlyMultisigOwner
        txExists(id)
        notExecuted(id)
    {
        if (confirmations[id][msg.sender]) revert Multisig__AlreadyConfirmed();

        confirmations[id][msg.sender] = true;
        transactions[id].confirmationCount++;

        emit TransactionConfirmed(id, msg.sender);
    }

    function revokeConfirmation(uint256 id)
        external
        onlyMultisigOwner
        txExists(id)
        notExecuted(id)
    {
        require(confirmations[id][msg.sender], "Not confirmed");

        confirmations[id][msg.sender] = false;
        transactions[id].confirmationCount--;

        emit TransactionRevoked(id, msg.sender);
    }

    function executeTransaction(uint256 id)
        external
        onlyMultisigOwner
        txExists(id)
        notExecuted(id)
    {
        Transaction storage t = transactions[id];
        if (t.confirmationCount < threshold) revert Multisig__NotConfirmed();

        t.executed = true;

        if (t.token == address(0)) {
            // Native ETH transfer or arbitrary call
            (bool success, ) = payable(t.to).call{value: t.amount}(t.data);
            require(success, "Execution failed");
        } else if (t.data.length > 0) {
            // Arbitrary call with data
            (bool success, ) = t.to.call(t.data);
            require(success, "Execution failed");
        } else {
            // ERC20 transfer
            require(IERC20(t.token).transfer(t.to, t.amount), "Token transfer failed");
        }

        emit TransactionExecuted(id);
    }

    function cancelTransaction(uint256 id)
        external
        onlyMultisigOwner
        txExists(id)
        notExecuted(id)
    {
        transactions[id].executed = true;
        emit TransactionCancelled(id);
    }

    // --- Owner management (can only be called via multisig execution) ---

    function addOwner(address owner) external onlySelf {
        require(owner != address(0), "Invalid owner address");
        if (isOwner[owner]) revert Multisig__AlreadyOwner();

        isOwner[owner] = true;
        owners.push(owner);
        ownerCount++;

        emit OwnerAdded(owner);
    }

    function removeOwner(address owner) external onlySelf {
        if (!isOwner[owner]) revert Multisig__NotAnOwner();
        require(ownerCount - 1 >= threshold, "Would break threshold");

        isOwner[owner] = false;
        ownerCount--;

        // Remove from array
        for (uint256 i = 0; i < owners.length; i++) {
            if (owners[i] == owner) {
                owners[i] = owners[owners.length - 1];
                owners.pop();
                break;
            }
        }

        emit OwnerRemoved(owner);
    }

    function changeThreshold(uint256 newThreshold) external onlySelf {
        require(newThreshold > 0 && newThreshold <= ownerCount, "Invalid threshold");
        threshold = newThreshold;
        emit ThresholdChanged(newThreshold);
    }

    // --- View functions ---

    function getTransaction(uint256 id) external view returns (Transaction memory) {
        return transactions[id];
    }

    function isConfirmed(uint256 id, address owner) external view returns (bool) {
        return confirmations[id][owner];
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return nonce;
    }

    receive() external payable {}
}
