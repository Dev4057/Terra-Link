// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILandRegistry {
    function properties(uint256 propertyId)
        external
        view
        returns (
            uint256 id,
            string memory location,
            uint256 area,
            address owner,
            bool exists,
            bool rowAffected
        );
}

abstract contract ReentrancyGuard {
    uint256 private _status;
    constructor() {
        _status = 1;
    }
    modifier nonReentrant() {
        require(_status == 1, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
}

contract ROWEscrow is ReentrancyGuard {
    ILandRegistry public landRegistry;
    address public admin;

    struct Escrow {
        uint256 id;
        uint256 propertyId;
        address payer;
        address payee;
        uint256 amount;
        bool released;
        bool exists;
        uint256 createdAt;
    }

    uint256 public escrowCount;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, uint256 indexed propertyId, address indexed payer, address payee, uint256 amount);
    event FundsReleased(uint256 indexed escrowId, uint256 indexed propertyId, address payee, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address to, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "ROWEscrow: caller is not admin");
        _;
    }

    constructor(address _landRegistry, address _admin) {
        require(_landRegistry != address(0), "Invalid registry");
        require(_admin != address(0), "Invalid admin");
        landRegistry = ILandRegistry(_landRegistry);
        admin = _admin;
    }

    function createEscrow(uint256 propertyId, address payee) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "No funds sent");

        // Matches your LandRegistry layout
        (, , , address currentOwner, bool exists, bool isROW) = landRegistry.properties(propertyId);
        require(exists, "Property not found");
        require(isROW, "Property not ROW-affected");
        require(currentOwner == payee, "Payee must be property owner");

        escrowCount++;
        escrows[escrowCount] = Escrow({
            id: escrowCount,
            propertyId: propertyId,
            payer: msg.sender,
            payee: payee,
            amount: msg.value,
            released: false,
            exists: true,
            createdAt: block.timestamp
        });

        emit EscrowCreated(escrowCount, propertyId, msg.sender, payee, msg.value);
        return escrowCount;
    }

    function releaseFunds(uint256 escrowId) external onlyAdmin nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.exists, "Escrow not found");
        require(!e.released, "Already released");

        e.released = true;
        uint256 amount = e.amount;
        e.amount = 0;

        (bool ok, ) = payable(e.payee).call{value: amount}("");
        require(ok, "Transfer failed");

        emit FundsReleased(escrowId, e.propertyId, e.payee, amount);
    }

    function refundEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.exists, "Escrow not found");
        require(!e.released, "Already released");
        require(msg.sender == e.payer || msg.sender == admin, "Not authorized");

        uint256 amount = e.amount;
        e.amount = 0;
        e.exists = false;

        (bool ok, ) = payable(e.payer).call{value: amount}("");
        require(ok, "Refund failed");

        emit EscrowRefunded(escrowId, e.payer, amount);
    }
}
