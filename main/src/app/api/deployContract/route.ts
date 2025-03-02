import { NextApiRequest, NextApiResponse } from "next";
import Web3 from "web3";
import SponsorshipEscrow from "../../../../build/contracts/SponsorshipEscrow.json";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodbClientPromise";
import { ObjectId } from "mongodb";

export async function POST(req: Request, res: Response) {
  try {
    const { sponsorerId, fundraiserId, amountInEther } = await req.json();

    if (!sponsorerId || !fundraiserId || !amountInEther) {
      return NextResponse.json(
        { error: "Missing sponsorerId, fundraiserId, or amountInEther" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const users = db.collection("users");

    const sponsorerObjectId = new ObjectId(sponsorerId);
    const fundraiserObjectId = new ObjectId(fundraiserId);


    const sponsorer = await users.findOne({ _id: sponsorerObjectId });
    const fundraiser = await users.findOne({ _id: fundraiserObjectId });

    if (!sponsorer || !fundraiser) {
      return NextResponse.json(
        { error: "Sponsorer or fundraiser not found" },
        { status: 404 },
      );
    }

    const sponsorAddress = sponsorer.accountAddress;
    const receiverAddress = fundraiser.accountAddress;
    console.log(sponsorAddress, receiverAddress)

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
      { status: 201, contractAddress: result.options.address },
    );
  } catch (error) {
    console.error("Error deploying contract:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}