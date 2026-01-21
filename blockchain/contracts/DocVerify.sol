// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DocVerify - Document Verification Smart Contract
 * @notice Stores document hashes on-chain for tamper-proof verification
 * @dev Optimized for gas efficiency - stores minimal data on-chain
 */
contract DocVerify {
    // ============ Structs ============
    
    struct Document {
        bytes32 documentHash;      // SHA-256 hash of document content
        address issuer;            // Address that issued the document
        uint256 timestamp;         // Block timestamp when issued
        bool isRevoked;            // Revocation status
        string documentId;         // Off-chain document ID reference
    }

    struct BatchRecord {
        bytes32 merkleRoot;        // Merkle root of batch
        uint256 documentCount;     // Number of documents in batch
        address issuer;            // Address that issued the batch
        uint256 timestamp;         // Block timestamp
    }

    // ============ State Variables ============
    
    // Owner of the contract
    address public owner;
    
    // Mapping from document hash to Document struct
    mapping(bytes32 => Document) public documents;
    
    // Mapping from document ID to document hash
    mapping(string => bytes32) public documentIdToHash;
    
    // Mapping from batch ID to BatchRecord
    mapping(bytes32 => BatchRecord) public batches;
    
    // Authorized issuers
    mapping(address => bool) public authorizedIssuers;
    
    // Statistics
    uint256 public totalDocuments;
    uint256 public totalBatches;
    uint256 public totalVerifications;

    // ============ Events ============
    
    event DocumentRegistered(
        bytes32 indexed documentHash,
        string documentId,
        address indexed issuer,
        uint256 timestamp
    );
    
    event DocumentRevoked(
        bytes32 indexed documentHash,
        address indexed revoker,
        uint256 timestamp
    );
    
    event BatchRegistered(
        bytes32 indexed batchId,
        bytes32 merkleRoot,
        uint256 documentCount,
        address indexed issuer,
        uint256 timestamp
    );
    
    event DocumentVerified(
        bytes32 indexed documentHash,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );
    
    event IssuerAuthorized(address indexed issuer, address indexed authorizedBy);
    event IssuerRevoked(address indexed issuer, address indexed revokedBy);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ============ Modifiers ============
    
    modifier onlyOwner() {
        require(msg.sender == owner, "DocVerify: caller is not owner");
        _;
    }
    
    modifier onlyAuthorized() {
        require(
            msg.sender == owner || authorizedIssuers[msg.sender],
            "DocVerify: caller is not authorized"
        );
        _;
    }

    // ============ Constructor ============
    
    constructor() {
        owner = msg.sender;
        authorizedIssuers[msg.sender] = true;
        emit IssuerAuthorized(msg.sender, msg.sender);
    }

    // ============ Document Functions ============
    
    /**
     * @notice Register a new document hash on-chain
     * @param _documentHash SHA-256 hash of the document
     * @param _documentId Off-chain document ID for reference
     */
    function registerDocument(
        bytes32 _documentHash,
        string calldata _documentId
    ) external onlyAuthorized {
        require(_documentHash != bytes32(0), "DocVerify: invalid hash");
        require(documents[_documentHash].timestamp == 0, "DocVerify: document exists");
        require(bytes(_documentId).length > 0, "DocVerify: invalid document ID");
        
        documents[_documentHash] = Document({
            documentHash: _documentHash,
            issuer: msg.sender,
            timestamp: block.timestamp,
            isRevoked: false,
            documentId: _documentId
        });
        
        documentIdToHash[_documentId] = _documentHash;
        totalDocuments++;
        
        emit DocumentRegistered(_documentHash, _documentId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Register multiple documents in a batch using Merkle root
     * @param _merkleRoot Merkle root of all document hashes
     * @param _documentCount Number of documents in the batch
     * @param _batchId Unique batch identifier
     */
    function registerBatch(
        bytes32 _merkleRoot,
        uint256 _documentCount,
        bytes32 _batchId
    ) external onlyAuthorized {
        require(_merkleRoot != bytes32(0), "DocVerify: invalid merkle root");
        require(_documentCount > 0, "DocVerify: empty batch");
        require(batches[_batchId].timestamp == 0, "DocVerify: batch exists");
        
        batches[_batchId] = BatchRecord({
            merkleRoot: _merkleRoot,
            documentCount: _documentCount,
            issuer: msg.sender,
            timestamp: block.timestamp
        });
        
        totalBatches++;
        totalDocuments += _documentCount;
        
        emit BatchRegistered(_batchId, _merkleRoot, _documentCount, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Revoke a document
     * @param _documentHash Hash of document to revoke
     */
    function revokeDocument(bytes32 _documentHash) external onlyAuthorized {
        require(documents[_documentHash].timestamp != 0, "DocVerify: document not found");
        require(!documents[_documentHash].isRevoked, "DocVerify: already revoked");
        require(
            documents[_documentHash].issuer == msg.sender || msg.sender == owner,
            "DocVerify: not authorized to revoke"
        );
        
        documents[_documentHash].isRevoked = true;
        
        emit DocumentRevoked(_documentHash, msg.sender, block.timestamp);
    }

    // ============ Verification Functions ============
    
    /**
     * @notice Verify a document by its hash
     * @param _documentHash Hash to verify
     * @return isValid Whether document is registered and not revoked
     * @return issuer Address that registered the document
     * @return timestamp When document was registered
     * @return isRevoked Whether document is revoked
     */
    function verifyDocument(bytes32 _documentHash) external returns (
        bool isValid,
        address issuer,
        uint256 timestamp,
        bool isRevoked
    ) {
        Document memory doc = documents[_documentHash];
        
        isValid = doc.timestamp != 0 && !doc.isRevoked;
        issuer = doc.issuer;
        timestamp = doc.timestamp;
        isRevoked = doc.isRevoked;
        
        totalVerifications++;
        
        emit DocumentVerified(_documentHash, msg.sender, isValid, block.timestamp);
    }
    
    /**
     * @notice Verify document by ID (view only, no gas)
     * @param _documentId Off-chain document ID
     */
    function verifyByDocumentId(string calldata _documentId) external view returns (
        bool isValid,
        bytes32 documentHash,
        address issuer,
        uint256 timestamp,
        bool isRevoked
    ) {
        documentHash = documentIdToHash[_documentId];
        Document memory doc = documents[documentHash];
        
        isValid = doc.timestamp != 0 && !doc.isRevoked;
        issuer = doc.issuer;
        timestamp = doc.timestamp;
        isRevoked = doc.isRevoked;
    }
    
    /**
     * @notice Verify a document is part of a batch using Merkle proof
     * @param _batchId Batch identifier
     * @param _documentHash Document hash to verify
     * @param _merkleProof Array of hashes forming the proof
     */
    function verifyBatchDocument(
        bytes32 _batchId,
        bytes32 _documentHash,
        bytes32[] calldata _merkleProof
    ) external view returns (bool isValid) {
        BatchRecord memory batch = batches[_batchId];
        require(batch.timestamp != 0, "DocVerify: batch not found");
        
        bytes32 computedHash = _documentHash;
        
        for (uint256 i = 0; i < _merkleProof.length; i++) {
            bytes32 proofElement = _merkleProof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == batch.merkleRoot;
    }

    // ============ Admin Functions ============
    
    /**
     * @notice Authorize a new issuer
     * @param _issuer Address to authorize
     */
    function authorizeIssuer(address _issuer) external onlyOwner {
        require(_issuer != address(0), "DocVerify: invalid address");
        require(!authorizedIssuers[_issuer], "DocVerify: already authorized");
        
        authorizedIssuers[_issuer] = true;
        emit IssuerAuthorized(_issuer, msg.sender);
    }
    
    /**
     * @notice Revoke issuer authorization
     * @param _issuer Address to revoke
     */
    function revokeIssuer(address _issuer) external onlyOwner {
        require(_issuer != owner, "DocVerify: cannot revoke owner");
        require(authorizedIssuers[_issuer], "DocVerify: not authorized");
        
        authorizedIssuers[_issuer] = false;
        emit IssuerRevoked(_issuer, msg.sender);
    }
    
    /**
     * @notice Transfer contract ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "DocVerify: invalid address");
        
        address previousOwner = owner;
        owner = _newOwner;
        authorizedIssuers[_newOwner] = true;
        
        emit OwnershipTransferred(previousOwner, _newOwner);
    }

    // ============ View Functions ============
    
    /**
     * @notice Get document details
     * @param _documentHash Hash of document
     */
    function getDocument(bytes32 _documentHash) external view returns (
        address issuer,
        uint256 timestamp,
        bool isRevoked,
        string memory documentId
    ) {
        Document memory doc = documents[_documentHash];
        return (doc.issuer, doc.timestamp, doc.isRevoked, doc.documentId);
    }
    
    /**
     * @notice Get batch details
     * @param _batchId Batch identifier
     */
    function getBatch(bytes32 _batchId) external view returns (
        bytes32 merkleRoot,
        uint256 documentCount,
        address issuer,
        uint256 timestamp
    ) {
        BatchRecord memory batch = batches[_batchId];
        return (batch.merkleRoot, batch.documentCount, batch.issuer, batch.timestamp);
    }
    
    /**
     * @notice Get contract statistics
     */
    function getStats() external view returns (
        uint256 _totalDocuments,
        uint256 _totalBatches,
        uint256 _totalVerifications
    ) {
        return (totalDocuments, totalBatches, totalVerifications);
    }
    
    /**
     * @notice Check if an address is authorized
     * @param _address Address to check
     */
    function isAuthorized(address _address) external view returns (bool) {
        return _address == owner || authorizedIssuers[_address];
    }
}
