/**
 * Blockchain Service - Integration with DocVerify Smart Contract
 * Handles document registration, verification, and batch operations on-chain
 */

const { ethers } = require('ethers');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// Load contract ABI
let contractConfig = null;
const contractPath = path.join(__dirname, '../contracts/DocVerify.json');

if (fs.existsSync(contractPath)) {
  contractConfig = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
}

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.isConnected = false;
  }

  /**
   * Initialize blockchain connection
   */
  async initialize() {
    try {
      // Check if contract is deployed
      if (!contractConfig || !contractConfig.address) {
        console.log('⚠️  Blockchain: Contract not deployed yet. Run deployment first.');
        return false;
      }

      // Connect to local Hardhat node or configured network
      const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
      this.provider = new ethers.JsonRpcProvider(rpcUrl);

      // Test connection
      await this.provider.getNetwork();
      console.log('✅ Blockchain: Connected to', rpcUrl);

      // Create wallet from private key
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      if (privateKey) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        console.log('✅ Blockchain: Wallet loaded:', this.wallet.address);
      } else {
        // For local development, use first account from Hardhat
        const accounts = await this.provider.listAccounts();
        if (accounts.length > 0) {
          this.wallet = await this.provider.getSigner(0);
          console.log('✅ Blockchain: Using default account');
        }
      }

      // Connect to contract
      if (this.wallet) {
        this.contract = new ethers.Contract(
          contractConfig.address,
          contractConfig.abi,
          this.wallet
        );
        this.isConnected = true;
        console.log('✅ Blockchain: Contract connected at', contractConfig.address);
      }

      return true;
    } catch (error) {
      console.error('❌ Blockchain: Connection failed:', error.message);
      this.isConnected = false;
      return false;
    }
  }

  /**
   * Check if blockchain service is available
   */
  isAvailable() {
    return this.isConnected && this.contract !== null;
  }

  /**
   * Generate SHA-256 hash from document content
   */
  generateDocumentHash(content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return '0x' + hash;
  }

  /**
   * Register a document on the blockchain
   */
  async registerDocument(documentHash, documentId) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      // Ensure hash is properly formatted
      const formattedHash = documentHash.startsWith('0x') 
        ? documentHash 
        : '0x' + documentHash;

      // Check if document already exists
      const existing = await this.contract.getDocument(formattedHash);
      if (existing.timestamp > 0n) {
        return {
          success: false,
          message: 'Document already registered on blockchain',
          existingTimestamp: Number(existing.timestamp),
        };
      }

      // Register document
      const tx = await this.contract.registerDocument(formattedHash, documentId);
      const receipt = await tx.wait();

      // Find the DocumentRegistered event
      const event = receipt.logs.find(log => {
        try {
          return this.contract.interface.parseLog(log)?.name === 'DocumentRegistered';
        } catch {
          return false;
        }
      });

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        documentHash: formattedHash,
        documentId,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Blockchain registration error:', error);
      throw new Error(`Failed to register on blockchain: ${error.message}`);
    }
  }

  /**
   * Verify a document on the blockchain
   */
  async verifyDocument(documentHash) {
    if (!this.isAvailable()) {
      return {
        verified: false,
        onChain: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const formattedHash = documentHash.startsWith('0x') 
        ? documentHash 
        : '0x' + documentHash;

      // Get document info (view function, no gas)
      const doc = await this.contract.getDocument(formattedHash);

      if (doc.timestamp === 0n) {
        return {
          verified: false,
          onChain: false,
          message: 'Document not found on blockchain',
        };
      }

      return {
        verified: !doc.isRevoked,
        onChain: true,
        issuer: doc.issuer,
        timestamp: Number(doc.timestamp),
        registeredAt: new Date(Number(doc.timestamp) * 1000).toISOString(),
        isRevoked: doc.isRevoked,
        documentId: doc.documentId,
        documentHash: formattedHash,
      };
    } catch (error) {
      console.error('Blockchain verification error:', error);
      return {
        verified: false,
        onChain: false,
        error: error.message,
      };
    }
  }

  /**
   * Verify a document by its off-chain ID
   */
  async verifyByDocumentId(documentId) {
    if (!this.isAvailable()) {
      return {
        verified: false,
        onChain: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const result = await this.contract.verifyByDocumentId(documentId);

      if (!result.isValid && result.timestamp === 0n) {
        return {
          verified: false,
          onChain: false,
          message: 'Document not found on blockchain',
        };
      }

      return {
        verified: result.isValid,
        onChain: true,
        documentHash: result.documentHash,
        issuer: result.issuer,
        timestamp: Number(result.timestamp),
        registeredAt: new Date(Number(result.timestamp) * 1000).toISOString(),
        isRevoked: result.isRevoked,
      };
    } catch (error) {
      console.error('Blockchain verification error:', error);
      return {
        verified: false,
        onChain: false,
        error: error.message,
      };
    }
  }

  /**
   * Revoke a document on the blockchain
   */
  async revokeDocument(documentHash) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      const formattedHash = documentHash.startsWith('0x') 
        ? documentHash 
        : '0x' + documentHash;

      const tx = await this.contract.revokeDocument(formattedHash);
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error('Blockchain revocation error:', error);
      throw new Error(`Failed to revoke on blockchain: ${error.message}`);
    }
  }

  /**
   * Register a batch of documents using Merkle tree
   */
  async registerBatch(documentHashes, batchId) {
    if (!this.isAvailable()) {
      throw new Error('Blockchain service not available');
    }

    try {
      // Build Merkle tree
      const merkleRoot = this.buildMerkleRoot(documentHashes);
      const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(batchId));

      const tx = await this.contract.registerBatch(
        merkleRoot,
        documentHashes.length,
        batchIdHash
      );
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        merkleRoot,
        batchId,
        documentCount: documentHashes.length,
      };
    } catch (error) {
      console.error('Blockchain batch registration error:', error);
      throw new Error(`Failed to register batch: ${error.message}`);
    }
  }

  /**
   * Build Merkle root from array of hashes
   */
  buildMerkleRoot(hashes) {
    if (hashes.length === 0) return ethers.ZeroHash;
    if (hashes.length === 1) return hashes[0];

    let level = hashes.map(h => h.startsWith('0x') ? h : '0x' + h);

    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          const [left, right] = level[i] < level[i + 1] 
            ? [level[i], level[i + 1]] 
            : [level[i + 1], level[i]];
          nextLevel.push(ethers.keccak256(ethers.concat([left, right])));
        } else {
          nextLevel.push(level[i]);
        }
      }
      level = nextLevel;
    }

    return level[0];
  }

  /**
   * Generate Merkle proof for a document in a batch
   */
  generateMerkleProof(documentHash, allHashes) {
    const index = allHashes.findIndex(h => 
      (h.startsWith('0x') ? h : '0x' + h) === 
      (documentHash.startsWith('0x') ? documentHash : '0x' + documentHash)
    );
    
    if (index === -1) return null;

    const proof = [];
    let level = allHashes.map(h => h.startsWith('0x') ? h : '0x' + h);
    let idx = index;

    while (level.length > 1) {
      const nextLevel = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          if (i === idx || i + 1 === idx) {
            proof.push(i === idx ? level[i + 1] : level[i]);
          }
          const [left, right] = level[i] < level[i + 1] 
            ? [level[i], level[i + 1]] 
            : [level[i + 1], level[i]];
          nextLevel.push(ethers.keccak256(ethers.concat([left, right])));
        } else {
          nextLevel.push(level[i]);
        }
      }
      level = nextLevel;
      idx = Math.floor(idx / 2);
    }

    return proof;
  }

  /**
   * Verify a document in a batch using Merkle proof
   */
  async verifyBatchDocument(batchId, documentHash, proof) {
    if (!this.isAvailable()) {
      return {
        verified: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(batchId));
      const formattedHash = documentHash.startsWith('0x') 
        ? documentHash 
        : '0x' + documentHash;

      const isValid = await this.contract.verifyBatchDocument(
        batchIdHash,
        formattedHash,
        proof
      );

      return {
        verified: isValid,
        batchId,
        documentHash: formattedHash,
      };
    } catch (error) {
      console.error('Blockchain batch verification error:', error);
      return {
        verified: false,
        error: error.message,
      };
    }
  }

  /**
   * Estimate gas for document registration
   */
  async estimateGasForRegistration(documentHash, documentId) {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const formattedHash = documentHash.startsWith('0x') 
        ? documentHash 
        : '0x' + documentHash;

      // Estimate gas
      const gasEstimate = await this.contract.registerDocument.estimateGas(
        formattedHash, 
        documentId
      );

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const maxFeePerGas = feeData.maxFeePerGas;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;

      // Calculate costs
      const estimatedCost = gasEstimate * gasPrice;
      const maxCost = gasEstimate * (maxFeePerGas || gasPrice);

      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        maxFeePerGas: maxFeePerGas?.toString() || gasPrice.toString(),
        maxPriorityFeePerGas: maxPriorityFeePerGas?.toString() || '0',
        estimatedCost: ethers.formatEther(estimatedCost),
        maxCost: ethers.formatEther(maxCost),
        estimatedCostUSD: null, // Would need price feed
        unit: 'ETH',
      };
    } catch (error) {
      console.error('Gas estimation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Estimate gas for batch registration
   */
  async estimateGasForBatch(documentHashes, batchId) {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const merkleRoot = this.buildMerkleRoot(documentHashes);
      const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(batchId));

      const gasEstimate = await this.contract.registerBatch.estimateGas(
        merkleRoot,
        documentHashes.length,
        batchIdHash
      );

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      const maxFeePerGas = feeData.maxFeePerGas;

      const estimatedCost = gasEstimate * gasPrice;
      const maxCost = gasEstimate * (maxFeePerGas || gasPrice);
      const costPerDocument = estimatedCost / BigInt(documentHashes.length);

      return {
        success: true,
        documentCount: documentHashes.length,
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost: ethers.formatEther(estimatedCost),
        maxCost: ethers.formatEther(maxCost),
        costPerDocument: ethers.formatEther(costPerDocument),
        savings: documentHashes.length > 1 
          ? `~${Math.round((1 - (1 / documentHashes.length)) * 100)}% vs individual`
          : 'N/A',
        unit: 'ETH',
      };
    } catch (error) {
      console.error('Batch gas estimation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Estimate gas for document revocation
   */
  async estimateGasForRevocation(documentHash) {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const formattedHash = documentHash.startsWith('0x') 
        ? documentHash 
        : '0x' + documentHash;

      const gasEstimate = await this.contract.revokeDocument.estimateGas(formattedHash);
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const estimatedCost = gasEstimate * gasPrice;

      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        estimatedCost: ethers.formatEther(estimatedCost),
        unit: 'ETH',
      };
    } catch (error) {
      console.error('Revocation gas estimation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get current network gas prices
   */
  async getGasPrices() {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const feeData = await this.provider.getFeeData();
      const block = await this.provider.getBlock('latest');

      return {
        success: true,
        gasPrice: ethers.formatUnits(feeData.gasPrice, 'gwei'),
        maxFeePerGas: feeData.maxFeePerGas 
          ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei')
          : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas
          ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei')
          : null,
        baseFee: block.baseFeePerGas
          ? ethers.formatUnits(block.baseFeePerGas, 'gwei')
          : null,
        unit: 'gwei',
        blockNumber: block.number,
        timestamp: new Date(block.timestamp * 1000).toISOString(),
      };
    } catch (error) {
      console.error('Gas price fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance() {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const address = await this.wallet.getAddress();
      const balance = await this.provider.getBalance(address);

      return {
        success: true,
        address,
        balance: ethers.formatEther(balance),
        balanceWei: balance.toString(),
        unit: 'ETH',
      };
    } catch (error) {
      console.error('Balance fetch error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get comprehensive gas estimation report
   */
  async getGasEstimationReport(operation, params = {}) {
    const gasPrices = await this.getGasPrices();
    let operationEstimate;

    switch (operation) {
      case 'register':
        operationEstimate = await this.estimateGasForRegistration(
          params.documentHash || '0x' + '0'.repeat(64),
          params.documentId || 'TEST-DOC-ID'
        );
        break;
      case 'batch':
        operationEstimate = await this.estimateGasForBatch(
          params.documentHashes || ['0x' + '0'.repeat(64)],
          params.batchId || 'TEST-BATCH-ID'
        );
        break;
      case 'revoke':
        operationEstimate = await this.estimateGasForRevocation(
          params.documentHash || '0x' + '0'.repeat(64)
        );
        break;
      default:
        operationEstimate = { success: false, message: 'Unknown operation' };
    }

    const walletBalance = await this.getWalletBalance();

    return {
      operation,
      gasPrices,
      operationEstimate,
      walletBalance,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get contract statistics
   */
  async getStats() {
    if (!this.isAvailable()) {
      return {
        available: false,
        message: 'Blockchain service not available',
      };
    }

    try {
      const stats = await this.contract.getStats();
      
      return {
        available: true,
        totalDocuments: Number(stats[0]),
        totalBatches: Number(stats[1]),
        totalVerifications: Number(stats[2]),
        contractAddress: contractConfig.address,
        network: contractConfig.network,
      };
    } catch (error) {
      console.error('Blockchain stats error:', error);
      return {
        available: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if an address is an authorized issuer
   */
  async isAuthorizedIssuer(address) {
    if (!this.isAvailable()) return false;
    
    try {
      return await this.contract.isAuthorized(address);
    } catch {
      return false;
    }
  }
}

// Singleton instance
const blockchainService = new BlockchainService();

// Auto-initialize with retry for concurrent startup
const initWithRetry = async (maxRetries = 10, delay = 3000) => {
  for (let i = 0; i < maxRetries; i++) {
    const success = await blockchainService.initialize();
    if (success) return;
    console.log(`⏳ Blockchain: Retrying connection in ${delay/1000}s... (${i + 1}/${maxRetries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  console.log('⚠️  Blockchain: Running without blockchain (verification will use DB only)');
};

// Start initialization in background
initWithRetry();

module.exports = blockchainService;
