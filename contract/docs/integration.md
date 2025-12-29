# SkyOdds Smart Contract Integration Guide

## Contract Addresses

**Mantle Testnet:**
- **SkyOdds Market:** `0x8B87E271FB390FE7db2CE154e49096f72f6BE507`
- **Mock USDC Token:** `0xFAEC032f2E8c85Da9d04b06947a6BdCf02Ad7a71`
- **Chain ID:** `5003`
- **RPC URL:** `https://rpc.testnet.mantle.xyz`
- **Block Explorer:** `https://explorer.testnet.mantle.xyz`

---

## Enums

### Outcome
- `0` = Unresolved
- `1` = OnTime
- `2` = Delayed30 (30-120 minutes delay)
- `3` = Delayed120Plus (120+ minutes delay)
- `4` = Cancelled

### Position
- `0` = YES (betting the outcome WILL happen)
- `1` = NO (betting the outcome will NOT happen)

---

## Read Functions

### **getFlightInfo**
Get details about a specific flight market.

**Arguments:**
- `flightId` (bytes32) - Unique identifier for the flight

**Returns:**
- `flightNumber` (string) - Flight code (e.g., "AA100")
- `departureCode` (string) - Departure airport (e.g., "JFK")
- `destinationCode` (string) - Destination airport (e.g., "LAX")
- `scheduledDeparture` (uint256) - Departure time (Unix timestamp)
- `marketCloseTime` (uint256) - Betting closes (Unix timestamp, 30 mins before departure)
- `outcome` (uint8) - Resolved outcome (0-4, see Outcome enum)
- `isCancelled` (bool) - Whether market was admin-cancelled

**Use Case:** Display flight details on market card

---

### **getAllPrices**
Get current probability prices for all outcomes.

**Arguments:**
- `flightId` (bytes32)

**Returns:**
- `onTimePrice` (uint256) - Price in wei (divide by 1e18 to get 0-1, multiply by 100 for percentage)
- `delayed30Price` (uint256)
- `delayed120PlusPrice` (uint256)
- `cancelledPrice` (uint256)

**Example:** If `onTimePrice = 250000000000000000`, that's 0.25 or 25%

**Use Case:** Show current odds for each outcome

---

### **getPrice**
Get price for a specific outcome.

**Arguments:**
- `flightId` (bytes32)
- `outcome` (uint8) - 1-4 (see Outcome enum)

**Returns:**
- `price` (uint256) - Price in wei (1e18 = 100%)

**Use Case:** Show individual outcome probability

---

### **getUserPosition**
Get user's position in a market.

**Arguments:**
- `flightId` (bytes32)
- `user` (address) - User's wallet address
- `outcome` (uint8) - Which outcome to check (1-4)

**Returns:**
- `yesShares` (uint256) - Number of YES shares user holds
- `noShares` (uint256) - Number of NO shares user holds
- `totalCost` (uint256) - Total amount user has bet (in USDC, 6 decimals)

**Use Case:** Show user's active positions

---

### **getMarketShares**
Get total shares in the market for all outcomes.

**Arguments:**
- `flightId` (bytes32)

**Returns:**
- `onTimeShares` (uint256)
- `delayed30Shares` (uint256)
- `delayed120PlusShares` (uint256)
- `cancelledShares` (uint256)

**Use Case:** Show market depth/liquidity

---

### **getAllFlightIds**
Get list of all flight market IDs.

**Arguments:** None

**Returns:**
- Array of `bytes32` flight IDs

**Use Case:** List all available markets

---

### **calculateSharesForCost**
Preview how many shares user will get for a bet amount.

**Arguments:**
- `flightId` (bytes32)
- `outcome` (uint8) - 1-4
- `position` (uint8) - 0=YES, 1=NO
- `cost` (uint256) - Amount in USDC (6 decimals, e.g., 100000000 = 100 USDC)

**Returns:**
- `shares` (uint256) - Number of shares user will receive

**Use Case:** Show preview before user places bet

---

### **hasClaimed**
Check if user has already claimed winnings.

**Arguments:**
- `flightId` (bytes32)
- `user` (address)

**Returns:**
- `claimed` (bool)

**Use Case:** Show/hide claim button

---

### **totalPoolAmount**
Get total USDC in the market pool.

**Arguments:**
- `flightId` (bytes32)

**Returns:**
- `amount` (uint256) - Total pool in USDC (6 decimals)

