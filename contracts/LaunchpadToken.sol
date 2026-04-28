// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LaunchpadToken
 * @notice ERC-20 token minted by the TokenFactory.
 * @dev Ownership is transferred to the creator at deployment.
 */
contract LaunchpadToken {
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    string public metadataURI;
    string public imageURI;

    uint256 public totalSupply;
    address public owner;

    mapping(address account => uint256) private _balances;
    mapping(address account => mapping(address spender => uint256)) private _allowances;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    error NotOwner();
    error ZeroAddress();
    error InvalidTokenConfig();
    error InsufficientBalance();
    error InsufficientAllowance();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        string memory tokenName,
        string memory tokenSymbol,
        uint256 initialSupply,
        string memory tokenMetadataURI,
        string memory tokenImageURI,
        address creator
    ) {
        if (creator == address(0)) revert ZeroAddress();
        if (bytes(tokenName).length == 0 || bytes(tokenSymbol).length == 0) revert InvalidTokenConfig();

        name = tokenName;
        symbol = tokenSymbol;
        metadataURI = tokenMetadataURI;
        imageURI = tokenImageURI;

        owner = creator;
        emit OwnershipTransferred(address(0), creator);

        if (initialSupply > 0) {
            _mint(creator, initialSupply);
        }
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address accountOwner, address spender) external view returns (uint256) {
        return _allowances[accountOwner][spender];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        _allowances[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = _allowances[from][msg.sender];
        if (currentAllowance < value) revert InsufficientAllowance();

        unchecked {
            _allowances[from][msg.sender] = currentAllowance - value;
        }
        emit Approval(from, msg.sender, _allowances[from][msg.sender]);

        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 value) external onlyOwner returns (bool) {
        _mint(to, value);
        return true;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();

        uint256 fromBalance = _balances[from];
        if (fromBalance < value) revert InsufficientBalance();

        unchecked {
            _balances[from] = fromBalance - value;
        }
        _balances[to] += value;

        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        totalSupply += value;
        _balances[to] += value;
        emit Transfer(address(0), to, value);
    }
}
