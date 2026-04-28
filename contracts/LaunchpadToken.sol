// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LaunchpadToken
 * @notice ERC-20 token minted by the TokenFactory.
 * @dev Ownership is transferred to the creator at deployment.
 */
contract LaunchpadToken is ERC20, Ownable {
    string public metadataURI;
    string public imageURI;

    event MetadataUpdated(string metadataURI, string imageURI);
    event Minted(address indexed to, uint256 value);

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply,
        string memory tokenMetadataURI,
        string memory tokenImageURI,
        address creator
    ) ERC20(tokenName, tokenSymbol) Ownable(creator) {
        require(creator != address(0), "LaunchpadToken: creator is zero address");
        require(bytes(tokenName).length > 0, "LaunchpadToken: name is required");
        require(bytes(tokenSymbol).length > 0, "LaunchpadToken: symbol is required");

        metadataURI = tokenMetadataURI;
        imageURI = tokenImageURI;
        emit MetadataUpdated(tokenMetadataURI, tokenImageURI);

        if (initialSupply > 0) {
            _mint(creator, initialSupply);
            emit Minted(creator, initialSupply);
        }
    }

    function updateMetadata(string calldata newMetadataURI, string calldata newImageURI) external onlyOwner {
        metadataURI = newMetadataURI;
        imageURI = newImageURI;
        emit MetadataUpdated(newMetadataURI, newImageURI);
    }

    function mint(address to, uint256 value) external onlyOwner returns (bool) {
        require(to != address(0), "LaunchpadToken: mint to zero address");
        require(value > 0, "LaunchpadToken: mint amount is zero");
        _mint(to, value);
        emit Minted(to, value);
        return true;
    }
}
