const SponsorshipEscrow = artifacts.require("SponsorshipEscrow");

module.exports = function (deployer) {
  const receiverAddress = "RECEIVER_ADDRESS"; // Replace with the actual receiver address
  deployer.deploy(SponsorshipEscrow, receiverAddress, { value: web3.utils.toWei("1", "ether") });
};