**Use Case:** Show total market volume

---

### **totalCostByOutcome**
Get total amount bet on a specific outcome.

**Arguments:**
- `flightId` (bytes32)
- `outcome` (uint8) - 1-4

**Returns:**
- `totalCost` (uint256) - Total USDC bet on this outcome

**Use Case:** Show distribution of bets

---

### **totalFeesCollected**
Get total fees collected from all claims.

**Arguments:** None

**Returns:**
- `fees` (uint256) - Total fees in USDC (6 decimals)

**Use Case:** Display protocol revenue

---

### **totalFeesWithdrawn**
Get total fees already withdrawn by owner.

**Arguments:** None

**Returns:**
- `withdrawn` (uint256) - Total withdrawn in USDC (6 decimals)

**Use Case:** Track fee withdrawals

---

### **hasRole**
Check if an address has a specific role.

**Arguments:**
- `role` (bytes32) - Role identifier (e.g., `keccak256("ADMIN_ROLE")`)
- `account` (address) - Address to check

**Returns:**
- `hasRole` (bool)

**Use Case:** Check admin permissions

---

## Write Functions

### **placeBet**
User Places a Bet.

**Arguments:**
- `flightId` (bytes32)
- `outcome` (uint8) - 1-4
- `position` (uint8) - 0=YES, 1=NO
- `cost` (uint256) - Bet amount in USDC (6 decimals)

**Prerequisites:**
- Must approve USDC tokens to SkyOdds contract
- Market must be active (before close time)

**Use Case:** Execute the bet and transfer USDC

---

### **claimWinnings**
Claim your winnings after market resolves.

**Arguments:**
- `flightId` (bytes32)

**Prerequisites:**
- Market must be resolved
- User must have winning position
- User hasn't claimed yet

**Returns:** Sends USDC payout to user's wallet

**Use Case:** Collect winnings after flight resolves

---

### **withdrawFromCancelledMarket**
Get refund if admin cancels market.

**Arguments:**
- `flightId` (bytes32)

**Prerequisites:**
- Market must be cancelled
- User must have bet

**Returns:** Full refund of user's bet

**Use Case:** Emergency refund scenario

---

## Token Functions (Mock USDC Contract)

### **faucet**
Get test USDC tokens (testnet only).

**Arguments:**
- `amount` (uint256) - Amount to mint (6 decimals, e.g., 1000000000 = 1000 USDC)

**Use Case:** Get test tokens for betting

---

### **approve**
Approve SkyOdds contract to spend your USDC.

**Arguments:**
- `spender` (address) - SkyOdds contract address
- `amount` (uint256) - Amount to approve (6 decimals)

**Prerequisites:** Must be called BEFORE `placeBet`

**Use Case:** Required before placing any bet

---

### **balanceOf**
Check USDC balance.

**Arguments:**
- `account` (address) - Wallet to check

**Returns:**
- `balance` (uint256) - USDC balance (6 decimals)

**Use Case:** Show user's available balance

---

## Admin Functions

### **createFlightMarket**
Create a new flight market (Admin role required).

**Arguments:**
- `flightNumber` (string) - e.g., "AA100"
- `departureCode` (string) - e.g., "JFK"
- `destinationCode` (string) - e.g., "LAX"
- `airlineCode` (string) - e.g., "AA"
- `scheduledDeparture` (uint256) - Unix timestamp
- `liquidityParameter` (uint256) - LMSR parameter (use 0 for default 100 USDC)

**Prerequisites:**
- Caller must have ADMIN_ROLE

**Returns:**
- `flightId` (bytes32) - Unique market ID

---

### **resolveMarket**
Resolve a market with the actual flight outcome (Oracle only).

**Arguments:**
- `flightId` (bytes32)
- `actualOutcome` (uint8) - 1-4 (see Outcome enum)

**Prerequisites:**
- Market close time must have passed
- Only oracle resolver can call

---

### **cancelMarket**
Cancel a market (Admin role required).

**Arguments:**
- `flightId` (bytes32)
- `reason` (string) - Explanation for cancellation

**Prerequisites:**
- Caller must have ADMIN_ROLE

**Effect:** Users can call `withdrawFromCancelledMarket` for full refund

---

### **withdrawFees**
Withdraw collected fees (Default admin role required).

**Arguments:**
- `to` (address) - Recipient address for fees

**Prerequisites:**
- Caller must have DEFAULT_ADMIN_ROLE
- Fees must be available

