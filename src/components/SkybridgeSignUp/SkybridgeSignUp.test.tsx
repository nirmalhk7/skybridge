import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SkybridgeSignUp from "./page";

const push = vi.fn();
const signIn = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next-auth/react", () => ({ signIn: (...args: unknown[]) => signIn(...args) }));

describe("SkybridgeSignUp", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    push.mockReset();
    signIn.mockReset();
    signIn.mockResolvedValue({ ok: true });
  });

  async function completeForm() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Full Name"), "Luna Org");
    await user.type(screen.getByLabelText("Email"), "luna@example.com");
    await user.type(screen.getByLabelText("Your Password"), "secret123");
    await user.type(screen.getByLabelText("Your Web3 Address"), "0x1234");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
  }

  it("sends the wallet address and canonical fundraiser role", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<SkybridgeSignUp />);

    await completeForm();

    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard"));
    const request = fetchMock.mock.calls[0];
    expect(request[0]).toBe("/api/signup");
    expect(JSON.parse((request[1] as RequestInit).body as string)).toEqual({
      name: "Luna Org",
      email: "luna@example.com",
      password: "secret123",
      accountAddress: "0x1234",
      role: "fundraiser",
    });
  });

  it("shows an API error and does not attempt sign-in", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Wallet address already registered" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<SkybridgeSignUp />);

    await completeForm();

    expect(await screen.findByText("Wallet address already registered")).toBeVisible();
    expect(signIn).not.toHaveBeenCalled();
  });
});
