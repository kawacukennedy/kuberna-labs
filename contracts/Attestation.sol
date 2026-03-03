// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Attestation
 * @dev On-chain attestation contract for Kuberna Labs.
 * 
 * This contract provides verifiable attestations for:
 * - Agent identity and credentials
 * - TEE (Trusted Execution Environment) attestations
 * - Cross-chain message verification
 * - User/agent reputation claims
 * 
 * Features:
 * - EIP-712 typed signatures
 * - Schema-based attestations
 * - Revocation capability
 * - Expiration support
 */
contract Attestation is Ownable, EIP712 {
    using ECDSA for bytes32;

    struct AttestationData {
        bytes32 schema;
        address recipient;
        address issuer;
        uint64 expirationTime;
        uint64 issuedAt;
        bytes data;
        bool revoked;
    }

    bytes32 public constant ATTESTATION_TYPEHASH = keccak256(
        "Attestation(bytes32 schema,address recipient,uint64 expirationTime,bytes data)"
    );

    mapping(bytes32 => AttestationData) public attestations;
    mapping(bytes32 => mapping(address => bool)) public revocationHistory;
    mapping(address => bytes32[]) public issuerAttestations;
    mapping(address => bytes32[]) public recipientAttestations;
    
    uint256 public attestationCount;
    
    event AttestationCreated(
        bytes32 indexed attestationId,
        bytes32 indexed schema,
        address indexed recipient,
        address issuer,
        uint64 expirationTime
    );
    event AttestationRevoked(
        bytes32 indexed attestationId,
        address indexed revoker
    );

    /**
     * @dev Initializes the attestation contract.
     * @param _owner The contract owner
     */
    constructor(address _owner) EIP712("KubernaLabsAttestation", "1.0.0") Ownable(_owner) {}

    /**
     * @dev Creates a new attestation.
     * @param schema The schema identifier
     * @param recipient The recipient address
     * @param expirationTime Unix timestamp when attestation expires
     * @param data Additional attestation data
     * @return The attestation ID
     */
    function attest(
        bytes32 schema,
        address recipient,
        uint64 expirationTime,
        bytes memory data
    ) external returns (bytes32) {
        require(recipient != address(0), "Invalid recipient");
        
        bytes32 attestationId = keccak256(
            abi.encodePacked(schema, recipient, block.timestamp, msg.sender)
        );
        
        attestations[attestationId] = AttestationData({
            schema: schema,
            recipient: recipient,
            issuer: msg.sender,
            expirationTime: expirationTime,
            issuedAt: uint64(block.timestamp),
            data: data,
            revoked: false
        });
        
        issuerAttestations[msg.sender].push(attestationId);
        recipientAttestations[recipient].push(attestationId);
        attestationCount++;
        
        emit AttestationCreated(attestationId, schema, recipient, msg.sender, expirationTime);
        
        return attestationId;
    }

    /**
     * @dev Creates an attestation signed by a specific issuer.
     * @param schema The schema identifier
     * @param recipient The recipient address
     * @param expirationTime Unix timestamp when attestation expires
     * @param data Additional attestation data
     * @param signature The issuer's signature
     * @return The attestation ID
     */
    function attestBySignature(
        bytes32 schema,
        address recipient,
        uint64 expirationTime,
        bytes memory data,
        bytes calldata signature
    ) external returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(ATTESTATION_TYPEHASH, schema, recipient, expirationTime, keccak256(data))
        );
        
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);
        
        require(signer != address(0), "Invalid signature");
        
        bytes32 attestationId = keccak256(
            abi.encodePacked(schema, recipient, block.timestamp, signer)
        );
        
        attestations[attestationId] = AttestationData({
            schema: schema,
            recipient: recipient,
            issuer: signer,
            expirationTime: expirationTime,
            issuedAt: uint64(block.timestamp),
            data: data,
            revoked: false
        });
        
        issuerAttestations[signer].push(attestationId);
        recipientAttestations[recipient].push(attestationId);
        attestationCount++;
        
        emit AttestationCreated(attestationId, schema, recipient, signer, expirationTime);
        
        return attestationId;
    }

    /**
     * @dev Revokes an attestation.
     * @param attestationId The attestation ID to revoke
     */
    function revoke(bytes32 attestationId) external {
        AttestationData storage attestation = attestations[attestationId];
        require(attestation.issuer == msg.sender || msg.sender == owner(), "Not authorized");
        require(!attestation.revoked, "Already revoked");
        
        attestation.revoked = true;
        revocationHistory[attestationId][msg.sender] = true;
        
        emit AttestationRevoked(attestationId, msg.sender);
    }

    /**
     * @dev Verifies if an attestation is valid.
     * @param attestationId The attestation ID to verify
     * @return Whether the attestation is valid
     */
    function verify(bytes32 attestationId) external view returns (bool) {
        AttestationData memory attestation = attestations[attestationId];
        
        if (attestation.issuedAt == 0) return false;
        if (attestation.revoked) return false;
        if (attestation.expirationTime > 0 && block.timestamp > attestation.expirationTime) {
            return false;
        }
        
        return true;
    }

    /**
     * @dev Gets attestation data.
     * @param attestationId The attestation ID
     * @return Attestation data struct
     */
    function getAttestation(bytes32 attestationId) external view returns (AttestationData memory) {
        return attestations[attestationId];
    }

    /**
     * @dev Gets attestations for an issuer.
     * @param issuer The issuer address
     * @return Array of attestation IDs
     */
    function getIssuerAttestations(address issuer) external view returns (bytes32[] memory) {
        return issuerAttestations[issuer];
    }

    /**
     * @dev Gets attestations for a recipient.
     * @param recipient The recipient address
     * @return Array of attestation IDs
     */
    function getRecipientAttestations(address recipient) external view returns (bytes32[] memory) {
        return recipientAttestations[recipient];
    }
}
