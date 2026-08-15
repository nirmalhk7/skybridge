const SponsorshipEscrow = artifacts.require("SponsorshipEscrow");

module.exports = function (deployer, _network, accounts) {
  const sponsor = accounts[0];
  const receiver = accounts[1];
  const thirtyDays = 30 * 24 * 60 * 60;

  deployer.deploy(SponsorshipEscrow, sponsor, receiver, thirtyDays, {
    from: sponsor,
    value: web3.utils.toWei("1", "ether"),
  });
};
