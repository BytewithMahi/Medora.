# 💊 MEDORA – AI & Blockchain-Based Medicine Supply Chain with Web3 Trading

Medora is an advanced, full-stack platform designed to revolutionize the pharmaceutical supply chain by combining AI, Blockchain, and Web3 technologies. It aims to eliminate counterfeit medicines and bring unprecedented transparency, security, and trust from production to consumption.

## 🌟 Core Concept

Medora creates a unified ecosystem connecting all stakeholders: Manufacturers, Distributors, Retailers, and Customers. Every medicine batch is meticulously tracked, verified, and secured, ensuring authenticity and transparency throughout its lifecycle.

## ✨ Key Features & Technological Realization

Medora integrates cutting-edge technologies to deliver a secure, transparent, and intelligent medicine supply chain. Here's how each core feature is realized:

*   **🔗 Blockchain-Based Supply Chain Traceability**
    *   **Description**: Each medicine batch is assigned a unique ID and QR code. All critical transactions—creation, transfer between stakeholders, and verification—are immutably stored on a blockchain ledger. This guarantees tamper-proof records, full traceability, and a transparent supply chain flow from manufacturer to customer.
    *   **Technology**: Smart contracts are deployed on the **Ethereum Sepolia** testnet, serving as the decentralized ledger for all batch transactions and ownership transfers.

*   **🧠 AI-Powered Verification & Fraud Detection**
    *   **Description**: Medora utilizes Artificial Intelligence to proactively detect counterfeit medicines and flag suspicious activities within the supply chain. This includes identifying duplicate scans, inconsistent data, and unusual patterns. It also identifies high-risk geographical locations for fake drugs and predicts future medicine demand.
    *   **Technology**: Leverages **Gemini AI** for advanced machine learning models, integrated seamlessly into the **Node.js** backend to analyze data, calculate authenticity scores, and provide demand predictions.

*   **✅ Multi-Level Authenticity Verification System**
    *   **Description**: Users can verify medicine authenticity by scanning a QR code or manually entering a batch ID. The system then prompts users to answer a series of 3 verification questions. The backend, combined with AI analysis, validates these responses, presenting a final authenticity result (Authentic / Suspicious / Fake) with a fraud score and risk level.
    *   **Technology**: The frontend (**React**) facilitates user interaction (QR scanning, question answering), while the **Node.js** backend processes requests, consults **Supabase (PostgreSQL)** for batch data, and communicates with the **Gemini AI** service for final validation.

*   **💬 End-to-End Encrypted Chat System**
    *   **Description**: Facilitates secure, real-time communication between authorized stakeholders (e.g., Distributor ↔ Retailer). This E2EE chat system ensures that only the sender and receiver can read messages, crucial for issue resolution, supply coordination, and sensitive discussions.
    *   **Technology**: Built using **Socket.io** for real-time messaging capabilities, with custom implementation of End-to-End Encryption to secure communications.

*   **💰 Medora Coin – Web3 Trading Platform**
    *   **Description**: Inspired by modern token platforms, Medora introduces "Medora Coin" and allows manufacturers to launch their own brand-specific ERC-20 tokens. These tokens represent brand trust and product authenticity. Customers and investors can view token details, assess their AI-based trust score, and securely trade tokens.
    *   **Technology**: Custom **ERC-20 smart contracts** are deployed on **Ethereum Sepolia**. The **React** frontend provides a secure marketplace interface for viewing and trading these blockchain-based tokens, interacting with the smart contracts via Web3 libraries.

*   **🚀 Serverless & Scalable Architecture**
    *   **Description**: Designed for high performance and scalability, Medora's backend is serverless-ready, ensuring efficient operation under varying loads.
    *   **Technology**: The backend is developed with **Node.js** and **Express.js**, utilizing **Supabase** (which includes a PostgreSQL database and serverless functions capabilities) for robust data management and scalable API endpoints.

