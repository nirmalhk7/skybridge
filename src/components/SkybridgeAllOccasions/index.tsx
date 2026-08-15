"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import Breadcrumb from "../Common/Breadcrumb";
import { useSession } from "next-auth/react";

type AccountRole = "fundraiser" | "sponsorer";

type TableRow = {
  id: string;
  name: string;
  type: string;
  status: string;
  date: string;
};

const normalizeRole = (role?: string): AccountRole | null => {
  const normalized = role?.trim().toLowerCase();
  if (normalized === "fundraiser") return "fundraiser";
  if (normalized === "sponsorer" || normalized === "sponsor") return "sponsorer";
  return null;
};

const formatDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
};

const toRow = (occasion: any): TableRow => ({
  id: String(occasion.id ?? occasion._id ?? ""),
  name: occasion.name || occasion.message || "Untitled opportunity",
  type: occasion.typePreference || "—",
  status: occasion.status || "Unknown",
  date: formatDate(occasion.createdDate),
});

const SkybridgeOccasions: React.FC = () => {
  const { data: session, status } = useSession();
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const role = useMemo(() => normalizeRole(session?.user?.role), [session?.user?.role]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id || !role) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");

    const url = role === "fundraiser"
      ? `/api/searchUserOccasion?userId=${encodeURIComponent(session.user.id)}`
      : `/api/searchOccasion?sponsorerId=${encodeURIComponent(session.user.id)}`;

    fetch(url, { method: "GET", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load dashboard");
        return data;
      })
      .then((data) => {
        const occasions = role === "fundraiser"
          ? data.occasions || []
          : Array.isArray(data)
            ? data.map((match) => match.occasion)
            : [];
        setTableData(occasions.map(toRow));
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") {
          setError(requestError.message || "Unable to load dashboard");
          setTableData([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [role, session?.user?.id, status]);

  const isFundraiser = role === "fundraiser";
  const accountType = isFundraiser ? "Fundraiser" : role === "sponsorer" ? "Sponsor" : "Unknown";
  const routeRole = isFundraiser ? "fundraiser" : "sponsorer";

  return (
    <>
      <Breadcrumb
        pageName="Skybridge Dashboard"
        description={`You're using a ${accountType} account`}
      />
      <div className="container py-8">
        <div className="mb-12 rounded-sm bg-white px-8 py-11 shadow-three dark:bg-gray-dark sm:p-[55px] lg:mb-5 lg:px-8 xl:p-[55px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-2xl font-bold text-black dark:text-white sm:text-3xl">
              All {isFundraiser ? "Opportunities" : "Matches"}
            </h3>
            {role && (
              <Link href={`/${routeRole}/new`} className="bg-primary p-4 text-white">
                New {isFundraiser ? "Opportunity" : "Search"}
              </Link>
            )}
          </div>
          {error && <p role="alert" className="mb-4 text-red-500">{error}</p>}
          {loading ? (
            <p>Loading…</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:bg-gray-dark">
              <thead>
                <tr>
                  <th>Name</th><th>Type</th><th>Status</th><th>Created At</th><th></th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row) => (
                  <tr key={row.id}>
                    <td className="font-medium">{row.name}</td>
                    <td>{row.type}</td>
                    <td>{row.status}</td>
                    <td>{row.date}</td>
                    <td>
                      <Link href={`/${routeRole}/${row.id}`} className="text-primary hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
                {tableData.length === 0 && (
                  <tr><td colSpan={5}>No {isFundraiser ? "opportunities" : "matches"} found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
};

export default SkybridgeOccasions;
