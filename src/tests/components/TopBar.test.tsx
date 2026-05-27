/**
 * TopBar component tests – covers the notification message field bug fix
 * (was: n.message, now: n.title + n.body).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TopBar } from "@/components/layout/TopBar";

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

// Mock LanguageProvider
vi.mock("@/components/providers/LanguageProvider", () => ({
  useI18n: () => ({
    locale: "en",
    setLocale: vi.fn(),
    t: (key: string) => key,
  }),
}));

const defaultProps = {
  orgName: "Acme Corp",
  period: "2024 Annual",
  userName: "Alice Smith",
  onMenuToggle: vi.fn(),
  menuOpen: false,
};

describe("TopBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders org name and period", () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    } as Response);

    render(<TopBar {...defaultProps} />);
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("2024 Annual")).toBeInTheDocument();
  });

  it("renders user initials", () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 } as Response);
    render(<TopBar {...defaultProps} />);
    // "Alice Smith" → "AS"
    expect(screen.getByText("AS")).toBeInTheDocument();
  });

  it("renders notification title and body (not message)", async () => {
    const notifications = [
      {
        id: "n1",
        type: "METRIC_APPROVED",
        title: "Metric Approved",
        body: "Energy Q1 confirmed",
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ notifications, unreadCount: 1 }),
    } as unknown as Response);

    render(<TopBar {...defaultProps} />);

    // Open notification panel.
    const bellBtn = screen.getByLabelText("notifications");
    bellBtn.click();

    await waitFor(() => {
      // Title should be rendered.
      expect(screen.getByText("Metric Approved")).toBeInTheDocument();
      // Body should be rendered.
      expect(screen.getByText("Energy Q1 confirmed")).toBeInTheDocument();
    });
  });

  it("shows unread badge when unreadCount > 0", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [{ id: "n1", type: "T", title: "Hello", body: null, isRead: false, createdAt: "" }],
        unreadCount: 3,
      }),
    } as unknown as Response);

    render(<TopBar {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

  it("shows 9+ badge when unreadCount > 9", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        notifications: [],
        unreadCount: 12,
      }),
    } as unknown as Response);

    render(<TopBar {...defaultProps} />);
    await waitFor(() => {
      expect(screen.getByText("9+")).toBeInTheDocument();
    });
  });

  it("gracefully handles notification fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    // Should not throw.
    expect(() => render(<TopBar {...defaultProps} />)).not.toThrow();
  });
});
