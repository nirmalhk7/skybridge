import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import SkybridgeOccasions from "./index";

const useSession = vi.fn();
vi.mock("next-auth/react", () => ({ useSession: () => useSession() }));

beforeEach(() => {
  vi.restoreAllMocks();
  useSession.mockReset();
});

it("loads lowercase fundraiser opportunities and links each identified detail", async () => {
  useSession.mockReturnValue({
    status: "authenticated",
    data: { user: { id: "user-1", role: "fundraiser", name: "Luna" } },
  });
  const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        occasions: [
          {
            id: "occasion-1",
            name: "STEM Camp",
            typePreference: "events",
            status: "Searching",
            createdDate: "2025-03-02T15:00:00.000Z",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );

  render(<SkybridgeOccasions />);

  expect(await screen.findByText("STEM Camp")).toBeVisible();
  expect(fetchMock).toHaveBeenCalledWith(
    "/api/searchUserOccasion?userId=user-1",
    expect.objectContaining({ method: "GET" }),
  );
  expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
    "href",
    "/fundraiser/occasion-1",
  );
  expect(screen.getByText("Mar 2, 2025")).toBeVisible();
});

it("treats legacy sponsor role as sponsorer and renders match names", async () => {
  useSession.mockReturnValue({
    status: "authenticated",
    data: { user: { id: "sponsor-1", role: "sponsor", name: "Sponsor" } },
  });
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify([
        {
          userId: "fundraiser-1",
          occasion: {
            id: "match-1",
            name: "Robotics Team",
            typePreference: "scholarships",
            status: "Approved",
            createdDate: "2025-04-03T00:00:00.000Z",
          },
        },
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  );

  render(<SkybridgeOccasions />);

  expect(await screen.findByText("Robotics Team")).toBeVisible();
  expect(screen.getByRole("link", { name: "View" })).toHaveAttribute(
    "href",
    "/sponsorer/match-1",
  );
  expect(screen.getByRole("link", { name: "New Search" })).toHaveAttribute(
    "href",
    "/sponsorer/new",
  );
});
