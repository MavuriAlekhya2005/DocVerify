const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DocVerify", function () {
  let docVerify;
  let owner;
  let issuer;
  let verifier;
  let unauthorized;

  const sampleDocumentHash = ethers.keccak256(ethers.toUtf8Bytes("sample document content"));
  const sampleDocumentId = "DOC-2026-001";

  beforeEach(async function () {
    [owner, issuer, verifier, unauthorized] = await ethers.getSigners();
    
    const DocVerify = await ethers.getContractFactory("DocVerify");
    docVerify = await DocVerify.deploy();
    await docVerify.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await docVerify.owner()).to.equal(owner.address);
    });

    it("Should authorize owner as issuer", async function () {
      expect(await docVerify.isAuthorized(owner.address)).to.be.true;
    });

    it("Should start with zero documents", async function () {
      const stats = await docVerify.getStats();
      expect(stats[0]).to.equal(0n); // totalDocuments
    });
  });

  describe("Document Registration", function () {
    it("Should register a document successfully", async function () {
      const tx = await docVerify.registerDocument(sampleDocumentHash, sampleDocumentId);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(docVerify, "DocumentRegistered")
        .withArgs(sampleDocumentHash, sampleDocumentId, owner.address, block.timestamp);

      const doc = await docVerify.getDocument(sampleDocumentHash);
      expect(doc.issuer).to.equal(owner.address);
      expect(doc.isRevoked).to.be.false;
      expect(doc.documentId).to.equal(sampleDocumentId);
    });

    it("Should reject duplicate document hash", async function () {
      await docVerify.registerDocument(sampleDocumentHash, sampleDocumentId);
      
      await expect(
        docVerify.registerDocument(sampleDocumentHash, "DOC-2026-002")
      ).to.be.revertedWith("DocVerify: document exists");
    });

    it("Should reject empty document hash", async function () {
      await expect(
        docVerify.registerDocument(ethers.ZeroHash, sampleDocumentId)
      ).to.be.revertedWith("DocVerify: invalid hash");
    });

    it("Should reject unauthorized issuer", async function () {
      await expect(
        docVerify.connect(unauthorized).registerDocument(sampleDocumentHash, sampleDocumentId)
      ).to.be.revertedWith("DocVerify: caller is not authorized");
    });

    it("Should increment total documents", async function () {
      await docVerify.registerDocument(sampleDocumentHash, sampleDocumentId);
      
      const stats = await docVerify.getStats();
      expect(stats[0]).to.equal(1n);
    });
  });

  describe("Document Verification", function () {
    beforeEach(async function () {
      await docVerify.registerDocument(sampleDocumentHash, sampleDocumentId);
    });

    it("Should verify a valid document", async function () {
      const result = await docVerify.verifyByDocumentId.staticCall(sampleDocumentId);
      
      expect(result.isValid).to.be.true;
      expect(result.documentHash).to.equal(sampleDocumentHash);
      expect(result.issuer).to.equal(owner.address);
      expect(result.isRevoked).to.be.false;
    });

    it("Should return invalid for non-existent document", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      const result = await docVerify.verifyByDocumentId.staticCall("FAKE-ID");
      
      expect(result.isValid).to.be.false;
    });

    it("Should emit verification event", async function () {
      await expect(docVerify.verifyDocument(sampleDocumentHash))
        .to.emit(docVerify, "DocumentVerified");
    });

    it("Should increment verification count", async function () {
      await docVerify.verifyDocument(sampleDocumentHash);
      await docVerify.verifyDocument(sampleDocumentHash);
      
      const stats = await docVerify.getStats();
      expect(stats[2]).to.equal(2n); // totalVerifications
    });
  });

  describe("Document Revocation", function () {
    beforeEach(async function () {
      await docVerify.registerDocument(sampleDocumentHash, sampleDocumentId);
    });

    it("Should revoke a document", async function () {
      const tx = await docVerify.revokeDocument(sampleDocumentHash);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      
      await expect(tx)
        .to.emit(docVerify, "DocumentRevoked")
        .withArgs(sampleDocumentHash, owner.address, block.timestamp);

      const doc = await docVerify.getDocument(sampleDocumentHash);
      expect(doc.isRevoked).to.be.true;
    });

    it("Should return invalid for revoked document", async function () {
      await docVerify.revokeDocument(sampleDocumentHash);
      
      const result = await docVerify.verifyByDocumentId.staticCall(sampleDocumentId);
      expect(result.isValid).to.be.false;
      expect(result.isRevoked).to.be.true;
    });

    it("Should reject revoking non-existent document", async function () {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      await expect(
        docVerify.revokeDocument(fakeHash)
      ).to.be.revertedWith("DocVerify: document not found");
    });

    it("Should reject double revocation", async function () {
      await docVerify.revokeDocument(sampleDocumentHash);
      await expect(
        docVerify.revokeDocument(sampleDocumentHash)
      ).to.be.revertedWith("DocVerify: already revoked");
    });
  });

  describe("Batch Registration", function () {
    const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("merkle root"));
    const batchId = ethers.keccak256(ethers.toUtf8Bytes("batch-001"));
    const documentCount = 10;

    it("Should register a batch", async function () {
      await expect(docVerify.registerBatch(merkleRoot, documentCount, batchId))
        .to.emit(docVerify, "BatchRegistered");

      const batch = await docVerify.getBatch(batchId);
      expect(batch.merkleRoot).to.equal(merkleRoot);
      expect(batch.documentCount).to.equal(documentCount);
      expect(batch.issuer).to.equal(owner.address);
    });

    it("Should update total documents for batch", async function () {
      await docVerify.registerBatch(merkleRoot, documentCount, batchId);
      
      const stats = await docVerify.getStats();
      expect(stats[0]).to.equal(BigInt(documentCount));
      expect(stats[1]).to.equal(1n); // totalBatches
    });
  });

  describe("Issuer Management", function () {
    it("Should authorize a new issuer", async function () {
      await expect(docVerify.authorizeIssuer(issuer.address))
        .to.emit(docVerify, "IssuerAuthorized")
        .withArgs(issuer.address, owner.address);

      expect(await docVerify.isAuthorized(issuer.address)).to.be.true;
    });

    it("Should allow authorized issuer to register documents", async function () {
      await docVerify.authorizeIssuer(issuer.address);
      
      await expect(
        docVerify.connect(issuer).registerDocument(sampleDocumentHash, sampleDocumentId)
      ).to.emit(docVerify, "DocumentRegistered");
    });

    it("Should revoke issuer authorization", async function () {
      await docVerify.authorizeIssuer(issuer.address);
      await docVerify.revokeIssuer(issuer.address);
      
      expect(await docVerify.isAuthorized(issuer.address)).to.be.false;
    });

    it("Should reject non-owner from managing issuers", async function () {
      await expect(
        docVerify.connect(unauthorized).authorizeIssuer(issuer.address)
      ).to.be.revertedWith("DocVerify: caller is not owner");
    });

    it("Should not allow revoking owner", async function () {
      await expect(
        docVerify.revokeIssuer(owner.address)
      ).to.be.revertedWith("DocVerify: cannot revoke owner");
    });
  });

  describe("Ownership", function () {
    it("Should transfer ownership", async function () {
      await expect(docVerify.transferOwnership(issuer.address))
        .to.emit(docVerify, "OwnershipTransferred")
        .withArgs(owner.address, issuer.address);

      expect(await docVerify.owner()).to.equal(issuer.address);
    });

    it("Should authorize new owner as issuer", async function () {
      await docVerify.transferOwnership(issuer.address);
      
      expect(await docVerify.isAuthorized(issuer.address)).to.be.true;
    });

    it("Should reject zero address for ownership", async function () {
      await expect(
        docVerify.transferOwnership(ethers.ZeroAddress)
      ).to.be.revertedWith("DocVerify: invalid address");
    });
  });

  // Helper function
  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
