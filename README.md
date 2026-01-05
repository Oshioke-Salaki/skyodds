# SkyOdds - Flight Prediction Market on Mantle

SkyOdds is a decentralized flight prediction market built on the Mantle network. It allows users to speculate on flight outcomes (e.g., delays, cancellations) using a transparent and trustless blockchain infrastructure.

## 🌟 Features

*   **Prediction Markets**: Create and participate in markets for flight status.
*   **Mantle Network**: Low fees and high speed transactions secured by Ethereum.
*   **Trustless**: Smart contract-based resolution.

## 🛠 Tech Stack

*   **Smart Contracts**:
    *   Solidity
    *   Foundry (Development Framework)
*   **Frontend**:
    *   Next.js (React Framework)
    *   TypeScript
    *   TailwindCSS (via standard Next.js setup)
    *   Wagmi / Viem (Ethereum interaction)

## 📋 Prerequisites

Ensure you have the following installed:

*   [Node.js](https://nodejs.org/) (v18 or later recommended)
*   [Foundry](https://getfoundry.sh/) (Forge, Cast, Anvil)
*   [Git](https://git-scm.com/)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Jemiiah/skyodds.git
cd skyodds
```

### 2. Smart Contracts

Navigate to the contract directory:

```bash
cd contract
```

**Build:**

```bash
forge build
```

**Test:**

```bash
forge test
```

**Local Deployment (Anvil):**

Start a local node:
```bash
anvil
```

Deploy scripts (adjust script path as needed):
```bash
forge script script/Counter.s.sol:CounterScript --rpc-url http://localhost:8545 --private-key <PRIVATE_KEY> --broadcast
```

### 3. Frontend

Navigate to the frontend directory:

```bash
cd frontend
```

**Install Dependencies:**

```bash
npm install
# or
# or
yarn install
```

**Environment Setup:**

Create a `.env` or `.env.local` file in the `frontend` directory with your Particle Network credentials:

```env
NEXT_PUBLIC_PROJECT_ID=your_project_id
NEXT_PUBLIC_CLIENT_KEY=your_client_key
NEXT_PUBLIC_APP_ID=your_app_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

**Run Development Server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📂 Project Structure

*   `contract/`: Solidity smart contracts and Foundry configuration.
*   `frontend/`: Next.js application for the user interface.

## 📜 License

[MIT](LICENSE)
