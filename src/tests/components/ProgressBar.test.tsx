import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "@/components/domain/ProgressBar";

describe("ProgressBar", () => {
  it("renders progress label", () => {
    render(<ProgressBar value={70} label="Readiness" />);
    expect(screen.getByText("Readiness")).toBeInTheDocument();
    // Component renders "{pct}%" (not "70% complete").
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  it("renders the ARIA progressbar role with correct value", () => {
    render(<ProgressBar value={40} label="Evidence" />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "40");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("clamps values above 100", () => {
    render(<ProgressBar value={150} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "100");
  });

  it("clamps values below 0", () => {
    render(<ProgressBar value={-10} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows green color at 80%+", () => {
    render(<ProgressBar value={80} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("bg-emerald-500");
  });

  it("shows amber color at 50–79%", () => {
    render(<ProgressBar value={65} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("bg-amber-400");
  });

  it("shows red color below 50%", () => {
    render(<ProgressBar value={30} />);
    const bar = screen.getByRole("progressbar");
    expect(bar.className).toContain("bg-red-500");
  });

  it("hides percent display when showPercent=false", () => {
    render(<ProgressBar value={70} label="Test" showPercent={false} />);
    expect(screen.queryByText("70%")).not.toBeInTheDocument();
  });

  it("hides header entirely when no label and showPercent=false", () => {
    const { container } = render(<ProgressBar value={70} showPercent={false} />);
    // The header div should not be rendered.
    expect(container.querySelector(".flex.items-center.justify-between")).not.toBeInTheDocument();
  });
});
