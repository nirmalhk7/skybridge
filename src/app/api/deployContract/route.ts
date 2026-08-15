import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { sponsorshipEscrowArtifact } from "@/contracts/SponsorshipEscrowArtifact";
import clientPromise from "@/lib/mongodbClientPromise";
import { apiFailure } from "@/lib/apiFailure";

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const transactionHashPattern = /^0x[0-9a-fA-F]{64}$/;

function asObjectId(value: unknown): ObjectId | null {
  return typeof value === "string" && ObjectId.isValid(value)
    ? new ObjectId(value)
    : null;
}

function agreementId(agreement: { _id?: ObjectId; value?: { _id?: ObjectId } } | null) {
  return agreement?.value?._id ?? agreement?._id ?? null;
}

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return apiFailure(req, 401, { error: "Authentication required" }, { phase: "auth" });
    }

    const body = await req.json();
    const client = await clientPromise;
    const db = client.db("skybridge-cluster");
    const agreements = db.collection("escrowAgreements");

    if (body.action === "getAgreement") {
      const occasionId = asObjectId(body.occasionId);
      if (!occasionId) return apiFailure(req, 400, { error: "Invalid occasion id" }, { phase: "validation", details: { field: "occasionId" } });
      const agreement = await agreements.findOne({ occasionId });
      if (!agreement) return apiFailure(req, 404, { error: "Agreement not found" }, { phase: "database", details: { entity: "agreement" } });
      const isSponsor = agreement.sponsorerId.toString() === session.user.id;
      const isFundraiser = agreement.fundraiserId.toString() === session.user.id;
      if (!isSponsor && !isFundraiser) {
        return apiFailure(req, 403, { error: "Only an agreement participant can view it" }, { phase: "authorization", details: { entity: "agreement" } });
      }
      const users = db.collection("users");
      const [sponsor, fundraiser] = await Promise.all([
        users.findOne({ _id: agreement.sponsorerId }, { projection: { accountAddress: 1 } }),
        users.findOne({ _id: agreement.fundraiserId }, { projection: { accountAddress: 1 } }),
      ]);
      return NextResponse.json({
        agreementId: agreement._id.toString(),
        occasionId: agreement.occasionId.toString(),
        status: agreement.status,
        contractAddress: agreement.contractAddress,
        chainId: agreement.chainId,
        abi: sponsorshipEscrowArtifact.abi,
        sponsorAddress: sponsor?.accountAddress,
        fundraiserAddress: fundraiser?.accountAddress,
      });
    }

    if (body.action === "prepare") {
      const sponsorerId = asObjectId(session.user.id);
      const occasionId = asObjectId(body.occasionId);
      if (session.user.role !== "sponsorer") {
        return apiFailure(req, 403, { error: "Sponsorer role required" }, { phase: "auth", details: { requiredRole: "sponsorer" } });
      }
      if (
        !sponsorerId ||
        !occasionId ||
        typeof body.amountInWei !== "string" ||
        !/^\d+$/.test(body.amountInWei) ||
        BigInt(body.amountInWei) <= 0n ||
        !Number.isSafeInteger(body.durationSeconds) ||
        body.durationSeconds <= 0
      ) {
        return apiFailure(req, 400, { error: "Invalid agreement details" }, { phase: "validation", details: { fields: ["occasionId", "amountInWei", "durationSeconds"] } });
      }

      const users = db.collection("users");
      const [sponsorer, fundraiser] = await Promise.all([
        users.findOne({ _id: sponsorerId }, { projection: { accountAddress: 1 } }),
        users.findOne({ "occasions.id": occasionId }, { projection: { accountAddress: 1 } }),
      ]);
      if (!addressPattern.test(sponsorer?.accountAddress ?? "") || !addressPattern.test(fundraiser?.accountAddress ?? "")) {
        return apiFailure(req, 400, { error: "A valid wallet address is required for both parties" }, { phase: "validation", details: { fields: ["sponsorer.accountAddress", "fundraiser.accountAddress"] } });
      }

      const now = new Date();
      const stored = await agreements.findOneAndUpdate(
        { occasionId },
        {
          $setOnInsert: {
            occasionId,
            sponsorerId,
            fundraiserId: fundraiser._id,
            amountInWei: body.amountInWei,
            durationSeconds: body.durationSeconds,
            status: "AwaitingDeployment",
            createdAt: now,
          },
        },
        { upsert: true, returnDocument: "after" },
      );
      const id = agreementId(stored);
      if (!id) throw new Error("Agreement could not be stored");
      return NextResponse.json({
        agreementId: id.toString(),
        status: "AwaitingDeployment",
        deployment: {
          abi: sponsorshipEscrowArtifact.abi,
          bytecode: sponsorshipEscrowArtifact.bytecode,
          constructorArgs: [sponsorer.accountAddress, fundraiser.accountAddress, body.durationSeconds],
          from: sponsorer.accountAddress,
          value: body.amountInWei,
        },
      }, { status: 201 });
    }

    const id = asObjectId(body.agreementId);
    if (!id) return apiFailure(req, 400, { error: "Invalid agreement id" }, { phase: "validation", details: { field: "agreementId" } });
    const agreement = await agreements.findOne({ _id: id });
    if (!agreement) return apiFailure(req, 404, { error: "Agreement not found" }, { phase: "database", details: { entity: "agreement" } });
    const isSponsor = agreement.sponsorerId.toString() === session.user.id;
    const isFundraiser = agreement.fundraiserId.toString() === session.user.id;

    if (body.action === "recordDeployment") {
      if (!isSponsor) return apiFailure(req, 403, { error: "Only the sponsorer can record deployment" }, { phase: "authorization", details: { operation: "recordDeployment" } });
      if (!addressPattern.test(body.contractAddress ?? "") || !transactionHashPattern.test(body.transactionHash ?? "") || !Number.isInteger(Number(body.chainId))) {
        return apiFailure(req, 400, { error: "Invalid deployment metadata" }, { phase: "validation", details: { fields: ["contractAddress", "transactionHash", "chainId"] } });
      }
      await agreements.updateOne({ _id: id }, { $set: {
        contractAddress: body.contractAddress,
        deploymentTransactionHash: body.transactionHash,
        chainId: String(body.chainId),
        status: "AwaitingAcceptance",
        deployedAt: new Date(),
      } });
      return NextResponse.json({ agreementId: id.toString(), status: "AwaitingAcceptance", contractAddress: body.contractAddress });
    }

    if (body.action === "recordAcceptance") {
      if (!isSponsor && !isFundraiser) return apiFailure(req, 403, { error: "Only an agreement participant can record acceptance" }, { phase: "authorization", details: { operation: "recordAcceptance" } });
      if (!transactionHashPattern.test(body.transactionHash ?? "")) return apiFailure(req, 400, { error: "Invalid transaction hash" }, { phase: "validation", details: { field: "transactionHash" } });
      const acceptances = { ...(agreement.acceptances ?? {}) };
      acceptances[isSponsor ? "sponsor" : "receiver"] = body.transactionHash;
      const status = acceptances.sponsor && acceptances.receiver ? "BothAccepted" : isSponsor ? "SponsorAccepted" : "ReceiverAccepted";
      await agreements.updateOne({ _id: id }, { $set: { acceptances, status, updatedAt: new Date() } });
      return NextResponse.json({ agreementId: id.toString(), status });
    }

    return apiFailure(req, 400, { error: "Unknown action" }, { phase: "validation", details: { field: "action" } });
  } catch (error) {
    return apiFailure(req, 500, { error: "Internal Server Error" }, { phase: "contract_management", error });
  }
}
