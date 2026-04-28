// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {TokenFactory} from "../TokenFactory.sol";

contract FactoryCaller {
    function createBasic(
        address factory,
        string calldata name,
        string calldata symbol,
        uint256 supply,
        string calldata metadataURI
    ) external returns (address) {
        return TokenFactory(factory).createToken(name, symbol, supply, metadataURI);
    }

    function createWithImage(
        address factory,
        string calldata name,
        string calldata symbol,
        uint256 supply,
        string calldata metadataURI,
        string calldata imageURI
    ) external returns (address) {
        return TokenFactory(factory).createTokenWithImage(name, symbol, supply, metadataURI, imageURI);
    }
}
