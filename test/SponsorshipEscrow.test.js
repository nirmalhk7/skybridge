const SponsorshipEscrow = artifacts.require("SponsorshipEscrow");

const ONE_ETHER = web3.utils.toWei("1", "ether");
const HOUR = 60 * 60;

async function expectRevert(promise, reason) {
  try {
    await promise;
    assert.fail("expected transaction to revert");
  } catch (error) {
    assert.include(error.message, reason);
  }
}

async function advanceTime(seconds) {
  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        jsonrpc: "2.0",
        method: "evm_increaseTime",
        params: [seconds],
        id: Date.now(),
      },
      (error) => (error ? reject(error) : resolve()),
    );
  });
  await new Promise((resolve, reject) => {
    web3.currentProvider.send(
      { jsonrpc: "2.0", method: "evm_mine", params: [], id: Date.now() },
      (error) => (error ? reject(error) : resolve()),
    );
  });
}

contract("SponsorshipEscrow", ([sponsor, receiver, attacker]) => {
  it("requires the configured sponsor to sign a funded deployment", async () => {
    await expectRevert(
      SponsorshipEscrow.new(sponsor, receiver, HOUR, {
        from: attacker,
        value: ONE_ETHER,
      }),
      "Sponsor must deploy",
    );

    await expectRevert(
      SponsorshipEscrow.new(sponsor, receiver, HOUR, { from: sponsor }),
      "Escrow must be funded",
    );
  });

  it("rejects invalid party and deadline configuration", async () => {
    await expectRevert(
      SponsorshipEscrow.new(
        "0x0000000000000000000000000000000000000000",
        receiver,
        HOUR,
        { from: sponsor, value: ONE_ETHER },
      ),
      "Invalid sponsor",
    );
    await expectRevert(
      SponsorshipEscrow.new(sponsor, sponsor, HOUR, {
        from: sponsor,
        value: ONE_ETHER,
      }),
      "Parties must differ",
    );
    await expectRevert(
      SponsorshipEscrow.new(sponsor, receiver, 0, {
        from: sponsor,
        value: ONE_ETHER,
      }),
      "Invalid duration",
    );
  });

  it("releases funds once after both parties accept", async () => {
    const escrow = await SponsorshipEscrow.new(sponsor, receiver, HOUR, {
      from: sponsor,
      value: ONE_ETHER,
    });
    const receiverBefore = web3.utils.toBN(await web3.eth.getBalance(receiver));

    await escrow.acceptSponsorship({ from: sponsor });
    const releaseTx = await escrow.acceptSponsorship({ from: receiver });

    const receiverAfter = web3.utils.toBN(await web3.eth.getBalance(receiver));
    const transaction = await web3.eth.getTransaction(releaseTx.tx);
    const receiverGas = web3.utils
      .toBN(releaseTx.receipt.gasUsed)
      .mul(web3.utils.toBN(transaction.gasPrice));
    assert(
      receiverAfter
        .add(receiverGas)
        .sub(receiverBefore)
        .eq(web3.utils.toBN(ONE_ETHER)),
    );
    assert.equal(await web3.eth.getBalance(escrow.address), "0");
    assert.equal(await escrow.fundsReleased(), true);

    await expectRevert(
      escrow.acceptSponsorship({ from: receiver }),
      "Escrow finalized",
    );
  });

  it("lets only the sponsor recover unreleased funds after the deadline", async () => {
    const escrow = await SponsorshipEscrow.new(sponsor, receiver, 1, {
      from: sponsor,
      value: ONE_ETHER,
    });

    await expectRevert(
      escrow.refundAfterDeadline({ from: attacker }),
      "Only sponsor",
    );
    await expectRevert(
      escrow.refundAfterDeadline({ from: sponsor }),
      "Escrow active",
    );

    await advanceTime(2);
    await escrow.refundAfterDeadline({ from: sponsor });

    assert.equal(await web3.eth.getBalance(escrow.address), "0");
    assert.equal(await escrow.refunded(), true);
    await expectRevert(
      escrow.acceptSponsorship({ from: receiver }),
      "Escrow finalized",
    );
  });
});
