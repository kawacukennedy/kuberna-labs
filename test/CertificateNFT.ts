import { expect } from 'chai';
import hre from 'hardhat';
const { ethers } = hre;
import type { KubernaCertificateNFT } from '../typechain-types';

describe('KubernaCertificateNFT', function () {
  let certificate: KubernaCertificateNFT;
  let owner: any;
  let minter: any;
  let recipient: any;
  let other: any;

  beforeEach(async function () {
    [owner, minter, recipient, other] = await ethers.getSigners();

    const Certificate = await ethers.getContractFactory('KubernaCertificateNFT');
    certificate = await Certificate.deploy();
    await certificate.waitForDeployment();

    await certificate.connect(owner).setMinter(minter.address);
  });

  describe('Deployment', function () {
    it('should deploy with correct owner', async function () {
      expect(await certificate.owner()).to.equal(owner.address);
    });

    it('should have correct name and symbol', async function () {
      expect(await certificate.name()).to.equal('Kuberna Certificate');
      expect(await certificate.symbol()).to.equal('KBC');
    });

    it('should have minter set', async function () {
      expect(await certificate.minter()).to.equal(minter.address);
    });
  });

  describe('setMinter', function () {
    it('should allow owner to set minter', async function () {
      await expect(certificate.connect(owner).setMinter(other.address)).to.not.be.reverted;
      expect(await certificate.minter()).to.equal(other.address);
    });

    it('should reject by non-owner', async function () {
      await expect(certificate.connect(other).setMinter(other.address)).to.be.reverted;
    });
  });

  describe('mintCertificate', function () {
    it('should mint a certificate successfully', async function () {
      const courseId = 'course-001';
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));

      await expect(
        certificate
          .connect(minter)
          .mintCertificate(
            recipient.address,
            'John Doe',
            'Blockchain Development',
            courseId,
            'Dr. Smith',
            verificationHash
          )
      ).to.emit(certificate, 'CertificateMinted');

      const tokenId = 0;
      expect(await certificate.ownerOf(tokenId)).to.equal(recipient.address);
    });

    it('should store certificate data correctly', async function () {
      const courseId = 'course-002';
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));

      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Jane Doe',
          'Solidity Masterclass',
          courseId,
          'Prof. Johnson',
          verificationHash
        );

      const tokenId = 0;
      const data = await certificate.getCertificateDetails(tokenId);
      expect(data.recipientName).to.equal('Jane Doe');
      expect(data.courseTitle).to.equal('Solidity Masterclass');
      expect(data.courseId).to.equal(courseId);
      expect(data.instructorName).to.equal('Prof. Johnson');
      expect(data.isValid).to.equal(true);
    });

    it('should track user certificates', async function () {
      const courseId = 'course-003';
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));

      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Alice',
          'Course',
          courseId,
          'Instructor',
          verificationHash
        );

      const certs = await certificate.getUserCertificates(recipient.address);
      expect(certs.length).to.equal(1);
      expect(certs[0]).to.equal(0);
    });

    it('should reject duplicate certificate', async function () {
      const courseId = 'course-004';
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));

      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Bob',
          'Course',
          courseId,
          'Instructor',
          verificationHash
        );

      await expect(
        certificate
          .connect(minter)
          .mintCertificate(
            recipient.address,
            'Bob',
            'Course',
            courseId,
            'Instructor',
            verificationHash
          )
      ).to.be.reverted;
    });

    it('should reject minting by non-minter', async function () {
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));

      await expect(
        certificate
          .connect(other)
          .mintCertificate(
            recipient.address,
            'Name',
            'Course',
            'course-id',
            'Instructor',
            verificationHash
          )
      ).to.be.reverted;
    });

    it('should allow owner to mint (owner is also minter)', async function () {
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));

      await expect(
        certificate
          .connect(owner)
          .mintCertificate(
            recipient.address,
            'Name',
            'Course',
            'course-id',
            'Instructor',
            verificationHash
          )
      ).to.emit(certificate, 'CertificateMinted');
    });
  });

  describe('revokeCertificate', function () {
    beforeEach(async function () {
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));
      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Name',
          'Course',
          'course-id',
          'Instructor',
          verificationHash
        );
    });

    it('should revoke certificate by owner', async function () {
      await expect(certificate.connect(owner).revokeCertificate(0, '')).to.emit(
        certificate,
        'CertificateRevoked'
      );

      const data = await certificate.getCertificateDetails(0);
      expect(data.isValid).to.equal(false);
    });

    it('should reject revoke by non-owner', async function () {
      await expect(certificate.connect(other).revokeCertificate(0, '')).to.be.reverted;
    });

    it('should reject revoke of already revoked certificate', async function () {
      await certificate.connect(owner).revokeCertificate(0, '');
      await expect(certificate.connect(owner).revokeCertificate(0, '')).to.be.reverted;
    });
  });

  describe('verifyCertificate', function () {
    beforeEach(async function () {
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));
      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Name',
          'Course',
          'course-id',
          'Instructor',
          verificationHash
        );
    });

    it('should return true for valid certificate', async function () {
      const isValid = await certificate.verifyCertificate(0);
      expect(isValid).to.equal(true);
    });

    it('should return false for revoked certificate', async function () {
      await certificate.connect(owner).revokeCertificate(0, '');
      const isValid = await certificate.verifyCertificate(0);
      expect(isValid).to.equal(false);
    });
  });

  describe('verifyByHash', function () {
    it('should return false for non-existent hash', async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes('fake'));
      const exists = await certificate.verifyByHash(fakeHash);
      expect(exists).to.equal(false);
    });
  });

  describe('ERC721 functionality', function () {
    beforeEach(async function () {
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));
      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Name',
          'Course',
          'course-id',
          'Instructor',
          verificationHash
        );
    });

    it('should support ERC721 interface', async function () {
      const IERC721 = '0x80ac58cd';
      expect(await certificate.supportsInterface(IERC721)).to.equal(true);
    });

    it('should transfer certificate NFT', async function () {
      await certificate.connect(recipient).transferFrom(recipient.address, other.address, 0);
      expect(await certificate.ownerOf(0)).to.equal(other.address);
    });

    it('should generate token URI', async function () {
      const tokenURI = await certificate.tokenURI(0);
      expect(tokenURI).to.include('data:application/json;base64,');
    });
  });

  describe('getCertificateDetails', function () {
    beforeEach(async function () {
      const verificationHash = ethers.keccak256(ethers.toUtf8Bytes('verification'));
      await certificate
        .connect(minter)
        .mintCertificate(
          recipient.address,
          'Student Name',
          'Advanced Web3',
          'web3-101',
          'Prof. Crypto',
          verificationHash
        );
    });

    it('should return all certificate details', async function () {
      const details = await certificate.getCertificateDetails(0);
      expect(details.recipientName).to.equal('Student Name');
      expect(details.courseTitle).to.equal('Advanced Web3');
      expect(details.courseId).to.equal('web3-101');
      expect(details.instructorName).to.equal('Prof. Crypto');
      expect(details.isValid).to.equal(true);
    });
  });
});
