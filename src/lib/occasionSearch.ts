export type OccasionSearchQuery = Record<string, string>;

const SEARCH_FIELDS = new Set([
  "typePreference",
  "countryPreference",
  "statePreference",
  "agePreference",
]);

export function buildOccasionSearchQuery(
  searchParams: URLSearchParams,
  currentSponsorId?: string,
): OccasionSearchQuery {
  const query: OccasionSearchQuery = {};
  for (const [key, rawValue] of searchParams.entries()) {
    const value = rawValue.trim();
    if (!value) throw new Error(`Invalid ${key}`);
    if (key === "sponsorerId") {
      if (!currentSponsorId || value !== currentSponsorId) {
        throw new Error("Forbidden sponsorerId");
      }
      query["occasions.sponsorerId"] = value;
      query["occasions.status"] = "Approved";
      continue;
    }
    if (key === "status") {
      if (value !== "Searching") throw new Error("Invalid status");
      query["occasions.status"] = value;
      continue;
    }
    if (!SEARCH_FIELDS.has(key)) throw new Error(`Unknown filter: ${key}`);
    query[`occasions.${key}`] = value;
  }
  if (!("occasions.sponsorerId" in query)) {
    query["occasions.status"] = "Searching";
  }
  return query;
}

export function buildOccasionSearchPipeline(query: OccasionSearchQuery) {
  const elementQuery = Object.fromEntries(
    Object.entries(query).map(([key, value]) => [key.replace("occasions.", ""), value]),
  );
  return [
    { $match: { occasions: { $elemMatch: elementQuery } } },
    { $project: { occasions: 1 } },
    { $unwind: "$occasions" },
    { $match: query },
    { $sort: { "occasions.score": -1 } },
    {
      $project: {
        _id: 0,
        userId: "$_id",
        occasion: {
          id: "$occasions.id",
          name: "$occasions.name",
          typePreference: "$occasions.typePreference",
          countryPreference: "$occasions.countryPreference",
          statePreference: "$occasions.statePreference",
          agePreference: "$occasions.agePreference",
          message: "$occasions.message",
          status: "$occasions.status",
          score: { $ifNull: ["$occasions.score", "N/A"] },
          createdDate: "$occasions.createdDate",
        },
      },
    },
    { $limit: 100 },
  ];
}