*   **🛡️ Robust Security & Access Control**
    *   **Description**: The platform incorporates strong security measures, including JWT-based authentication for secure user sessions, role-based access control (RBAC) to manage permissions, secure APIs with input validation, and encrypted data storage.
    *   **Technology**: Implemented within the **Node.js** backend, securing all API endpoints and managing user authentication and authorization.

*   **🔄 Intuitive User Workflow**
    *   **Description**: Medora provides a clear and guided user flow: manufacturers register and get approval, create medicine batches with QR codes, supply chain updates are recorded at each stage, retailers verify products before selling, and customers scan QR codes for final authenticity verification. Optionally, manufacturers can launch tokens for users to invest.
    *   **Technology**: The user interface is developed with **React** and styled with **Tailwind CSS**, providing a responsive and intuitive experience across all stakeholder roles, connecting to all backend and blockchain services.

## 🏗️ Smart Contracts Architecture

Medora's blockchain layer is built with a highly decoupled, modular structure consisting of two core systems: **Supply Chain Traceability & Cryptographic Hash Chaining** and **Web3 Brand-Specific Trading (Medora Coin Marketplace)**.

### 1. 🔗 Supply Chain Traceability & Hash Chaining System

This subsystem records and cryptographically links supply chain events from the initial pharmaceutical batch synthesis to the end-consumer purchase.

*   **`MedoraCentral.sol` (The Core Hub)**
    *   **Role**: Serves as the central registry, validation engine, and single source of truth for the entire supply chain.
    *   **Features**:
        *   Maintains the canonical state of all medicine batches using a sequential hash-chaining structure.
        *   Supports Role-Based Access Control (RBAC) via OpenZeppelin's `AccessControl`.
        *   Enforces sequence verification (Producer ➔ Distributor ➔ Retailer ➔ Customer).
        *   Rejects unauthorized out-of-order handoffs.
        *   Exposes `verifyBatchAuthenticity` and `getBatchDetails` for instant authenticity auditing.
    *   **Key Functions**: `registerBatch`, `verifyDistributor`, `verifyRetailer`, `verifyCustomer`.

*   **`ProducerContract.sol`**
    *   **Role**: Handles batch initialization and primary registration on behalf of authenticated medicine producers/manufacturers.
    *   **Features**:
        *   Generates a unique `batchId` by hashing the batch number, manufacturer details, production date, and block timestamp.
        *   Creates the initial `medicineHash` by hashing the complete metadata (name, composition, expiry, etc.).
        *   Invokes `MedoraCentral` to register the new batch with the producer's cryptographic signature.
    *   **Key Functions**: `initializeBatch`, `getBatchMetadata`.

*   **`DistributorContract.sol`**
    *   **Role**: Manages intermediate verifications and receipt tracking for distributors.
    *   **Features**:
        *   Validates that the batch is legally registered and has not yet been accepted by another distributor.
        *   Applies a new cryptographic step to the hash chain: `hash(previousHash, distributorAddress)`.
        *   Invokes `verifyDistributor` on `MedoraCentral` to lock in the distributor handoff.

*   **`RetailerContract.sol`**
    *   **Role**: Registers pharmacy/retailer pre-sale validations.
    *   **Features**:
        *   Enforces that the distributor has already verified the batch.
        *   Constructs a new step in the hash chain: `hash(previousHash, retailerAddress)`.
        *   Invokes `verifyRetailer` on `MedoraCentral` to commit the retailer's sign-off.

*   **`CustomerContract.sol`**
    *   **Role**: Facilitates final end-user QR code scanning, purchase logging, and authenticity confirming.
    *   **Features**:
        *   Completes the final step in the cryptographic hash chain: `hash(previousHash, customerAddress)`.
        *   Validates customer QR code inputs and stores offline scan coordinates/logs on-chain.
        *   Tracks customer purchase histories on-chain, enabling patients to audit their own personal medicine cabinets.
    *   **Key Functions**: `scanAndVerifyMedicine`, `checkAuthenticity`, `getPurchaseHistory`.