**Use Case:** Withdraw protocol revenue

---

### **grantRole**
Grant a role to an address (Default admin only).

**Arguments:**
- `role` (bytes32) - Role to grant (e.g., `keccak256("ADMIN_ROLE")`)
- `account` (address) - Address to grant role to

**Prerequisites:**
- Caller must have DEFAULT_ADMIN_ROLE

**Use Case:** Add new admins

---

### **revokeRole**
Revoke a role from an address (Default admin only).

**Arguments:**
- `role` (bytes32) - Role to revoke
- `account` (address) - Address to revoke role from

**Prerequisites:**
- Caller must have DEFAULT_ADMIN_ROLE

**Use Case:** Remove admin access

---

### **setOracleResolver**
Update oracle resolver address (Default admin only).

**Arguments:**
- `newResolver` (address) - New oracle address

**Prerequisites:**
- Caller must have DEFAULT_ADMIN_ROLE

---

### **pause / unpause**
Pause or unpause the contract (Default admin only).

**Arguments:** None

**Prerequisites:**
- Caller must have DEFAULT_ADMIN_ROLE

**Use Case:** Emergency pause

---

## Common Workflows

### **User Places a Bet**
1. Check market is active
2. Check current prices
3. Preview shares: `calculateSharesForCost(...)`
4. Call `token.approve(skyoddsAddress, cost)`
5. Call `placeBet(flightId, outcome, position, cost)`

### **User Checks Position**
1. Call `getUserPosition(flightId, userAddress, outcome)` for each outcome
2. Show total cost and shares

### **User Claims Winnings**
1. Check market is resolved: `getFlightInfo(flightId)` - verify `outcome != 0`
2. Check user hasn't claimed: `hasClaimed(flightId, userAddress)`
3. Calculate if user won (compare their positions to resolved outcome)
4. If won, show "Claim" button
5. Call `claimWinnings(flightId)`

### **Display Market List**
1. Call `getAllFlightIds()`
2. For each ID, call `getFlightInfo(flightId)`
3. Call `getAllPrices(flightId)` to show odds
4. Filter by status (active, resolved, cancelled)

### **Admin Adds New Admin**
1. Owner calls `grantRole(keccak256("ADMIN_ROLE"), newAdminAddress)`
2. New admin can now create and cancel markets

### **Admin Withdraws Fees**
1. Check available fees: `totalFeesCollected() - totalFeesWithdrawn()`
2. Call `withdrawFees(recipientAddress)`
3. Fees transferred to recipient

---

## Important Notes

### USDC Decimals
USDC uses **6 decimals**:
- 1 USDC = `1000000` (1e6)
- 100 USDC = `100000000` (100e6)
- Always multiply display amounts by 1e6 when sending to contract

### Price Format
Prices use **18 decimals** (wei):
- 100% = `1000000000000000000` (1e18)
- 25% = `250000000000000000` (0.25e18)
- Divide by 1e18 to get decimal (0-1), multiply by 100 for percentage

### Shares
Shares are large numbers (millions):
- Example: `206250000` shares
- These are used internally for LMSR calculations
- Users don't need to see raw share numbers - show them odds and payouts instead

### Time Windows
- **Market Close:** 30 minutes before scheduled departure
- **No betting** after market close time

### Fee Structure
- **Platform Fee:** 2% of total pool
- Deducted from prize pool before distribution
- Winners split remaining 98% proportionally by cost
- Fees accumulate in contract and can be withdrawn by admin

### Access Control
- **DEFAULT_ADMIN_ROLE:** Full control (owner) - can manage roles, withdraw fees, pause contract
- **ADMIN_ROLE:** Can create and cancel markets
- Use `hasRole(role, address)` to check permissions

---

## Events to Listen For

### MarketCreated
Emitted when new market is created.
**Fields:** `flightId`, `flightNumber`, `scheduledDeparture`, `marketCloseTime`, `liquidityParameter`

### SharesPurchased
Emitted when user places bet.
**Fields:** `flightId`, `user`, `outcome`, `position`, `shares`, `cost`

### MarketResolved
Emitted when market resolves.
**Fields:** `flightId`, `outcome`, `timestamp`

### WinningsClaimed
Emitted when user claims payout.
**Fields:** `flightId`, `user`, `payout`, `fee`

### FeesWithdrawn
Emitted when admin withdraws fees.
**Fields:** `to`, `amount`