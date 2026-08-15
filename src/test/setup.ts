import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, vi } from "vitest";

beforeAll(() => {
  const alertMock = vi.fn();
  vi.stubGlobal("alert", alertMock);
});

afterEach(() => cleanup());
