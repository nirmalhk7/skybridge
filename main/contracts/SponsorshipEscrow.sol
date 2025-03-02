// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SponsorshipEscrow {
    // State variables
    address public sponsor; // Address of the sponsor (money giver)
    address public receiver; // Address of the receiver (money taker)
    uint256 public amount; // Amount of money in escrow
    bool public sponsorAccepted; // Flag to check if sponsor accepted the sponsorship
    bool public receiverAccepted; // Flag to check if receiver accepted the sponsorship
    bool public fundsReleased; // Flag to check if funds have been released

    constructor(address _sponsor, address _receiver) payable {
        sponsor = _sponsor; // Set the sponsor to the provided address
        receiver = _receiver; // Set the receiver to the provided address
        amount = msg.value; // Set the amount to the value sent with the contract deployment
        sponsorAccepted = false; // Initialize sponsor acceptance to false
        receiverAccepted = false; // Initialize receiver acceptance to false
        fundsReleased = false; // Initialize funds released to false
    }

    // Function to accept the sponsorship by either the sponsor or the receiver
    function acceptSponsorship() public {
        require(msg.sender == sponsor || msg.sender == receiver, "Only sponsor or receiver can accept"); // Ensure only sponsor or receiver can call this function
        if (msg.sender == sponsor) {
            sponsorAccepted = true; // Set sponsor acceptance to true if called by sponsor
        } else if (msg.sender == receiver) {
            receiverAccepted = true; // Set receiver acceptance to true if called by receiver
        }

        // If both sponsor and receiver have accepted, release the funds
        if (sponsorAccepted && receiverAccepted && !fundsReleased) {
            releaseFunds();
        }
    }

    // Internal function to release the funds to the receiver
    function releaseFunds() internal {
        require(sponsorAccepted && receiverAccepted, "Both parties must accept the sponsorship"); // Ensure both parties have accepted
        require(!fundsReleased, "Funds already released"); // Ensure funds have not been released yet

        payable(receiver).transfer(amount); // Transfer the amount to the receiver
        fundsReleased = true; // Set funds released to true
    }
}