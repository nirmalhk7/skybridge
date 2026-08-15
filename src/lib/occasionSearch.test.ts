import assert from "node:assert/strict";
import test from "node:test";
import {
  buildOccasionSearchPipeline,
  buildOccasionSearchQuery,
} from "./occasionSearch.ts";

test("buildOccasionSearchQuery prefixes every search parameter with occasions", () => {
  const params = new URLSearchParams({
    typePreference: "scholarships",
    countryPreference: "233",
  });

  assert.deepEqual(buildOccasionSearchQuery(params), {
    "occasions.typePreference": "scholarships",
    "occasions.countryPreference": "233",
    "occasions.status": "Searching",
  });
});

test("buildOccasionSearchQuery rejects unknown fields", () => {
  assert.throws(
    () => buildOccasionSearchQuery(new URLSearchParams({ $where: "true" })),
    /Unknown filter/,
  );
});

test("buildOccasionSearchPipeline correlates and sorts individual occasions", () => {
  const query = {
    "occasions.typePreference": "scholarships",
    "occasions.status": "Searching",
  };
  const pipeline = buildOccasionSearchPipeline(query);

  assert.deepEqual(pipeline[0], {
    $match: {
      occasions: {
        $elemMatch: { typePreference: "scholarships", status: "Searching" },
      },
    },
  });
  assert.deepEqual(pipeline[1], { $project: { occasions: 1 } });
  assert.deepEqual(pipeline[2], { $unwind: "$occasions" });
  assert.deepEqual(pipeline[3], { $match: query });
  assert.deepEqual(pipeline[4], { $sort: { "occasions.score": -1 } });
});
