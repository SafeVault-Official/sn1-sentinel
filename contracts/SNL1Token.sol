// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SNL1Token
 * @notice ERC-20 token for SNL1 utility and ecosystem payments.
 * @dev Owner-controlled minting is intentionally retained for early-stage governance.
 */
contract SNL1Token is ERC20, Ownable {
    event Minted(address indexed to, uint256 value);

    constructor(uint256 initialSupply, address initialOwner) ERC20("SNL1", "SNL1") Ownable(initialOwner) {
        require(initialOwner != address(0), "SNL1Token: owner is zero address");

        if (initialSupply > 0) {
            _mint(initialOwner, initialSupply);
            emit Minted(initialOwner, initialSupply);
        }
    }

    function mint(address to, uint256 value) external onlyOwner returns (bool) {
        require(to != address(0), "SNL1Token: mint to zero address");
        require(value > 0, "SNL1Token: mint amount is zero");
        _mint(to, value);
        emit Minted(to, value);
        return true;
    }
}
