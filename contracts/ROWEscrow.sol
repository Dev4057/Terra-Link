// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface ILandRegistry {
    function ownerOf(uint256 propertyId) external view returns (address);
    function transferFromEscrow(uint256 propertyId, address newOwner) external;
    function isROWAffected(uint256 propertyId) external view returns (bool);
}

/**
 * Minimal reentrancy guard
 */
abstract contract ReentrancyGuard {
    uint256 private _status;
    constructor() { _status = 1; } // 1 = NOT_ENTERED, 2 = ENTERED
    modifier nonReentrant() {
        require(_status == 1, "ReentrancyGuard: reentrant call");
        _status = 2;
        _;
        _status = 1;
    }
}

/**
 * ROWEscrow
 * - Accepts deposits for a property
 * - Links to LandRegistry to verify payee is current owner
 * - Funds can be released to the owner (payee) by admin/arbiter or refunded to payer
 * - After release, the escrow contract (or admin) can call LandRegistry.transferFromEscrow to change ownership
 */
contract ROWEscrow is ReentrancyGuard {
    ILandRegistry public landRegistry;
    address public admin; // could be government account or arbiter

    struct Escrow {
        uint256 id;
        uint256 propertyId;
        address payer;    // who deposited funds (govt/constructor)
        address payee;    // expected recipient (current property owner)
        uint256 amount;
        bool released;
        bool exists;
        uint256 createdAt;
    }

    uint256 public escrowCount;
    mapping(uint256 => Escrow) public escrows;

    event EscrowCreated(uint256 indexed escrowId, uint256 indexed propertyId, address indexed payer, address payee, uint256 amount);
    event FundsReleased(uint256 indexed escrowId, uint256 indexed propertyId, address payee, uint256 amount);
    event EscrowCancelled(uint256 indexed escrowId, uint256 indexed propertyId, address payer, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address to, uint256 amount);
    event AdminChanged(address indexed previousAdmin, address indexed newAdmin);

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

    function changeAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin");
        emit AdminChanged(admin, newAdmin);
        admin = newAdmin;
    }

    /**
     * Create an escrow tied to a registered property.
     * payee should match current owner of the property (verified).
     * msg.value is stored.
     */
    function createEscrow(uint256 propertyId, address payee) external payable nonReentrant returns (uint256) {
        require(msg.value > 0, "No funds sent");
        address currentOwner = landRegistry.ownerOf(propertyId);
        require(currentOwner == payee, "Payee must be current property owner");

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

    /**
     * Admin (or authorized arbiter) releases funds to payee.
     * After releasing funds, optionally call LandRegistry.transferFromEscrow externally (separate tx) to transfer ownership.
     */
    function releaseFunds(uint256 escrowId) external onlyAdmin nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.exists, "Escrow not found");
        require(!e.released, "Already released");

        e.released = true;
        uint256 amount = e.amount;
        address payee = e.payee;
        // zero out amount to be safe before transfer
        e.amount = 0;

        (bool ok, ) = payable(payee).call{value: amount}("");
        require(ok, "Transfer failed");

        emit FundsReleased(escrowId, e.propertyId, payee, amount);
    }

    /**
     * Cancel escrow and refund payer. Only admin or payer can cancel before release.
     */
    function cancelEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage e = escrows[escrowId];
        require(e.exists, "Escrow not found");
        require(!e.released, "Already released");
        require(msg.sender == e.payer || msg.sender == admin, "Not authorized to cancel");

        uint256 amount = e.amount;
        e.amount = 0;
        e.exists = false;

        (bool ok, ) = payable(e.payer).call{value: amount}("");
        require(ok, "Refund failed");

        emit EscrowRefunded(escrowId, e.payer, amount);
    }

    /**
     * Helper: admin can direct-release AND trigger registry transfer in one atomic flow if desired,
     * but to keep separation of concerns we recommend two txs: releaseFunds -> then call LandRegistry.transferFromEscrow from admin or escrow contract.
     * If you want to perform both in one contract call, LandRegistry must allow this contract to call transferFromEscrow.
     */
    function getEscrow(uint256 escrowId) external view returns (
        uint256 id,
        uint256 propertyId,
        address payer,
        address payee,
        uint256 amount,
        bool released,
        bool exists,
        uint256 createdAt
    ) {
        Escrow storage e = escrows[escrowId];
        require(e.exists, "Escrow not found");
        return (e.id, e.propertyId, e.payer, e.payee, e.amount, e.released, e.exists, e.createdAt);
    }

    receive() external payable {
        revert("Direct deposits not allowed; use createEscrow");
    }

    fallback() external payable {
        revert("Fallback not supported");
    }
}
