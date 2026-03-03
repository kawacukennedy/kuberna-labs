// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

error CertificateNFT__Invalid();
error CertificateNFT__OnlyMinter();
error CertificateNFT__AlreadyMinted();

struct CertificateData {
    string recipientName;
    string courseTitle;
    string courseId;
    uint256 completionDate;
    string instructorName;
    string verificationHash;
    bool isValid;
}

contract KubernaCertificateNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    mapping(uint256 => CertificateData) public certificateData;
    mapping(bytes32 => bool) public certificateHashes;
    mapping(address => uint256[]) public userCertificates;
    address public minter;

    event CertificateMinted(uint256, address, string, string);
    event CertificateRevoked(uint256, string);

    constructor() ERC721("Kuberna Certificate", "KBC") Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner { minter = _minter; }

    modifier onlyMinter() {
        require(msg.sender == minter || msg.sender == owner());
        _;
    }

    function mintCertificate(
        address recipient,
        string calldata recipientName,
        string calldata courseTitle,
        string calldata courseId,
        string calldata instructorName,
        string calldata verificationHash
    ) external onlyMinter returns (uint256) {
        bytes32 certHash = keccak256(abi.encodePacked(recipient, courseId, verificationHash));
        require(!certificateHashes[certHash]);
        
        uint256 tokenId = _nextTokenId++;
        
        certificateData[tokenId] = CertificateData({
            recipientName: recipientName,
            courseTitle: courseTitle,
            courseId: courseId,
            completionDate: block.timestamp,
            instructorName: instructorName,
            verificationHash: verificationHash,
            isValid: true
        });
        
        certificateHashes[certHash] = true;
        userCertificates[recipient].push(tokenId);
        
        _setTokenURI(tokenId, _generateTokenURI(tokenId));
        _safeMint(recipient, tokenId);
        
        emit CertificateMinted(tokenId, recipient, courseId, verificationHash);
        return tokenId;
    }

    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        CertificateData memory cert = certificateData[tokenId];
        bytes memory json = abi.encodePacked(
            '{"name":"Kuberna Certificate -',cert.courseTitle,
            '","description":"',cert.recipientName,' completed ',cert.courseTitle,
            '","image":"https://kuberna.africa/certificates/',_toString(tokenId),'.svg"}'
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
    }

    function revokeCertificate(uint256 tokenId, string calldata) external onlyOwner {
        CertificateData storage cert = certificateData[tokenId];
        require(cert.isValid);
        cert.isValid = false;
        emit CertificateRevoked(tokenId, "");
    }

    function verifyCertificate(uint256 tokenId) external view returns (bool) { 
        return certificateData[tokenId].isValid; 
    }

    function verifyByHash(bytes32 certHash) external view returns (bool) { 
        return certificateHashes[certHash]; 
    }

    function getUserCertificates(address user) external view returns (uint256[] memory) { 
        return userCertificates[user]; 
    }

    function getCertificateDetails(uint256 tokenId) external view returns (CertificateData memory) { 
        return certificateData[tokenId]; 
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        unchecked {
            uint256 len;
            uint256 temp = value;
            while (temp != 0) { len++; temp /= 10; }
            bytes memory b = new bytes(len);
            while (value != 0) { 
                uint8 digit = uint8(48 + value % 10);
                b[--len] = bytes1(digit);
                value /= 10; 
            }
            return string(b);
        }
    }
}
