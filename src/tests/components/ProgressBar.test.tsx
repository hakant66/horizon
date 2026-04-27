import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProgressBar } from "@/components/domain/ProgressBar";

describe("ProgressBar", () => {
  it("renders progress label", () => {
    render(<ProgressBar value={70} label="Readiness" />);
    expect(screen.getByText("Readiness")).toBeInTheDocument();
    expect(screen.getByText("70% complete")).toBeInTheDocument();
  });
});
