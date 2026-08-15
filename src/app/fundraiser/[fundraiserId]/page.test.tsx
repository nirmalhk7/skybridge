import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import FundraiserStatus from "./page";

vi.mock("next/navigation", () => ({
  useParams: () => ({ fundraiserId: "occasion-7" }),
}));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "user-7" } }, status: "authenticated" }),
}));
vi.mock("@/components/Common/Breadcrumb", () => ({
  default: ({ description }: { description: string }) => <p>{description}</p>,
}));

it("loads and renders the opportunity identified by the route", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(
      JSON.stringify({
        occasion: {
          id: "occasion-7",
          name: "Science Fair",
          email: "fair@example.com",
          message: "Help students travel",
          status: "Searching",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    ),
  ).mockResolvedValueOnce(new Response(JSON.stringify({ error: "Agreement not found" }), { status: 404 }));

  render(<FundraiserStatus />);

  expect(await screen.findByText("Science Fair")).toBeVisible();
  expect(screen.getByText("Help students travel")).toBeVisible();
  expect(globalThis.fetch).toHaveBeenCalledWith(
    "/api/searchUserOccasion?userId=user-7&occasionId=occasion-7",
    expect.objectContaining({ cache: "no-store" }),
  );
});
