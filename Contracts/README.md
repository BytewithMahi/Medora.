# Medora Supply Chain Smart Contract

## Overview

The `MedoraSupplyChain` contract serves as the immutable ledger layer for the Medora medicine authenticity verification platform. It records and verifies supply chain transactions while keeping business logic in the Node.js backend.

## Contract Features

### Role Management
- Three primary roles: `MANUFACTURER`, `DISTRIBUTOR`, `RETAILER`
- Admin role for role assignment via `grantRole(address, role)`
- Role-based access control using OpenZeppelin's AccessControl

### Batch Operations
- `registerBatch()` - Register new medicine batches (manufacturers only)
- `transferBatch()` - Record supply chain handoffs with sequential validation
- `verifyBatch()` - Public verification with full provenance history

### Security Features
- Custom errors for gas efficiency
- Input validation and address checks
- Sequential handoff validation (Manufacturer → Distributor → Retailer)
- Events for all state changes

## Integration Guide

### Backend Integration

The Node.js backend will call these functions:

1. **Role Management:**
   ```javascript
   // Grant role to verified user
   await contract.grantRole(userAddress, MANUFACTURER_ROLE);
   ```

2. **Batch Registration:**
   ```javascript
   // Register new batch (manufacturer only)
   await contract.registerBatch(
     batchId, 
     keccak256(medicineMetadata), 
     manufacturerAddress
   );
   ```

3. **Supply Chain Transfers:**
   ```javascript
   // Transfer to distributor
   await contract.transferBatch(batchId, distributorAddress, DISTRIBUTOR_ROLE);
   
   // Transfer to retailer
   await contract.transferBatch(batchId, retailerAddress, RETAILER_ROLE);
   ```

### Frontend Integration

The frontend will call these functions:

1. **Batch Verification:**
   ```javascript
   // Public verification function
   const [isValid, history] = await contract.verifyBatch(batchId);
   ```

2. **Batch Information:**
   ```javascript
   // Get batch details
   const manufacturer = await contract.getBatchManufacturer(batchId);
   const medicineHash = await contract.getBatchMedicineHash(batchId);
   const regTimestamp = await contract.getBatchRegistrationTimestamp(batchId);
   ```

## Deployment

### Local Development
```bash
cd Contracts
npm install
npm run compile
npm run deploy
```

### Sepolia Testnet
```bash
# Set environment variables
export SEPOLIA_URL="https://sepolia.infura.io/v3/YOUR_PROJECT_ID"
export PRIVATE_KEY="your_private_key"
export ETHERSCAN_API_KEY="your_etherscan_api_key"

# Deploy
npm run deploy:sepolia

# Verify on Etherscan
npm run verify -- <contract_address>
```

## Environment Variables

Add to backend `.env`:
```
CONTRACT_ADDRESS=0x... # Deployed contract address
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key # For backend transactions
```

## Role Constants

```javascript
const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
const DISTRIBUTOR_ROLE = ethers.keccak256(ethers.toUtf8Bytes("DISTRIBUTOR_ROLE"));
const RETAILER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"));
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
```

## Gas Optimization

- Uses custom errors instead of require strings
- Efficient storage patterns with structs
- View functions marked explicitly
- No string storage on-chain (only hashes)

## Security Considerations

- Admin-only role assignment
- Sequential handoff validation
- Address validation (no zero addresses)
- AccessControl for role-based permissions
- No upgradeable proxy (simplified for hackathon scope)

## Testing

Run the test suite:
```bash
npm test
```

## License

MIT License - see LICENSE file for details.
