// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Minimal Ownable (no OZ dependency)
 */
abstract contract Ownable {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: caller is not owner");
        _;
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}

/**
 * LandRegistry
 */
contract LandRegistry is Ownable {
    struct Property {
        uint256 id;
        string location;
        uint256 area;
        address owner;
        bool exists;
        bool rowAffected;
    }

    uint256 public propertyCount;
    mapping(uint256 => Property) public properties;
    address public escrowContract;

    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event ROWFlagUpdated(uint256 indexed propertyId, bool rowAffected);
    event PropertyOwnershipTransferred(uint256 indexed propertyId, address indexed from, address indexed to);
    event EscrowContractUpdated(address indexed previousEscrow, address indexed newEscrow);

    modifier onlyPropertyOwner(uint256 propertyId) {
        require(properties[propertyId].exists, "Property not found");
        require(properties[propertyId].owner == msg.sender, "Caller is not property owner");
        _;
    }

    modifier onlyEscrowOrOwner() {
        require(msg.sender == escrowContract || msg.sender == owner, "Not escrow or owner");
        _;
    }

    function setEscrowContract(address _escrow) external onlyOwner {
        address prev = escrowContract;
        escrowContract = _escrow;
        emit EscrowContractUpdated(prev, _escrow);
    }

    function registerProperty(string calldata _location, uint256 _area) external returns (uint256) {
        require(bytes(_location).length > 0, "Location required");
        require(_area > 0, "Area required");

        propertyCount++;
        properties[propertyCount] = Property({
            id: propertyCount,
            location: _location,
            area: _area,
            owner: msg.sender,
            exists: true,
            rowAffected: false
        });

        emit PropertyRegistered(propertyCount, msg.sender);
        return propertyCount;
    }

    function setROWFlag(uint256 propertyId, bool affected) external onlyOwner {
        require(properties[propertyId].exists, "Property not found");
        properties[propertyId].rowAffected = affected;
        emit ROWFlagUpdated(propertyId, affected);
    }

 function transferPropertyOwnership(uint256 propertyId, address newOwner) external onlyPropertyOwner(propertyId) {
    _transfer(propertyId, newOwner);
}

    function transferFromEscrow(uint256 propertyId, address newOwner) external {
        require(msg.sender == escrowContract || msg.sender == owner, "Not authorized");
        require(properties[propertyId].exists, "Property not found");
        _transfer(propertyId, newOwner);
    }

    function _transfer(uint256 propertyId, address newOwner) internal {
        require(newOwner != address(0), "Invalid new owner");
        address prev = properties[propertyId].owner;
        properties[propertyId].owner = newOwner;
        emit PropertyOwnershipTransferred(propertyId, prev, newOwner);
    }

    function getProperty(uint256 propertyId) external view returns (
        uint256 id,
        string memory location,
        uint256 area,
        address propOwner,
        bool rowAffected,
        bool existsFlag
    ) {
        Property storage p = properties[propertyId];
        require(p.exists, "Property not found");
        return (p.id, p.location, p.area, p.owner, p.rowAffected, p.exists);
    }

    function ownerOf(uint256 propertyId) external view returns (address) {
        require(properties[propertyId].exists, "Property not found");
        return properties[propertyId].owner;
    }

    function isROWAffected(uint256 propertyId) external view returns (bool) {
        require(properties[propertyId].exists, "Property not found");
        return properties[propertyId].rowAffected;
    }
}
