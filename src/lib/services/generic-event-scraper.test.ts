import { describe, it, expect } from "vitest";
import { parseGenericEventHtml } from "./generic-event-scraper";

// ── Helpers ──────────────────────────────────────────────────────────────────

function buildHtml(body: string, head = ""): string {
  return `<!DOCTYPE html><html><head>${head}</head><body>${body}</body></html>`;
}

const SOURCE_URL = "https://example.com/events/race-day";

// ── Schema.org JSON-LD ───────────────────────────────────────────────────────

describe("parseGenericEventHtml — JSON-LD", () => {
  it("extracts name from Event JSON-LD", () => {
    const ld = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Event",
      name: "Spring Autocross 2026",
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("Spring Autocross 2026");
  });

  it("extracts startDate from JSON-LD and converts to ISO date", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      startDate: "2026-06-15T08:00:00Z",
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.startDate).toBe("2026-06-15");
  });

  it("extracts endDate from JSON-LD", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      startDate: "2026-06-15",
      endDate: "2026-06-16",
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.endDate).toBe("2026-06-16");
  });

  it("extracts location name from JSON-LD", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      location: { name: "Laguna Seca" },
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.venueName).toBe("Laguna Seca");
  });

  it("extracts address string from JSON-LD", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      location: { address: "1 Raceway Dr, Salinas, CA" },
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.address).toBe("1 Raceway Dr, Salinas, CA");
  });

  it("joins structured address parts from JSON-LD", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      location: {
        address: {
          streetAddress: "1 Raceway Dr",
          addressLocality: "Salinas",
          addressRegion: "CA",
        },
      },
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.address).toBe("1 Raceway Dr, Salinas, CA");
  });

  it("extracts organizer name from JSON-LD", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      organizer: { name: "SoCal Timing Association" },
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.organizingBody).toBe("SoCal Timing Association");
  });

  it("handles @graph array containing an Event node", () => {
    const ld = JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebSite", name: "Track Events" },
        { "@type": "Event", name: "Club Race April", startDate: "2026-04-20" },
      ],
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("Club Race April");
    expect(result.startDate).toBe("2026-04-20");
  });

  it("handles JSON-LD array directly", () => {
    const ld = JSON.stringify([
      { "@type": "Organization", name: "Club" },
      { "@type": "Event", name: "Array Event", startDate: "2026-05-01" },
    ]);
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("Array Event");
  });

  it("skips non-Event JSON-LD types", () => {
    const ld = JSON.stringify({ "@type": "Organization", name: "Club" });
    const html = buildHtml(
      "<title>Some Page</title>",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    // Falls through to <title>
    expect(result.name).toBe("Some Page");
  });

  it("survives malformed JSON-LD", () => {
    const html = buildHtml(
      "",
      `<script type="application/ld+json">{ not valid json </script><title>Fallback Title</title>`,
    );
    expect(() => parseGenericEventHtml(html, SOURCE_URL)).not.toThrow();
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("Fallback Title");
  });
});

// ── OpenGraph fallbacks ───────────────────────────────────────────────────────

