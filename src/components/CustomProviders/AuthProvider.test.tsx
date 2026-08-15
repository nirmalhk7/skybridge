import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import AuthProvider from "./AuthProvider";

const replace = vi.fn();
const usePathname = vi.fn();
const useSession = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useRouter: () => ({ replace }),
}));
vi.mock("next-auth/react", () => ({ useSession: () => useSession() }));

beforeEach(() => {
  replace.mockReset();
  usePathname.mockReset();
  useSession.mockReset();
});

it("keeps public contact page accessible without a session", async () => {
  usePathname.mockReturnValue("/contact");
  useSession.mockReturnValue({ data: null, status: "unauthenticated" });

  render(<AuthProvider><span>Contact</span></AuthProvider>);

  expect(screen.getByText("Contact")).toBeVisible();
  await waitFor(() => expect(replace).not.toHaveBeenCalled());
});

it("redirects a signed-out private route to sign in", async () => {
  usePathname.mockReturnValue("/dashboard");
  useSession.mockReturnValue({ data: null, status: "unauthenticated" });

  render(<AuthProvider><span>Private</span></AuthProvider>);

  await waitFor(() => expect(replace).toHaveBeenCalledWith("/signin"));
});
