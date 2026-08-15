import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import Header from "./index";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: vi.fn(),
}));
vi.mock("./ThemeToggler", () => ({ default: () => <span>Theme</span> }));

it("opens a mobile navigation containing authentication actions", async () => {
  const user = userEvent.setup();
  render(<Header />);

  const toggle = screen.getByRole("button", { name: "Open navigation" });
  await user.click(toggle);

  expect(screen.getByRole("navigation", { name: "Mobile navigation" })).toBeVisible();
  expect(screen.getAllByRole("link", { name: "Sign In" })).not.toHaveLength(0);
  expect(screen.getAllByRole("link", { name: "Sign Up" })).not.toHaveLength(0);
});