describe("parseGenericEventHtml — OpenGraph fallbacks", () => {
  it("falls back to og:title for name", () => {
    const html = buildHtml(
      "",
      `<meta property="og:title" content="OG Event Name">`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("OG Event Name");
  });

  it("falls back to og:site_name for organizingBody", () => {
    const html = buildHtml(
      "",
      `<meta property="og:site_name" content="Speed Club">`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.organizingBody).toBe("Speed Club");
  });

  it("falls back to event:start_time for startDate", () => {
    const html = buildHtml(
      "",
      `<meta property="event:start_time" content="2026-08-10T09:00:00+00:00">`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.startDate).toBe("2026-08-10");
  });
});

// ── <title> stripping ────────────────────────────────────────────────────────

describe("parseGenericEventHtml — title stripping", () => {
  it("strips site name after pipe", () => {
    const html = buildHtml("<title>My Race Event | Track Days Inc</title>");
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("My Race Event");
  });

  it("strips site name after dash", () => {
    const html = buildHtml("<title>Summer Autocross - MotorsportReg</title>");
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("Summer Autocross");
  });

  it("keeps full title when no separator", () => {
    const html = buildHtml("<title>Solo Event 2026</title>");
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("Solo Event 2026");
  });
});

// ── itemprop fallbacks ────────────────────────────────────────────────────────

describe("parseGenericEventHtml — itemprop fallbacks", () => {
  it("reads startDate from itemprop datetime attribute", () => {
    const html = buildHtml(
      `<time itemprop="startDate" datetime="2026-07-04">July 4, 2026</time>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.startDate).toBe("2026-07-04");
  });

  it("reads endDate from itemprop datetime attribute", () => {
    const html = buildHtml(
      `<time itemprop="endDate" datetime="2026-07-05">July 5, 2026</time>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.endDate).toBe("2026-07-05");
  });

  it("reads venue from [itemprop=location] text", () => {
    const html = buildHtml(
      `<span itemprop="location">Thunderhill Raceway</span>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.venueName).toBe("Thunderhill Raceway");
  });

  it("reads street address from itemprop", () => {
    const html = buildHtml(
      `<span itemprop="streetAddress">5250 Hwy 162 W, Willows, CA 95988</span>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.address).toBe("5250 Hwy 162 W, Willows, CA 95988");
  });
});

// ── Registration URL ──────────────────────────────────────────────────────────

describe("parseGenericEventHtml — registrationUrl", () => {
  it("always sets registrationUrl to sourceUrl", () => {
    const result = parseGenericEventHtml("<html></html>", SOURCE_URL);
    expect(result.registrationUrl).toBe(SOURCE_URL);
  });
});

// ── Entry fee extraction ──────────────────────────────────────────────────────

describe("parseGenericEventHtml — entry fee", () => {
  it("extracts dollar amount near fee keyword", () => {
    const html = buildHtml(`<p>Entry fee: $45.00</p>`);
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.entryFee).toBe(45);
  });

  it("extracts dollar amount near price keyword", () => {
    const html = buildHtml(`<span>price: $120</span>`);
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.entryFee).toBe(120);
  });

  it("ignores amounts over $9999", () => {
    const html = buildHtml(`<p>Entry fee: $12,000.00</p>`);
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.entryFee).toBeUndefined();
  });

  it("extracts amounts with comma-formatted numbers", () => {
    const html = buildHtml(`<p>Register cost: $1,500.00</p>`);
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.entryFee).toBe(1500);
  });

  it("does not extract fee when no keyword present", () => {
    const html = buildHtml(`<p>Contact us at info@track.com</p>`);
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.entryFee).toBeUndefined();
  });
});

// ── Date edge cases ───────────────────────────────────────────────────────────

describe("parseGenericEventHtml — date edge cases", () => {
  it("skips invalid date strings", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      startDate: "not-a-date",
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.startDate).toBeUndefined();
  });

  it("handles ISO date-only strings", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      startDate: "2026-09-12",
    });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.startDate).toBe("2026-09-12");
  });
});

// ── Resilience ───────────────────────────────────────────────────────────────

describe("parseGenericEventHtml — resilience", () => {
  it("returns empty object for empty HTML", () => {
    const result = parseGenericEventHtml("", SOURCE_URL);
    // registrationUrl is always set; no other fields should be set
    expect(result.name).toBeUndefined();
    expect(result.startDate).toBeUndefined();
  });

  it("never throws on garbage input", () => {
    expect(() =>
      parseGenericEventHtml("<<>>&&%%$$##@@", SOURCE_URL),
    ).not.toThrow();
  });

  it("prefers JSON-LD name over og:title", () => {
    const ld = JSON.stringify({ "@type": "Event", name: "LD Name" });
    const html = buildHtml(
      "",
      `<script type="application/ld+json">${ld}</script>
       <meta property="og:title" content="OG Name">`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.name).toBe("LD Name");
  });

  it("prefers JSON-LD startDate over itemprop", () => {
    const ld = JSON.stringify({
      "@type": "Event",
      name: "Race",
      startDate: "2026-03-01",
    });
    const html = buildHtml(
      `<time itemprop="startDate" datetime="2026-04-01">April</time>`,
      `<script type="application/ld+json">${ld}</script>`,
    );
    const result = parseGenericEventHtml(html, SOURCE_URL);
    expect(result.startDate).toBe("2026-03-01");
  });
});
