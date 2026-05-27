import { describe, expect, it } from "vitest";
import { buildCsv } from "@/lib/csv";

describe("buildCsv", () => {
  it("produces header + data rows", () => {
    const csv = buildCsv(["name", "value"], [["Electricity", 1000], ["Gas", 500]]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("name,value");
    expect(lines[1]).toBe("Electricity,1000");
    expect(lines[2]).toBe("Gas,500");
  });

  it("escapes commas in cell values", () => {
    const csv = buildCsv(["name"], [["Istanbul, Turkey"]]);
    expect(csv).toContain('"Istanbul, Turkey"');
  });

  it("escapes double quotes in cell values", () => {
    const csv = buildCsv(["note"], [['He said "hello"']]);
    expect(csv).toContain('"He said ""hello"""');
  });

  it("handles null and undefined as empty strings", () => {
    const csv = buildCsv(["a", "b"], [[null, undefined]]);
    expect(csv.split("\n")[1]).toBe(",");
  });

  it("handles newlines in cell values", () => {
    const csv = buildCsv(["text"], [["line1\nline2"]]);
    expect(csv).toContain('"line1\nline2"');
  });

  it("produces empty rows for no data", () => {
    const csv = buildCsv(["a", "b"], []);
    expect(csv.trim()).toBe("a,b");
  });

  it("handles numeric values directly", () => {
    const csv = buildCsv(["value"], [[42.5]]);
    expect(csv.split("\n")[1]).toBe("42.5");
  });

  it("handles boolean values", () => {
    const csv = buildCsv(["flag"], [[true], [false]]);
    const lines = csv.split("\n");
    expect(lines[1]).toBe("true");
    expect(lines[2]).toBe("false");
  });
});

describe("CSV filename construction", () => {
  it("period slug uses first 8 chars of ID", () => {
    const periodId = "clxyz1234567890";
    const slug = periodId.slice(0, 8);
    expect(slug).toBe("clxyz123");
    expect(`metrics-${slug}.csv`).toBe("metrics-clxyz123.csv");
  });

  it("no period ID produces plain filename", () => {
    const filename = `metrics.csv`;
    expect(filename).toBe("metrics.csv");
  });
});
