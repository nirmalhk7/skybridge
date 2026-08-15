// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SponsorshipEscrow {
    address public immutable sponsor;
    address public immutable receiver;
    uint256 public immutable amount;
    uint256 public immutable deadline;
    bool public sponsorAccepted;
    bool public receiverAccepted;
    bool public fundsReleased;
    bool public refunded;

    event SponsorshipAccepted(address indexed party);
    event FundsReleased(address indexed receiver, uint256 amount);
    event FundsRefunded(address indexed sponsor, uint256 amount);

    constructor(
        address _sponsor,
        address _receiver,
        uint256 durationSeconds
    ) payable {
        require(_sponsor != address(0), "Invalid sponsor");
        require(_receiver != address(0), "Invalid receiver");
        require(_sponsor != _receiver, "Parties must differ");
        require(msg.sender == _sponsor, "Sponsor must deploy");
        require(msg.value > 0, "Escrow must be funded");
        require(durationSeconds > 0, "Invalid duration");

        sponsor = _sponsor;
        receiver = _receiver;
        amount = msg.value;
        deadline = block.timestamp + durationSeconds;
    }

    function acceptSponsorship() external {
        require(!fundsReleased && !refunded, "Escrow finalized");
        require(block.timestamp < deadline, "Escrow expired");
        require(
            msg.sender == sponsor || msg.sender == receiver,
            "Only sponsor or receiver can accept"
        );

        if (msg.sender == sponsor) {
            require(!sponsorAccepted, "Already accepted");
            sponsorAccepted = true;
        } else {
            require(!receiverAccepted, "Already accepted");
            receiverAccepted = true;
        }
        emit SponsorshipAccepted(msg.sender);

        if (sponsorAccepted && receiverAccepted) {
            releaseFunds();
        }
    }

    function refundAfterDeadline() external {
        require(msg.sender == sponsor, "Only sponsor");
        require(!fundsReleased && !refunded, "Escrow finalized");
        require(block.timestamp >= deadline, "Escrow active");

        refunded = true;
        (bool sent, ) = payable(sponsor).call{value: address(this).balance}("");
        require(sent, "Refund failed");
        emit FundsRefunded(sponsor, amount);
    }

    function releaseFunds() internal {
        fundsReleased = true;
        (bool sent, ) = payable(receiver).call{value: address(this).balance}("");
        require(sent, "Payout failed");
        emit FundsReleased(receiver, amount);
    }
}