*   **`MedoraSupplyChain.sol`**
    *   **Role**: Alternative standalone lightweight ledger contract for role assignment, batch registration, and linear supply transfers. Perfect for testing and baseline integrations.

---

### 2. 💰 Web3 Brand-Specific Trading & Tokenomics System

Medora lets pharmaceutical brands tokenize their reputation. Verified manufacturers can deploy brand-specific ERC-20 tokens that users can trade, purchase, or hold as a gauge of trust and AI-driven credibility scores.

*   **`ManufacturerRegistry.sol`**
    *   **Role**: Coordinates manufacturer approvals, token creation, and initial liquidity pooling.
    *   **Features**:
        *   Allows admins to register verified manufacturers.
        *   Utilizes deterministic deployment (`Create2`) to instantiate individual brand-specific ERC-20 contracts securely.
        *   Facilitates initial liquidity seeding by receiving manufacturer's ERC-20 allocations and corresponding ETH and routing them to the AMM pool.
    *   **Key Functions**: `registerManufacturer`, `createToken`, `seedLiquidity`.

*   **`ManufacturerToken.sol`**
    *   **Role**: Standard ERC-20 token contract deployed dynamically for each approved manufacturer (e.g., *Pfizer Coin*, *Moderna Token*).
    *   **Features**: Deploys with customized names, symbols, and total supply limits. Fully compliant with OpenZeppelin's ERC-20 specifications.

*   **`CentralMarketplace.sol` (The AMM Engine)**
    *   **Role**: The singleton hub holding liquidity reserves and serving as a decentralized exchange (DEX) and price oracle.
    *   **Features**:
        *   Maintains Uniswap v2-style constant product AMM pools ($x \cdot y = k$) for each brand-specific token.
        *   Provides precise on-chain spot pricing: $\text{Price} = \frac{\text{ethReserve}}{\text{tokenReserve}}$.
        *   Includes built-in slippage calculations and a standard 0.3% trading fee mechanism.
    *   **Key Functions**: `initializePool`, `updateReserves`, `registerToken`, `getSpotPrice`, `getAmountOut`.

*   **`UserMarketplace.sol`**
    *   **Role**: Front-facing trading contract for end-investors and retail users.
    *   **Features**:
        *   Handles buying/selling of brand tokens with custom slippage protection (`minAmountOut` / `minEthOut`).
        *   Logs every buy/sell trade securely.
        *   Tracks real-time user portfolios, total cost basis, and live Profit and Loss (P&L) calculations on-chain.
    *   **Key Functions**: `buyTokens`, `sellTokens`, `getUserPortfolio`, `calculatePnL`.

## ⚙️ Tech Stack

*   **Frontend**: React, Tailwind CSS
*   **Backend**: Node.js, Express.js
*   **Database**: Supabase (PostgreSQL)
*   **Blockchain**: Ethereum Sepolia (for smart contracts and token operations)
*   **Artificial Intelligence**: Gemini AI
*   **Real-time Communication**: Socket.io
*   **Authentication**: JWT (JSON Web Tokens)

## 🚀 Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js (LTS version recommended)
*   npm or yarn
*   Git
*   A Supabase project
*   A Gemini AI API key
*   An Ethereum wallet (e.g., MetaMask) configured for Sepolia testnet

### 1. Clone the repository

```bash
git clone https://github.com/your_username/medora.git
cd medora
```

### 2. Backend Setup

Navigate to the backend directory and install dependencies.

```bash
cd backend
npm install # or yarn install
```

Create a `.env` file in the `backend` directory and add your environment variables:

```
SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
GEMINI_API_KEY=YOUR_GEMINI_AI_API_KEY
JWT_SECRET=A_VERY_STRONG_RANDOM_SECRET_KEY # e.g., generated by 'node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"'
ETH_SEPOLIA_RPC_URL=YOUR_INFURA_OR_ALCHEMY_SEPOLIA_RPC_URL
PRIVATE_KEY=YOUR_WALLET_PRIVATE_KEY_FOR_CONTRACT_DEPLOYMENT # Use a test wallet for Sepolia
```

