// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ISkyOdds {
    enum Outcome {
        Unresolved,
        OnTime,
        Delayed30,
        Delayed120Plus,
        Cancelled
    }

    function resolveMarket(bytes32 flightId, Outcome actualOutcome) external;
}

/**
 * @title Oracle
 * @notice Chainlink oracle for fetching real-world flight data and resolving markets
 * @dev Uses Chainlink Any API to fetch flight status from external APIs
 */
contract Oracle is ChainlinkClient, Ownable {
    using Chainlink for Chainlink.Request;

    // ============ State Variables ============

    ISkyOdds public predictionMarket;

    uint256 public oracleFee;
    bytes32 public jobId;

    struct FlightRequest {
        bytes32 flightId;
        string flightNumber;
        uint256 scheduledDeparture;
        bool fulfilled;
    }

    mapping(bytes32 => FlightRequest) public requests;
    mapping(bytes32 => bool) public resolvedFlights;

    // ============ Events ============

    event FlightDataRequested(bytes32 indexed requestId, bytes32 indexed flightId, string flightNumber);
    event FlightDataReceived(bytes32 indexed requestId, bytes32 indexed flightId, uint8 outcome);
    event MarketResolved(bytes32 indexed flightId, uint8 outcome);

    // ============ Constructor ============

    constructor(address _link, address _oracle, bytes32 _jobId, uint256 _oracleFee, address _predictionMarket)
        Ownable(msg.sender)
    {
        require(_link != address(0), "Invalid LINK address");
        require(_oracle != address(0), "Invalid oracle address");
        require(_predictionMarket != address(0), "Invalid market address");

        _setChainlinkToken(_link);
        _setChainlinkOracle(_oracle);
        jobId = _jobId;
        oracleFee = _oracleFee;
        predictionMarket = ISkyOdds(_predictionMarket);
    }

    // ============ Core Functions ============

    /**
     * @notice Request flight data from Chainlink oracle
     * @param flightId Market identifier
     * @param flightNumber Flight identifier (e.g., "AA100")
     * @param scheduledDeparture Unix timestamp of scheduled departure
     * @param apiUrl URL of flight tracking API
     */
    function requestFlightData(
        bytes32 flightId,
        string memory flightNumber,
        uint256 scheduledDeparture,
        string memory apiUrl
    ) external onlyOwner returns (bytes32 requestId) {
        require(!resolvedFlights[flightId], "Flight already resolved");
        require(block.timestamp >= scheduledDeparture + 2 hours, "Too early to resolve");

        Chainlink.Request memory request = _buildChainlinkRequest(jobId, address(this), this.fulfillFlightData.selector);

        // Set the URL to perform the GET request on
        request._add("get", apiUrl);

        // Set the path to find the desired data in the API response
        // Example: if API returns {"status": "delayed", "delay_minutes": 45}
        request._add("path", "status,delay_minutes");

        // Send the request
        requestId = _sendChainlinkRequest(request, oracleFee);

        requests[requestId] = FlightRequest({
            flightId: flightId, flightNumber: flightNumber, scheduledDeparture: scheduledDeparture, fulfilled: false
        });

        emit FlightDataRequested(requestId, flightId, flightNumber);

        return requestId;
    }

    /**
     * @notice Callback function for Chainlink oracle
     * @param _requestId The request ID
     * @param _delayMinutes Delay in minutes returned by API
     */
    function fulfillFlightData(bytes32 _requestId, uint256 _delayMinutes)
        public
        recordChainlinkFulfillment(_requestId)
    {
        FlightRequest storage request = requests[_requestId];
        require(!request.fulfilled, "Request already fulfilled");

        request.fulfilled = true;

        // Determine outcome based on delay
        ISkyOdds.Outcome outcome;

        if (_delayMinutes == 0) {
            outcome = ISkyOdds.Outcome.OnTime;
        } else if (_delayMinutes >= 1 && _delayMinutes < 30) {
            outcome = ISkyOdds.Outcome.OnTime; // < 30 min is still on time
        } else if (_delayMinutes >= 30 && _delayMinutes < 120) {
            outcome = ISkyOdds.Outcome.Delayed30;
        } else if (_delayMinutes >= 120 && _delayMinutes < 9999) {
            outcome = ISkyOdds.Outcome.Delayed120Plus;
        } else {
            // _delayMinutes >= 9999 indicates cancelled
            outcome = ISkyOdds.Outcome.Cancelled;
        }

        resolvedFlights[request.flightId] = true;

        // Resolve the market
        predictionMarket.resolveMarket(request.flightId, outcome);

        emit FlightDataReceived(_requestId, request.flightId, uint8(outcome));
        emit MarketResolved(request.flightId, uint8(outcome));
    }

    /**
     * @notice Manual resolution fallback (in case oracle fails)
     * @dev Only owner can manually resolve after sufficient time has passed
     */
    function manualResolve(bytes32 flightId, ISkyOdds.Outcome outcome) external onlyOwner {
        require(!resolvedFlights[flightId], "Already resolved");
        require(outcome != ISkyOdds.Outcome.Unresolved, "Invalid outcome");

        resolvedFlights[flightId] = true;
        predictionMarket.resolveMarket(flightId, outcome);

        emit MarketResolved(flightId, uint8(outcome));
    }

    // ============ Admin Functions ============

    function updatePredictionMarket(address _newMarket) external onlyOwner {
        require(_newMarket != address(0), "Invalid address");
        predictionMarket = ISkyOdds(_newMarket);
    }

    function updateOracleFee(uint256 _newFee) external onlyOwner {
        oracleFee = _newFee;
    }

    function updateJobId(bytes32 _newJobId) external onlyOwner {
        jobId = _newJobId;
    }

    function withdrawLink() external onlyOwner {
        LinkTokenInterface link = LinkTokenInterface(_chainlinkTokenAddress());
        require(link.transfer(msg.sender, link.balanceOf(address(this))), "Unable to transfer");
    }

    // ============ View Functions ============

    function getRequestInfo(bytes32 requestId)
        external
        view
        returns (bytes32 flightId, string memory flightNumber, uint256 scheduledDeparture, bool fulfilled)
    {
        FlightRequest storage request = requests[requestId];
        return (request.flightId, request.flightNumber, request.scheduledDeparture, request.fulfilled);
    }

    function isFlightResolved(bytes32 flightId) external view returns (bool) {
        return resolvedFlights[flightId];
    }
}
