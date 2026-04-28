// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {LaunchpadToken} from "./LaunchpadToken.sol";

/**
 * @title TokenFactory
 * @notice Pump.fun-style launchpad factory for user-created ERC-20 tokens.
 */
contract TokenFactory is Ownable, ReentrancyGuard {
    struct TokenRecord {
        address tokenAddress;
        address creator;
        string name;
        string symbol;
        uint256 supply;
        string metadataURI;
        string imageURI;
        uint256 createdAt;
    }

    TokenRecord[] private _allTokens;
    mapping(address creator => address[]) private _tokensByCreator;
    mapping(address token => uint256 oneBasedIndex) private _tokenIndex;

    uint256 public maxSymbolLength = 12;

    event TokenCreated(
        address indexed tokenAddress,
        address indexed creator,
        string name,
        string symbol,
        uint256 supply,
        string metadataURI,
        string imageURI
    );
    event MaxSymbolLengthUpdated(uint256 previousMaxLength, uint256 newMaxLength);

    error TokenNotFound();

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "TokenFactory: owner is zero address");
    }

    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 supply,
        string calldata metadataURI
    ) external nonReentrant returns (address tokenAddress) {
        tokenAddress = _createToken(name, symbol, supply, metadataURI, "");
    }

    function createTokenWithImage(
        string calldata name,
        string calldata symbol,
        uint256 supply,
        string calldata metadataURI,
        string calldata imageURI
    ) external nonReentrant returns (address tokenAddress) {
        tokenAddress = _createToken(name, symbol, supply, metadataURI, imageURI);
    }

    function setMaxSymbolLength(uint256 newMaxSymbolLength) external onlyOwner {
        require(newMaxSymbolLength > 0, "TokenFactory: max length is zero");
        uint256 previous = maxSymbolLength;
        maxSymbolLength = newMaxSymbolLength;
        emit MaxSymbolLengthUpdated(previous, newMaxSymbolLength);
    }

    function getTokensByCreator(address creator) external view returns (TokenRecord[] memory records) {
        address[] memory tokenAddresses = _tokensByCreator[creator];
        records = new TokenRecord[](tokenAddresses.length);

        for (uint256 i = 0; i < tokenAddresses.length; i++) {
            records[i] = _findTokenRecord(tokenAddresses[i]);
        }
    }

    function getAllTokens() external view returns (TokenRecord[] memory) {
        return _allTokens;
    }

    function totalCreatedTokens() external view returns (uint256) {
        return _allTokens.length;
    }

    function _createToken(
        string calldata tokenName,
        string calldata tokenSymbol,
        uint256 supply,
        string calldata metadataURI,
        string calldata imageURI
    ) internal returns (address tokenAddress) {
        require(bytes(tokenName).length > 0, "TokenFactory: name is required");
        require(bytes(tokenSymbol).length > 0, "TokenFactory: symbol is required");
        require(bytes(tokenSymbol).length <= maxSymbolLength, "TokenFactory: symbol too long");
        require(supply > 0, "TokenFactory: supply must be greater than zero");

        LaunchpadToken token = new LaunchpadToken(
            tokenName,
            tokenSymbol,
            supply,
            metadataURI,
            imageURI,
            msg.sender
        );
        tokenAddress = address(token);

        _allTokens.push(
            TokenRecord({
                tokenAddress: tokenAddress,
                creator: msg.sender,
                name: tokenName,
                symbol: tokenSymbol,
                supply: supply,
                metadataURI: metadataURI,
                imageURI: imageURI,
                createdAt: block.timestamp
            })
        );
        _tokenIndex[tokenAddress] = _allTokens.length;
        _tokensByCreator[msg.sender].push(tokenAddress);

        emit TokenCreated(tokenAddress, msg.sender, tokenName, tokenSymbol, supply, metadataURI, imageURI);
    }

    function _findTokenRecord(address tokenAddress) internal view returns (TokenRecord memory) {
        uint256 oneBasedIndex = _tokenIndex[tokenAddress];
        if (oneBasedIndex == 0) revert TokenNotFound();
        return _allTokens[oneBasedIndex - 1];
    }
}
