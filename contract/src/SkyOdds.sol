// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import {SD59x18, sd, intoInt256, convert, exp, ln, add, sub, mul, div} from "@prb/math/SD59x18.sol";

/**
 * @title SkyOdds
 * @notice Decentralized prediction market for flight delays with LMSR AMM
 * @dev Hybrid model: LMSR shares for dynamic pricing, cost-based payouts for fair distribution
 */
contract SkyOdds is Ownable, ReentrancyGuard, Pausable, AccessControl {
    // ============ Libraries ============

    int256 constant PRECISION = 1e18;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // ============ Enums ============

    enum Outcome {
        Unresolved,
        OnTime,
        Delayed30,
        Delayed120Plus,
        Cancelled
    }

    enum Position {
        YES,
        NO
    }

    // ============ Structs ============

    struct Flight {
        string flightNumber;
        string departureCode;
        string destinationCode;
        string airlineCode;
        uint256 scheduledDeparture;
        uint256 marketCloseTime;
        Outcome outcome;
        bool isCancelled;
        bool exists;
        uint256 onTimeShares;
        uint256 delayed30Shares;
        uint256 delayed120PlusShares;
        uint256 cancelledShares;
        uint256 liquidityParameter;
    }

    struct UserPosition {
        mapping(Outcome => uint256) yesShares;
        mapping(Outcome => uint256) noShares;
        uint256 totalCost;
    }

    // ============ State Variables ============

    IERC20 public immutable USDCToken;
    address public oracleResolver;

    uint256 public constant PLATFORM_FEE = 200; // 2% in basis points
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant DEFAULT_LIQUIDITY_PARAM = 100e6; // 100 USDC (6 decimals)
    uint256 public constant MARKET_CLOSE_BUFFER = 30 minutes;

    mapping(bytes32 => Flight) public flights;
    mapping(bytes32 => mapping(address => UserPosition)) private positions;
    mapping(bytes32 => mapping(address => bool)) public hasClaimed;
    mapping(bytes32 => uint256) public totalDeposited;
    mapping(bytes32 => uint256) public totalPoolAmount;

    uint256 public totalFeesCollected; // Total fees ever collected
    uint256 public totalFeesWithdrawn; // Total fees withdrawn by owner

    // Track total cost bet on each outcome (for cost-based payouts)
    mapping(bytes32 => mapping(Outcome => uint256)) public totalCostByOutcome;

    bytes32[] public flightIds;

    // ============ Events ============

    event MarketCreated(
        bytes32 indexed flightId,
        string flightNumber,
        uint256 scheduledDeparture,
        uint256 marketCloseTime,
        uint256 liquidityParameter
    );

    event SharesPurchased(
        bytes32 indexed flightId, address indexed user, Outcome outcome, Position position, uint256 shares, uint256 cost
    );

    event SharesUpdated(
        bytes32 indexed flightId,
        uint256 onTimeShares,
        uint256 delayed30Shares,
        uint256 delayed120PlusShares,
        uint256 cancelledShares
    );

    event MarketResolved(bytes32 indexed flightId, Outcome outcome, uint256 timestamp);

    event WinningsClaimed(bytes32 indexed flightId, address indexed user, uint256 payout, uint256 fee);

    event MarketCancelled(bytes32 indexed flightId, string reason);

    event EmergencyWithdrawal(bytes32 indexed flightId, address indexed user, uint256 amount);

    event OracleResolverUpdated(address indexed oldResolver, address indexed newResolver);

    event FeesWithdrawn(address indexed to, uint256 amount);

    // ============ Modifiers ============

    modifier marketExists(bytes32 flightId) {
        require(flights[flightId].exists, "Market does not exist");
        _;
    }

    modifier marketActive(bytes32 flightId) {
        _marketActive(flightId);
        _;
    }

    function _marketActive(bytes32 flightId) internal view {
        require(flights[flightId].exists, "Market does not exist");
        require(!flights[flightId].isCancelled, "Market is cancelled");
        require(flights[flightId].outcome == Outcome.Unresolved, "Market already resolved");
        require(block.timestamp < flights[flightId].marketCloseTime, "Market is closed");
    }

    modifier onlyOracleResolver() {
        require(msg.sender == oracleResolver, "Only oracle resolver");
        _;
    }

    // ============ Constructor ============

    constructor(address _USDCToken, address _oracleResolver) Ownable(msg.sender) {
        require(_USDCToken != address(0), "Invalid token address");
        require(_oracleResolver != address(0), "Invalid oracle address");

        USDCToken = IERC20(_USDCToken);
        oracleResolver = _oracleResolver;

        // Grant deployer admin role
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
    }

    // ============ Core Functions ============

    function createFlightMarket(
        string memory flightNumber,
        string memory departureCode,
        string memory destinationCode,
        string memory airlineCode,
        uint256 scheduledDeparture,
        uint256 liquidityParameter
    ) external onlyRole(ADMIN_ROLE) whenNotPaused returns (bytes32) {
        require(scheduledDeparture > block.timestamp, "Departure must be in future");
        require(bytes(flightNumber).length > 0, "Invalid flight number");

        bytes32 flightId = keccak256(abi.encode(flightNumber, departureCode, destinationCode, scheduledDeparture));
        require(!flights[flightId].exists, "Market already exists");

        uint256 marketCloseTime = scheduledDeparture - MARKET_CLOSE_BUFFER;
        require(marketCloseTime > block.timestamp, "Market would close immediately");

        if (liquidityParameter == 0) {
            liquidityParameter = DEFAULT_LIQUIDITY_PARAM;
        }

        // Start with 0 shares - cleanest approach, no phantom shares
        flights[flightId] = Flight({
            flightNumber: flightNumber,
            departureCode: departureCode,
            destinationCode: destinationCode,
            airlineCode: airlineCode,
            scheduledDeparture: scheduledDeparture,
            marketCloseTime: marketCloseTime,
            outcome: Outcome.Unresolved,
            isCancelled: false,
            exists: true,
            onTimeShares: 0,
            delayed30Shares: 0,
            delayed120PlusShares: 0,
            cancelledShares: 0,
            liquidityParameter: liquidityParameter
        });

        flightIds.push(flightId);

        emit MarketCreated(flightId, flightNumber, scheduledDeparture, marketCloseTime, liquidityParameter);

        return flightId;
    }

    function placeBet(bytes32 flightId, Outcome outcome, Position position, uint256 cost)
        external
        marketActive(flightId)
        whenNotPaused
        nonReentrant
    {
        require(outcome != Outcome.Unresolved, "Invalid outcome");
        require(cost > 0, "Cost must be > 0");

        Flight storage flight = flights[flightId];

        // Check max bet size (10x liquidity parameter)
        uint256 maxBet = flight.liquidityParameter * 10;
        require(cost <= maxBet, "Bet too large for market");

        uint256 shares = calculateSharesForCost(flightId, outcome, position, cost);
        require(shares > 0, "Shares too small");

        require(USDCToken.transferFrom(msg.sender, address(this), cost), "Transfer failed");

        // Update market shares (used for pricing)
        if (position == Position.YES) {
            _updateOutcomeShares(flight, outcome, _getOutcomeShares(flight, outcome) + shares);
        } else {
            // NO: add shares to all OTHER outcomes
            if (outcome != Outcome.OnTime) flight.onTimeShares += shares;
            if (outcome != Outcome.Delayed30) flight.delayed30Shares += shares;
            if (outcome != Outcome.Delayed120Plus) flight.delayed120PlusShares += shares;
            if (outcome != Outcome.Cancelled) flight.cancelledShares += shares;
        }

        // Update user position
        UserPosition storage userPos = positions[flightId][msg.sender];
        if (position == Position.YES) {
            userPos.yesShares[outcome] += shares;
        } else {
            userPos.noShares[outcome] += shares;
        }
        userPos.totalCost += cost;

        // Track total cost by outcome (for cost-based payouts)
        if (position == Position.YES) {
            totalCostByOutcome[flightId][outcome] += cost;
        } else {
            // NO position: add cost to ALL other outcomes
            Outcome[4] memory allOutcomes =
                [Outcome.OnTime, Outcome.Delayed30, Outcome.Delayed120Plus, Outcome.Cancelled];
            for (uint256 i = 0; i < 4; i++) {
                if (allOutcomes[i] != outcome) {
                    totalCostByOutcome[flightId][allOutcomes[i]] += cost;
                }
            }
        }

        totalDeposited[flightId] += cost;
        totalPoolAmount[flightId] += cost;

        emit SharesPurchased(flightId, msg.sender, outcome, position, shares, cost);
        emit SharesUpdated(
            flightId, flight.onTimeShares, flight.delayed30Shares, flight.delayed120PlusShares, flight.cancelledShares
        );
    }

    /**
     * @notice Calculate shares for cost using LMSR with PRBMath
     * @dev Shares are used for PRICING only, not for payouts
     */
    function calculateSharesForCost(bytes32 flightId, Outcome outcome, Position position, uint256 cost)
        public
        view
        returns (uint256)
    {
        Flight storage flight = flights[flightId];

        uint256 q1 = flight.onTimeShares;
        uint256 q2 = flight.delayed30Shares;
        uint256 q3 = flight.delayed120PlusShares;
        uint256 q4 = flight.cancelledShares;
        uint256 b = flight.liquidityParameter;

        require(b > 0, "Invalid liquidity");

        int256 currentCost = _calculateLMSRCost(b, q1, q2, q3, q4);
        int256 targetCost = currentCost + int256(cost);

        if (position == Position.YES) {
            return _findSharesForTargetCost(flightId, outcome, targetCost, true);
        } else {
            return _findSharesForTargetCost(flightId, outcome, targetCost, false);
        }
    }

    /**
     * @notice Get price using PRBMath for numerical stability
     * @dev Prices are based on LMSR shares, not costs
     */
    function getPrice(bytes32 flightId, Outcome outcome) public view returns (uint256) {
        Flight storage flight = flights[flightId];

        if (outcome == Outcome.Unresolved) return 0;

        uint256 b = flight.liquidityParameter;
        uint256 q1 = flight.onTimeShares;
        uint256 q2 = flight.delayed30Shares;
        uint256 q3 = flight.delayed120PlusShares;
        uint256 q4 = flight.cancelledShares;

        // Empty market: return uniform 25% for each outcome
        if (q1 + q2 + q3 + q4 == 0) {
            return 25e16; // 0.25
        }

        // Add epsilon for calculation stability
        if (q1 == 0) q1 = 1;
        if (q2 == 0) q2 = 1;
        if (q3 == 0) q3 = 1;
        if (q4 == 0) q4 = 1;

        uint256 targetShares = _getOutcomeShares(flight, outcome);
        if (targetShares == 0) targetShares = 1;

        // Convert to SD59x18 and calculate exp(q/b)
        SD59x18 exponent = sd(int256(targetShares * 1e18 / b));
        SD59x18 expTarget = exp(exponent);

        // Calculate sum of all exponentials
        SD59x18 exp1 = exp(sd(int256(q1 * 1e18 / b)));
        SD59x18 exp2 = exp(sd(int256(q2 * 1e18 / b)));
        SD59x18 exp3 = exp(sd(int256(q3 * 1e18 / b)));
        SD59x18 exp4 = exp(sd(int256(q4 * 1e18 / b)));

        SD59x18 expSum = add(add(add(exp1, exp2), exp3), exp4);

        // Price = expTarget / expSum
        SD59x18 price = div(expTarget, expSum);

        return uint256(price.intoInt256());
    }

    function resolveMarket(bytes32 flightId, Outcome actualOutcome) external onlyOracleResolver marketExists(flightId) {
        Flight storage flight = flights[flightId];
        require(flight.outcome == Outcome.Unresolved, "Already resolved");
        require(!flight.isCancelled, "Market is cancelled");
        require(actualOutcome != Outcome.Unresolved, "Invalid outcome");
        require(block.timestamp >= flight.marketCloseTime, "Market not closed yet");

        flight.outcome = actualOutcome;

        emit MarketResolved(flightId, actualOutcome, block.timestamp);
    }

    /**
     * @notice Claim winnings using COST-BASED payout (hybrid model)
     * @dev Shares are used for pricing, cost determines payout split
     */
    function claimWinnings(bytes32 flightId) external nonReentrant marketExists(flightId) {
        Flight storage flight = flights[flightId];
        require(flight.outcome != Outcome.Unresolved, "Market not resolved");
        require(!hasClaimed[flightId][msg.sender], "Already claimed");

        UserPosition storage userPos = positions[flightId][msg.sender];
        require(userPos.totalCost > 0, "No position");

        // Check if user won
        bool hasWon = _didUserWin(flightId, msg.sender, flight.outcome);
        require(hasWon, "No winnings");

        // Calculate total cost of ALL winners in this market
        uint256 totalWinningCost = totalCostByOutcome[flightId][flight.outcome];
        require(totalWinningCost > 0, "No winning cost");

        // Calculate prize pool (total pool minus 2% platform fee)
        uint256 totalPool = totalPoolAmount[flightId];
        uint256 platformFee = (totalPool * PLATFORM_FEE) / BASIS_POINTS;
        uint256 prizePool = totalPool - platformFee;

        // User gets proportional share based on their COST, not shares
        uint256 payout = (userPos.totalCost * prizePool) / totalWinningCost;

        // Calculate user's proportional fee contribution
        uint256 userFeeShare = (userPos.totalCost * platformFee) / totalWinningCost;

        hasClaimed[flightId][msg.sender] = true;

        // Transfer payout to user
        require(USDCToken.transfer(msg.sender, payout), "Transfer failed");

        // track fees
        totalFeesCollected += userFeeShare;

        emit WinningsClaimed(flightId, msg.sender, payout, userFeeShare);
    }

    function cancelMarket(bytes32 flightId, string memory reason) external onlyRole(ADMIN_ROLE) marketExists(flightId) {
        Flight storage flight = flights[flightId];
        require(flight.outcome == Outcome.Unresolved, "Already resolved");
        require(!flight.isCancelled, "Already cancelled");

        flight.isCancelled = true;

        emit MarketCancelled(flightId, reason);
    }

    function withdrawFromCancelledMarket(bytes32 flightId) external nonReentrant marketExists(flightId) {
        Flight storage flight = flights[flightId];
        require(flight.isCancelled, "Market not cancelled");
        require(!hasClaimed[flightId][msg.sender], "Already withdrawn");

        UserPosition storage userPos = positions[flightId][msg.sender];
        require(userPos.totalCost > 0, "No position");

        uint256 refund = userPos.totalCost;
        hasClaimed[flightId][msg.sender] = true;

        require(USDCToken.transfer(msg.sender, refund), "Refund failed");

        emit EmergencyWithdrawal(flightId, msg.sender, refund);
    }

    function emergencyWithdraw(bytes32 flightId) external nonReentrant whenPaused {
        require(!hasClaimed[flightId][msg.sender], "Already withdrawn");

        UserPosition storage userPos = positions[flightId][msg.sender];
        require(userPos.totalCost > 0, "No position");

        uint256 refund = userPos.totalCost;
        hasClaimed[flightId][msg.sender] = true;

        require(USDCToken.transfer(msg.sender, refund), "Emergency withdraw failed");

        emit EmergencyWithdrawal(flightId, msg.sender, refund);
    }

    // ============ Admin Functions ============

    function setOracleResolver(address _newResolver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newResolver != address(0), "Invalid address");
        address oldResolver = oracleResolver;
        oracleResolver = _newResolver;
        emit OracleResolverUpdated(oldResolver, _newResolver);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function withdrawFees(address to) external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 availableFees = totalFeesCollected - totalFeesWithdrawn;
        require(availableFees > 0, "No fees to withdraw");

        totalFeesWithdrawn += availableFees;
        require(USDCToken.transfer(to, availableFees), "Transfer failed");

        emit FeesWithdrawn(to, availableFees);
    }

    // ============ View Functions ============

    function getFlightInfo(bytes32 flightId)
        external
        view
        returns (
            string memory flightNumber,
            string memory departureCode,
            string memory destinationCode,
            uint256 scheduledDeparture,
            uint256 marketCloseTime,
            Outcome outcome,
            bool isCancelled
        )
    {
        Flight storage flight = flights[flightId];
        return (
            flight.flightNumber,
            flight.departureCode,
            flight.destinationCode,
            flight.scheduledDeparture,
            flight.marketCloseTime,
            flight.outcome,
            flight.isCancelled
        );
    }

    function getUserPosition(bytes32 flightId, address user, Outcome outcome)
        external
        view
        returns (uint256 yesShares, uint256 noShares, uint256 totalCost)
    {
        UserPosition storage userPos = positions[flightId][user];
        return (userPos.yesShares[outcome], userPos.noShares[outcome], userPos.totalCost);
    }

    function getAllFlightIds() external view returns (bytes32[] memory) {
        return flightIds;
    }

    function getMarketShares(bytes32 flightId)
        external
        view
        returns (uint256 onTimeShares, uint256 delayed30Shares, uint256 delayed120PlusShares, uint256 cancelledShares)
    {
        Flight storage flight = flights[flightId];
        return (flight.onTimeShares, flight.delayed30Shares, flight.delayed120PlusShares, flight.cancelledShares);
    }

    function getAllPrices(bytes32 flightId)
        external
        view
        returns (uint256 onTimePrice, uint256 delayed30Price, uint256 delayed120PlusPrice, uint256 cancelledPrice)
    {
        return (
            getPrice(flightId, Outcome.OnTime),
            getPrice(flightId, Outcome.Delayed30),
            getPrice(flightId, Outcome.Delayed120Plus),
            getPrice(flightId, Outcome.Cancelled)
        );
    }

    // ============ Internal Functions ============

    function _getOutcomeShares(Flight storage flight, Outcome outcome) internal view returns (uint256) {
        if (outcome == Outcome.OnTime) return flight.onTimeShares;
        if (outcome == Outcome.Delayed30) return flight.delayed30Shares;
        if (outcome == Outcome.Delayed120Plus) return flight.delayed120PlusShares;
        if (outcome == Outcome.Cancelled) return flight.cancelledShares;
        return 0;
    }

    function _updateOutcomeShares(Flight storage flight, Outcome outcome, uint256 newAmount) internal {
        if (outcome == Outcome.OnTime) flight.onTimeShares = newAmount;
        else if (outcome == Outcome.Delayed30) flight.delayed30Shares = newAmount;
        else if (outcome == Outcome.Delayed120Plus) flight.delayed120PlusShares = newAmount;
        else if (outcome == Outcome.Cancelled) flight.cancelledShares = newAmount;
    }

    /**
     * @notice Check if user won based on the resolved outcome
     */
    function _didUserWin(bytes32 flightId, address user, Outcome winningOutcome) internal view returns (bool) {
        UserPosition storage userPos = positions[flightId][user];

        // Check if user has YES shares on winning outcome
        if (userPos.yesShares[winningOutcome] > 0) {
            return true;
        }

        // Check if user has NO shares on any losing outcome
        Outcome[4] memory allOutcomes = [Outcome.OnTime, Outcome.Delayed30, Outcome.Delayed120Plus, Outcome.Cancelled];

        for (uint256 i = 0; i < 4; i++) {
            if (allOutcomes[i] != winningOutcome) {
                if (userPos.noShares[allOutcomes[i]] > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * @notice Calculate LMSR cost using PRBMath: C(q) = b * ln(Σ e^(q_i/b))
     */
    function _calculateLMSRCost(uint256 b, uint256 q1, uint256 q2, uint256 q3, uint256 q4)
        internal
        pure
        returns (int256)
    {
        // Safety: Add epsilon to prevent ln(0) and division by zero
        if (q1 == 0) q1 = 1;
        if (q2 == 0) q2 = 1;
        if (q3 == 0) q3 = 1;
        if (q4 == 0) q4 = 1;

        // Calculate e^(q_i/b) using PRBMath
        SD59x18 exp1 = exp(sd(int256(q1 * 1e18 / b)));
        SD59x18 exp2 = exp(sd(int256(q2 * 1e18 / b)));
        SD59x18 exp3 = exp(sd(int256(q3 * 1e18 / b)));
        SD59x18 exp4 = exp(sd(int256(q4 * 1e18 / b)));

        // Sum exponentials
        SD59x18 sumExp = add(add(add(exp1, exp2), exp3), exp4);

        // b * ln(sum)
        SD59x18 lnSum = ln(sumExp);
        SD59x18 result = mul(sd(int256(b)), lnSum);

        return result.intoInt256();
    }

    /**
     * @notice Binary search to find shares for target cost
     */
    function _findSharesForTargetCost(bytes32 flightId, Outcome outcome, int256 targetCost, bool isYes)
        internal
        view
        returns (uint256)
    {
        Flight storage flight = flights[flightId];
        uint256 b = flight.liquidityParameter;

        int256 currentCost = _calculateLMSRCost(
            b, flight.onTimeShares, flight.delayed30Shares, flight.delayed120PlusShares, flight.cancelledShares
        );

        require(targetCost > currentCost, "Target must exceed current");

        uint256 costDiff = uint256(targetCost - currentCost);
        uint256 low = 0;
        uint256 high = costDiff * 4;

        if (high < 1e6) {
            high = 1e6;
        }

        uint256 mid = 1;

        for (uint256 i = 0; i < 40; i++) {
            mid = (low + high) / 2;

            if (mid == 0) {
                mid = 1;
                break;
            }

            (uint256 newQ1, uint256 newQ2, uint256 newQ3, uint256 newQ4) =
                _calculateNewShares(flight, outcome, mid, isYes);

            int256 newCost = _calculateLMSRCost(b, newQ1, newQ2, newQ3, newQ4);

            int256 tolerance = int256(costDiff / 100);
            if (tolerance < int256(b / 100)) tolerance = int256(b / 100);

            if (newCost >= targetCost - tolerance && newCost <= targetCost + tolerance) {
                break;
            }

            if (newCost < targetCost) {
                low = mid;
            } else {
                high = mid;
            }

            if (high <= low + 1) break;
        }

        return mid;
    }

    function _calculateNewShares(Flight storage flight, Outcome outcome, uint256 sharesToAdd, bool isYes)
        internal
        view
        returns (uint256, uint256, uint256, uint256)
    {
        uint256 newQ1 = flight.onTimeShares;
        uint256 newQ2 = flight.delayed30Shares;
        uint256 newQ3 = flight.delayed120PlusShares;
        uint256 newQ4 = flight.cancelledShares;

        if (isYes) {
            if (outcome == Outcome.OnTime) newQ1 += sharesToAdd;
            else if (outcome == Outcome.Delayed30) newQ2 += sharesToAdd;
            else if (outcome == Outcome.Delayed120Plus) newQ3 += sharesToAdd;
            else if (outcome == Outcome.Cancelled) newQ4 += sharesToAdd;
        } else {
            // NO: add to all OTHER outcomes
            if (outcome != Outcome.OnTime) newQ1 += sharesToAdd;
            if (outcome != Outcome.Delayed30) newQ2 += sharesToAdd;
            if (outcome != Outcome.Delayed120Plus) newQ3 += sharesToAdd;
            if (outcome != Outcome.Cancelled) newQ4 += sharesToAdd;
        }

        return (newQ1, newQ2, newQ3, newQ4);
    }
}
