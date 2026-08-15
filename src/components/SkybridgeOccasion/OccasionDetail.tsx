"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { BrowserProvider, Contract } from "ethers";

type Occasion = {
  id?: string;
  name?: string;
  email?: string;
  typePreference?: string;
  countryPreference?: string;
  statePreference?: string;
  agePreference?: string;
  message?: string;
  status?: string;
  score?: string | number;
  createdDate?: string;
};

type Agreement = {
  agreementId: string;
  status: string;
  contractAddress?: string | null;
  abi?: unknown[];
  sponsorAddress?: string;
  fundraiserAddress?: string;
};

const fields: Array<[keyof Occasion, string]> = [
  ["email", "Email"],
  ["typePreference", "Type"],
  ["countryPreference", "Country"],
  ["statePreference", "State"],
  ["agePreference", "Age"],
  ["status", "Status"],
  ["score", "Match score"],
];

export default function OccasionDetail({ occasionId }: { occasionId: string }) {
  const { data: session, status } = useSession();
  const [occasion, setOccasion] = useState<Occasion | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [error, setError] = useState("");
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!occasionId || !session?.user?.id) return;
    const controller = new AbortController();
    const params = session.user.role === "sponsorer"
      ? new URLSearchParams({ occasionId })
      : new URLSearchParams({ userId: session.user.id, occasionId });
    fetch(`/api/searchUserOccasion?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load opportunity");
        const identified = data.occasion || data.occasions?.[0] || null;
        if (!identified) throw new Error("Opportunity not found");
        return identified;
      })
      .then(setOccasion)
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load opportunity");
        }
      });
    return () => controller.abort();
  }, [occasionId, session?.user?.id, session?.user?.role]);

  useEffect(() => {
    if (!occasionId || !session?.user?.id || !occasion) return;
    fetch("/api/deployContract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getAgreement", occasionId }),
    })
      .then(async (response) => {
        if (response.status === 404) return null;
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load agreement");
        return data as Agreement;
      })
      .then(setAgreement)
      .catch((requestError) => setError(requestError.message || "Unable to load agreement"));
  }, [occasion, occasionId, session?.user?.id]);

  const acceptSponsorship = async () => {
    if (!agreement?.contractAddress || !agreement.abi || !agreement.agreementId) return;
    setAccepting(true);
    try {
      const ethereum = (window as Window & { ethereum?: unknown }).ethereum;
      if (!ethereum) throw new Error("Connect a browser wallet to accept sponsorship.");
      const provider = new BrowserProvider(ethereum as any);
      const signer = await provider.getSigner();
      const signerAddress = (await signer.getAddress()).toLowerCase();
      const sponsorAddress = agreement.sponsorAddress?.toLowerCase();
      const fundraiserAddress = agreement.fundraiserAddress?.toLowerCase();
      if (signerAddress !== sponsorAddress && signerAddress !== fundraiserAddress) {
        throw new Error("Connected wallet is not an agreement participant.");
      }
      const contract = new Contract(agreement.contractAddress, agreement.abi, signer);
      const transaction = await contract.acceptSponsorship();
      await transaction.wait();
      const response = await fetch("/api/deployContract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "recordAcceptance",
          agreementId: agreement.agreementId,
          transactionHash: transaction.hash,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to record acceptance");
      setAgreement((current) => current ? { ...current, status: data.status } : current);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Unable to accept sponsorship");
    } finally {
      setAccepting(false);
    }
  };

  if (error) return <p role="alert" className="container py-10 text-red-500">{error}</p>;
  if (status === "unauthenticated") return <p role="alert" className="container py-10 text-red-500">Sign in to view this opportunity.</p>;
  if (!occasion) return <p className="container py-10">Loading opportunity…</p>;

  return (
    <article className="container py-10">
      <div className="rounded-sm bg-white px-8 py-10 shadow-three dark:bg-gray-dark">
        <h2 className="mb-6 text-2xl font-bold text-black dark:text-white">
          {occasion.name || "Untitled opportunity"}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {fields.map(([key, label]) =>
            occasion[key] !== undefined && occasion[key] !== "" ? (
              <div key={key}>
                <dt className="font-semibold text-black dark:text-white">{label}</dt>
                <dd>{String(occasion[key])}</dd>
              </div>
            ) : null,
          )}
        </dl>
        {occasion.message && (
          <div className="mt-6">
            <h3 className="font-semibold text-black dark:text-white">Message</h3>
            <p className="whitespace-pre-wrap">{occasion.message}</p>
          </div>
        )}
        {agreement?.status === "AwaitingAcceptance" && agreement.contractAddress && (
          <button
            type="button"
            onClick={acceptSponsorship}
            disabled={accepting}
            className="mt-6 rounded-sm bg-primary px-6 py-3 text-white disabled:opacity-50"
          >
            {accepting ? "Accepting…" : "Accept sponsorship"}
          </button>
        )}
        {agreement && <p className="mt-4" role="status">{agreement.status}</p>}
      </div>
    </article>
  );
}
