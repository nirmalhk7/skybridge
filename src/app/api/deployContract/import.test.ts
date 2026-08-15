import { expect, it, vi } from "vitest";

vi.mock("@/lib/mongodbClientPromise", () => ({
  default: Promise.resolve({}),
}));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));

it("loads without an ignored build/contracts artifact", async () => {
  let loadError: unknown;
  try {
    await import("./route");
  } catch (error) {
    loadError = error;
  }
  expect(loadError).toBeUndefined();
});