### 3. Frontend Setup

Navigate to the frontend directory and install dependencies.

```bash
cd ../frontend
npm install # or yarn install
```

Create a `.env` file in the `frontend` directory and add your environment variables:

```
REACT_APP_API_URL=http://localhost:5000/api # Or your deployed backend URL
REACT_APP_SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
REACT_APP_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
REACT_APP_WEB3_CONTRACT_ADDRESS=YOUR_DEPLOYED_SMART_CONTRACT_ADDRESS
REACT_APP_WEB3_RPC_URL=YOUR_INFURA_OR_ALCHEMY_SEPOLIA_RPC_URL
```

### 4. Smart Contract Deployment (Ethereum Sepolia)

Navigate to the `Contracts` folder, install requirements, compile, and execute the deployment:

1. **Install Dependencies & Compile Contracts**:
   ```bash
   cd Contracts
   npm install
   npm run compile
   ```

2. **Configure Environment Variables**:
   Create a `.env` file inside the `Contracts` directory:
   ```env
   SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   PRIVATE_KEY=YOUR_DEPLOYER_PRIVATE_KEY
   ETHERSCAN_API_KEY=YOUR_ETHERSCAN_API_KEY
   ```

3. **Deploy & Bind Roles**:
   ```bash
   npm run deploy:sepolia
   ```
   This script compiles and deploys `MedoraSupplyChain` (simple baseline), `MedoraCentral` (hub), and the corresponding roles contracts (`ProducerContract`, `DistributorContract`, `RetailerContract`, `CustomerContract`), automatically binding their respective permissions on-chain.

4. **Verify on Etherscan (Optional)**:
   ```bash
   npm run verify -- <contract_address>
   ```

5. **Update Application Configurations**:
   Set `REACT_APP_WEB3_CONTRACT_ADDRESS` in `frontend/.env` and `CONTRACT_ADDRESS` in `backend/.env` to the newly deployed `MedoraCentral` contract address.

### 5. Database Setup (Supabase)

*   Set up your tables in Supabase according to the project's schema (e.g., `users`, `medicines`, `batches`, `transactions`, `chats`).
*   Ensure RLS (Row Level Security) policies are correctly configured.

### 6. Run the Application

#### Start Backend

```bash
cd backend
npm start # or yarn start
```

#### Start Frontend

```bash
cd frontend
npm start # or yarn start
```

The frontend application will typically open in your browser at `http://localhost:3000`.

## 📖 Usage

Medora provides distinct interfaces and workflows for each stakeholder:

### 1. Manufacturer Portal
*   **Registration & Approval**: Manufacturers register and await approval by an administrator.
*   **Batch Creation**: Once approved, manufacturers can create new medicine batches, assigning unique IDs and generating QR codes.
*   **Token Launch (Optional)**: Manufacturers can launch their brand-specific ERC-20 tokens on the Web3 platform.

### 2. Distributor Interface
*   **Receive Batches**: Distributors record the receipt of batches from manufacturers.
*   **Transfer Batches**: They can then transfer batches to retailers, updating the blockchain ledger.
*   **Communicate**: Use the E2EE chat to coordinate with manufacturers and retailers.

### 3. Retailer Dashboard
*   **Receive Batches**: Retailers record the receipt of batches from distributors.
*   **Pre-Sale Verification**: Before selling, retailers can scan QR codes or enter batch IDs to perform an authenticity check using the multi-level verification system.
*   **Communicate**: Engage in secure chats with distributors for supply and issue resolution.

### 4. Customer Application
*   **Authenticity Verification**: Customers scan the QR code on medicine packaging or manually enter the batch ID.
*   **Verification Questions**: They answer 3 simple questions to aid the AI in verification.
*   **Result Display**: The app displays the authenticity result (Authentic / Suspicious / Fake), fraud score, and risk level.
*   **Web3 Investment**: Customers/Investors can browse the Medora Coin marketplace, view manufacturer tokens, and invest based on AI trust scores and brand credibility.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
