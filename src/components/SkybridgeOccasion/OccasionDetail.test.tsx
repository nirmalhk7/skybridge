import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import OccasionDetail from "./OccasionDetail";

const mocks = vi.hoisted(() => ({ getSigner: vi.fn(), accept: vi.fn() }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "507f1f77bcf86cd799439011", role: "fundraiser" } }, status: "authenticated" }),
}));
vi.mock("ethers", () => ({
  BrowserProvider: class { getSigner = mocks.getSigner; },
  Contract: class { acceptSponsorship = mocks.accept; },
}));

it("accepts a pending agreement from the participant wallet and records it", async () => {
  mocks.getSigner.mockResolvedValue({ getAddress: vi.fn().mockResolvedValue("0x0000000000000000000000000000000000000002") });
  mocks.accept.mockResolvedValue({ hash: `0x${"a".repeat(64)}`, wait: vi.fn().mockResolvedValue(undefined) });
  Object.defineProperty(window, "ethereum", { configurable: true, value: {} });
  const fetchMock = vi.spyOn(globalThis, "fetch")
    .mockResolvedValueOnce(new Response(JSON.stringify({ occasion: { id: "64b64c7f2f3e4a0012345670", name: "Science", status: "Approved" } }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ agreementId: "64b64c7f2f3e4a0012345678", status: "AwaitingAcceptance", contractAddress: "0x0000000000000000000000000000000000000003", abi: [], fundraiserAddress: "0x0000000000000000000000000000000000000002" }), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ status: "ReceiverAccepted" }), { status: 200 }));

  render(<OccasionDetail occasionId="64b64c7f2f3e4a0012345670" />);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Accept sponsorship" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  expect(JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)).toMatchObject({ action: "recordAcceptance", agreementId: "64b64c7f2f3e4a0012345678" });
  expect(await screen.findByText("ReceiverAccepted")).toBeVisible();
});
