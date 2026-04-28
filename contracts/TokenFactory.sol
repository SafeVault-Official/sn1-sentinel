// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LaunchpadToken} from "./LaunchpadToken.sol";

/**
 * @title TokenFactory
 * @notice Pump.fun-style launchpad factory for user-created ERC-20 tokens.
 */
contract TokenFactory {
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

    event TokenCreated(address indexed tokenAddress, address indexed creator);

    error InvalidName();
    error InvalidSymbol();
    error InvalidSupply();
    error TokenNotFound();

    function createToken(
        string calldata name,
        string calldata symbol,
        uint256 supply,
        string calldata metadataURI
    ) external returns (address tokenAddress) {
        tokenAddress = _createToken(name, symbol, supply, metadataURI, "");
    }

    function createTokenWithImage(
        string calldata name,
        string calldata symbol,
        uint256 supply,
        string calldata metadataURI,
        string calldata imageURI
    ) external returns (address tokenAddress) {
        tokenAddress = _createToken(name, symbol, supply, metadataURI, imageURI);
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
        if (bytes(tokenName).length == 0) revert InvalidName();
        if (bytes(tokenSymbol).length == 0 || bytes(tokenSymbol).length > 12) revert InvalidSymbol();
        if (supply == 0) revert InvalidSupply();

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

        emit TokenCreated(tokenAddress, msg.sender);
    }

    function _findTokenRecord(address tokenAddress) internal view returns (TokenRecord memory) {
        uint256 oneBasedIndex = _tokenIndex[tokenAddress];
        if (oneBasedIndex == 0) revert TokenNotFound();
        return _allTokens[oneBasedIndex - 1];
    }
}
