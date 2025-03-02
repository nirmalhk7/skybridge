import { NextApiRequest, NextApiResponse } from "next";
import Web3 from "web3";
import SponsorshipEscrow from "../../../../build/contracts/SponsorshipEscrow.json";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: Response) {
  // Handle POST request
  // Connect to the Ethereum network
  const web3 = new Web3(Web3.givenProvider || "http://127.0.0.1:8545");

  // Get the accounts from the wallet
  const accounts = await web3.eth.getAccounts();

  // Get the contract data
  const networkId = await web3.eth.net.getId();
  const deployedNetwork = SponsorshipEscrow.networks[Number(networkId)];
  const contract = new web3.eth.Contract(
    SponsorshipEscrow.abi,
    deployedNetwork && deployedNetwork.address,
  );

  // Deploy the contract
  const { sponsorAddress, receiverAddress, amountInEther } = await req.json();
  console.log(sponsorAddress, receiverAddress);
  const result = await contract
    .deploy({
      data: SponsorshipEscrow.bytecode,
      arguments: [sponsorAddress, receiverAddress],
    })
    .send({
      from: accounts[0],
      value: web3.utils.toWei(amountInEther, "ether"),
      gas: "3000000",
    });

  console.log("Contract deployed to:", result.options.address);
  return NextResponse.json(
    { status: 201 },
  );
}
