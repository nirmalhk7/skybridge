import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import FundraiserOccasion from "./FundraiserOccasion";
import SponsorerOccasion from "./SponsorerOccasion";

const ethersMocks = vi.hoisted(() => ({
  deploy: vi.fn(),
  getSigner: vi.fn(),
  getNetwork: vi.fn(),
  parseEther: vi.fn(),
}));

vi.mock("ethers", () => ({
  BrowserProvider: class {
    getSigner = ethersMocks.getSigner;
    getNetwork = ethersMocks.getNetwork;
  },
  ContractFactory: class {
    deploy = ethersMocks.deploy;
  },
  parseEther: ethersMocks.parseEther,
}));

const useSession = vi.fn();
const getCountries = vi.fn();
const getState = vi.fn();

vi.mock("next-auth/react", () => ({ useSession: () => useSession() }));
vi.mock("react-country-state-city", () => ({
  GetCountries: (...args: unknown[]) => getCountries(...args),
  GetState: (...args: unknown[]) => getState(...args),
}));

beforeEach(() => {
  vi.restoreAllMocks();
  useSession.mockReset();
  getCountries.mockReset();
  getState.mockReset();
  getCountries.mockResolvedValue([
    { id: 1, name: "Canada" },
    { id: 2, name: "United States" },
  ]);
  getState.mockImplementation(async (countryId: number) =>
    countryId === 2
      ? [{ id: 20, name: "Colorado" }]
      : [{ id: 10, name: "Ontario" }],
  );
  ethersMocks.deploy.mockReset();
  ethersMocks.getSigner.mockReset();
  ethersMocks.getNetwork.mockReset();
  ethersMocks.parseEther.mockReset();
});

describe("FundraiserOccasion", () => {
  it("derives valid initial country, state and age selections", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "user-1", name: "Luna", email: "luna@example.com" } },
    });
    render(<FundraiserOccasion />);

    expect(await screen.findByLabelText("Country Preference")).toHaveValue("1");
    expect(await screen.findByLabelText("State Preference")).toHaveValue("10");
    expect(screen.getByLabelText("Age Preference")).toHaveValue("10-19");
  });

  it("resets state to one belonging to a newly selected country", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "user-1", name: "Luna", email: "luna@example.com" } },
    });
    const user = userEvent.setup();
    render(<FundraiserOccasion />);
    const country = await screen.findByLabelText("Country Preference");

    await user.selectOptions(country, "2");

    await waitFor(() => expect(screen.getByLabelText("State Preference")).toHaveValue("20"));
  });

  it("guards submission when session data is unavailable", async () => {
    useSession.mockReturnValue({ status: "unauthenticated", data: null });
    const alertMock = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<FundraiserOccasion />);

    await user.click(screen.getByRole("button", { name: "Submit" }));

    expect(alertMock).toHaveBeenCalledWith("Please sign in before creating an opportunity.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("SponsorerOccasion", () => {
  it("uses a relative URL and requests only searching opportunities", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "sponsor-1", name: "Sponsor", email: "s@example.com" } },
    });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const user = userEvent.setup();
    render(<SponsorerOccasion />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url.startsWith("/api/searchOccasion?")).toBe(true);
    expect(new URLSearchParams(url.split("?")[1]).get("status")).toBe("Searching");
  });

  it("disables approval for results that are no longer searching", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "sponsor-1", name: "Sponsor", email: "s@example.com" } },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            userId: "user-1",
            occasion: {
              id: "occasion-1",
              message: "Already matched",
              score: 80,
              status: "Approved",
            },
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    const user = userEvent.setup();
    render(<SponsorerOccasion />);

    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByRole("button", { name: "Approved" })).toBeDisabled();
  });

  it("deploys an approved agreement from the connected sponsor wallet and records it", async () => {
    useSession.mockReturnValue({
      status: "authenticated",
      data: { user: { id: "sponsor-1", name: "Sponsor", email: "s@example.com" } },
    });
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: { request: vi.fn() },
    });
    const signer = { getAddress: vi.fn().mockResolvedValue("0xSponsor") };
    const deploymentTransaction = { hash: "0xtx" };
    ethersMocks.getSigner.mockResolvedValue(signer);
    ethersMocks.getNetwork.mockResolvedValue({ chainId: 31337n });
    ethersMocks.parseEther.mockReturnValue(15_000_000_000_000_000n);
    ethersMocks.deploy.mockResolvedValue({
      waitForDeployment: vi.fn().mockResolvedValue(undefined),
      getAddress: vi.fn().mockResolvedValue("0xContract"),
      deploymentTransaction: () => deploymentTransaction,
    });

    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify([{
        userId: "user-1",
        occasion: { id: "occasion-1", message: "Fund me", status: "Searching" },
      }]), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        success: true,
        fundraiser: { email: "fund@example.com", accountAddress: "0xFund" },
        sponsor: { accountAddress: "0xSponsor" },
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        agreementId: "agreement-1",
        deployment: {
          abi: [],
          bytecode: "0x6000",
          constructorArgs: ["0xSponsor", "0xFund", 2_592_000],
          from: "0xSponsor",
          value: "15000000000000000",
        },
      }), { status: 201, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        agreementId: "agreement-1",
        status: "AwaitingAcceptance",
      }), { status: 200, headers: { "Content-Type": "application/json" } }));
    const user = userEvent.setup();
    render(<SponsorerOccasion />);

    await user.click(screen.getByRole("button", { name: "Search" }));
    await user.click(await screen.findByRole("button", { name: "Approve?" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls[2][0]).toBe("/api/deployContract");
    expect(JSON.parse((fetchMock.mock.calls[2][1] as RequestInit).body as string)).toEqual({
      action: "prepare",
      occasionId: "occasion-1",
      amountInWei: "15000000000000000",
      durationSeconds: 2592000,
    });
    expect(JSON.parse((fetchMock.mock.calls[3][1] as RequestInit).body as string)).toEqual({
      action: "recordDeployment",
      agreementId: "agreement-1",
      contractAddress: "0xContract",
      transactionHash: "0xtx",
      chainId: "31337",
    });
  });
});
