import { afterEach, expect, it, vi } from "vitest";

const originalUri = process.env.MONGODB_URI;

afterEach(() => {
  process.env.MONGODB_URI = originalUri;
  vi.resetModules();
});

it("defers a missing MongoDB URI error until a request awaits the client", async () => {
  delete process.env.MONGODB_URI;
  vi.resetModules();

  const importedModule = await import("./mongodbClientPromise");

  await expect(importedModule.default).rejects.toThrow("Please add your Mongo URI to .env.local");
});
