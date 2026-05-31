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

*   You will need to write and deploy the Medora smart contracts (e.g., for batch tracking and Medora Coin ERC-20 tokens) to the Ethereum Sepolia testnet.
*   Once deployed, update the `REACT_APP_WEB3_CONTRACT_ADDRESS` and `backend/.env` with your contract addresses.
*   This typically involves using Hardhat or Truffle. For example:
    ```bash
    # Assuming you have a `contracts` folder with your solidity files
    # and a deployment script.
    # cd contracts
    # npx hardhat compile
    # npx hardhat run scripts/deploy.js --network sepolia
    ```

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

Distributed under the MIT License. See `LICENSE` for more information.........
