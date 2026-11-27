"use client";

import { useMemo, useState } from "react";
import { AxisBar } from "./AxisBar";
import { Compass, type Dot, type Vector } from "./Compass";
import { Segmented } from "./Segmented";
import { WORLDS } from "@/lib/items";
import {
  clusterPoints,
  clusterVectors,
  getZone,
  groupStats,
  readSpread,
  type Mode,
  type Point,
} from "@/lib/scoring";
import { C, DISPLAY_TRACKING, DISPLAY_WEIGHT, FB, FD, FM } from "@/lib/theme";
import { usePoll } from "@/lib/usePoll";

type Row = { id: string; today: Point | null; target: Point };
type Payload = { closed: boolean; count: number; responses: Row[] };

type Who = "individual" | "aggregate";
type What = "today" | "tomorrow" | "both";

const CAPTIONS: Record<Who, Record<What, string>> = {
  individual: {
    today: "Do we even describe the same company today?",
    tomorrow: "Is there a shared direction, or several?",
    both: "Each arrow is one leader's agenda. A tight bundle means alignment.",
  },
  aggregate: {
    today: "The group's centre of gravity on the present.",
    tomorrow: "The group's centre of gravity on the target culture.",
    both: "The collective shift — an average, not a consensus.",
  },
};

export function ResultsBoard({
  code,
  secret,
  title,
  mode,
}: {
  code: string;
  secret: string;
  title: string;
  /** `target`: tomorrow-only session — nothing to show for Today, nor any movement. */
  mode: Mode;
}) {
  const both = mode === "both";
  const base = `/api/s/${encodeURIComponent(code)}`;
  const { data, status, setData } = usePoll<Payload>(`${base}/results?k=${encodeURIComponent(secret)}`);

  const [who, setWho] = useState<Who>("individual");
  const [what, setWhat] = useState<What>(both ? "today" : "tomorrow");
  const [closing, setClosing] = useState(false);

  const rows = data?.responses ?? [];
  const stats = useMemo(() => groupStats(rows.map((r) => ({ today: r.today, target: r.target }))), [rows]);

  const view = useMemo(() => {
    const dots: Dot[] = [];
    const vectors: Vector[] = [];
    if (!stats) return { dots, vectors };

    const wantToday = what === "today" || what === "both";
    const wantTarget = what === "tomorrow" || what === "both";

    if (who === "individual") {
      const plural = (n: number) => `${n} ${n === 1 ? "response" : "responses"}`;
      if (wantToday) {
        for (const c of clusterPoints(rows.flatMap((r) => (r.today ? [r.today] : [])))) {
          dots.push({ x: c.x, y: c.y, kind: "today", count: c.count, label: plural(c.count) });
        }
      }
      if (wantTarget) {
        for (const c of clusterPoints(rows.map((r) => r.target))) {
          dots.push({ x: c.x, y: c.y, kind: "target", count: c.count, label: plural(c.count) });
        }
      }
      if (what === "both") {
        const pairs = rows.flatMap((r) => (r.today ? [{ from: r.today, to: r.target }] : []));
        for (const v of clusterVectors(pairs)) {
          vectors.push({ x1: v.from.x, y1: v.from.y, x2: v.to.x, y2: v.to.y, count: v.count });
        }
        // No group-mean arrow here on purpose: this view is the fan of
        // individual agendas, and a mean belongs to the Aggregate view.
      }
    } else {
      const ct = stats.centroidToday;
      if (wantToday && ct) dots.push({ x: ct.x, y: ct.y, kind: "today", bold: true });
      if (wantTarget)
        dots.push({ x: stats.centroidTarget.x, y: stats.centroidTarget.y, kind: "target", bold: true });
      if (what === "both" && ct) {
        vectors.push({ x1: ct.x, y1: ct.y, x2: stats.centroidTarget.x, y2: stats.centroidTarget.y, bold: true });
      }
    }
    return { dots, vectors };
  }, [who, what, rows, stats]);

  const zone = stats ? getZone(stats.centroidTarget.x, stats.centroidTarget.y) : null;
  const world = zone ? WORLDS[zone] : null;

  async function close() {
    if (!window.confirm("Close the session? No further responses will be accepted.")) return;
    setClosing(true);
    try {
      await fetch(`${base}/close?k=${encodeURIComponent(secret)}`, { method: "POST" });
      setData((d) => (d ? { ...d, closed: true } : d));
    } finally {
      setClosing(false);
    }
  }

  const count = data?.count ?? 0;
  const chip = {
    minHeight: "38px",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 14px",
    borderRadius: "8px",
    border: `1.5px solid ${C.border}`,
    background: C.surface,
    fontSize: "14px",
    fontFamily: FB,
    textDecoration: "none",
  } as const;

  return (
    <div className="rb-root" style={{ background: C.bg }}>
      {/* ── header ───────────────────────────────────────────── */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "16px", flexWrap: "wrap" }}>
          <h1
            style={{
              fontFamily: FD,
              fontSize: "clamp(22px, 2.1vw, 34px)",
              fontWeight: DISPLAY_WEIGHT,
              letterSpacing: DISPLAY_TRACKING,
              color: C.text,
              margin: 0,
              lineHeight: 1.05,
            }}
          >
            The team on the compass
          </h1>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: C.t3,
            }}
          >
            {title} · {code}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
            <span style={{ fontFamily: FM, fontSize: "clamp(22px, 2.1vw, 34px)", color: C.accent }}>
              {count}
            </span>
            <span style={{ fontSize: "14px", color: C.t2 }}>
              {count === 1 ? "response" : "responses"}
              {status === "stale" && " · reconnecting"}
              {data?.closed && " · closed"}
            </span>
          </div>
          <a href={`${base}/export?k=${encodeURIComponent(secret)}`} style={{ ...chip, color: C.t2 }}>
            Export CSV
          </a>
          <button
            type="button"
            onClick={close}
            disabled={closing || Boolean(data?.closed)}
            style={{
              ...chip,
              color: data?.closed ? C.t3 : C.t2,
              cursor: data?.closed ? "default" : "pointer",
            }}
          >
            {data?.closed ? "Session closed" : "Close session"}
          </button>
        </div>
      </header>

      {/* ── matrix, with the controls beside it ─────────── */}
      <div className="rb-main">
        <aside className="rb-controls">
          <Segmented<Who>
            label="Whose data"
            value={who}
            onChange={setWho}
            scale={1.25}
            className="seg"
            options={[
              ["individual", "Individual"],
              ["aggregate", "Aggregate"],
            ]}
          />
          {/* A tomorrow-only session has a single thing to show, so no selector:
              a one-option control would be a button that does nothing. */}
          {both && (
            <Segmented<What>
              label="What is shown"
              value={what}
              onChange={setWhat}
              scale={1.25}
              className="seg"
              options={[
                ["today", "Today"],
                ["tomorrow", "Tomorrow"],
                ["both", "Both + movement"],
              ]}
            />
          )}
          <p style={{ fontSize: "14px", color: C.t2, margin: 0, lineHeight: 1.55 }}>
            {CAPTIONS[who][what]}
          </p>

        </aside>

        <div className="rb-stage">
          <div
            className="rb-canvas"
            style={{
              background: C.surface,
              borderRadius: "14px",
              border: `1.5px solid ${C.border}`,
              padding: "10px",
            }}
          >
            <Compass
              size={300}
              fill
              dots={view.dots}
              vectors={view.vectors}
              legend={what === "both" ? "both" : what === "today" ? "today" : "tomorrow"}
            />
            {!stats && (
              <p
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  color: C.t3,
                  margin: 0,
                  pointerEvents: "none",
                }}
              >
                {status === "loading" ? "Loading…" : "Waiting for the first response"}
              </p>
            )}
          </div>
        </div>

        {/* ── read-outs, visible in every combination ─────────── */}
        {/* Three of the four need a today position. In a tomorrow-only session
            they have nothing to measure, so they are left out rather than
            shown as a dash that invites the question. */}
        <aside className="rb-side">
          {both && (
            <ReadOut
              label="Spread on today"
              value={stats?.spreadToday != null ? stats.spreadToday.toFixed(2) : "—"}
              band={stats?.spreadToday != null ? readSpread(stats.spreadToday) : null}
              note="Mean distance to the centre of gravity. High means the team is not describing the same way of working today."
            />
          )}
          <ReadOut
            label="Spread on tomorrow"
            value={stats ? stats.spreadTarget.toFixed(2) : "—"}
            band={stats ? readSpread(stats.spreadTarget) : null}
            note="High means there is no shared cultural direction. That is the subject to handle before the Bridges."
          />
          {both && (
            <>
              <ReadOut
                label="Mean change magnitude"
                value={stats?.meanMagnitude != null ? stats.meanMagnitude.toFixed(2) : "—"}
                band={null}
                note="Out of a possible 5.66. Below 0.30, the team is asking for an adjustment, not a change of gear."
              />
              <ReadOut
                label="Direction coherence"
                value={stats?.coherence == null ? "—" : `${(stats.coherence * 100).toFixed(0)}%`}
                band={null}
                note="How much of each individual trajectory points the same way as the collective one."
              />
            </>
          )}

          {who === "aggregate" && stats && (
            <div
              style={{
                background: C.surface,
                borderRadius: "12px",
                border: `1.5px solid ${C.border}`,
                padding: "14px 18px 2px",
              }}
            >
              <AxisBar
                label="Axis I — Collectivism / Individualism"
                today={stats.centroidToday?.x ?? null}
                target={stats.centroidTarget.x}
                lLabel="Collectivism"
                rLabel="Individualism"
              />
              <AxisBar
                label="Axis II — Integration / Fragmentation"
                today={stats.centroidToday?.y ?? null}
                target={stats.centroidTarget.y}
                lLabel="Integration"
                rLabel="Fragmentation"
              />
            </div>
          )}

          {who === "aggregate" && world && stats && (
            <div
              style={{
                background: world.color + "0F",
                borderRadius: "12px",
                border: `1.5px solid ${world.color}2A`,
                padding: "14px 18px",
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: world.color,
                  marginBottom: "6px",
                }}
              >
                Centre of gravity — target culture
              </div>
              <div
                style={{
                  fontFamily: FD,
                  fontSize: "20px",
                  fontWeight: DISPLAY_WEIGHT,
                  letterSpacing: DISPLAY_TRACKING,
                  color: C.text,
                }}
              >
                <span style={{ marginRight: "8px" }}>{world.emoji}</span>
                {world.name} — {world.sub}
              </div>
              <div style={{ fontFamily: FD, fontSize: "14px", fontStyle: "italic", fontWeight: 400, color: C.t2 }}>
                {world.tagline}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReadOut({
  label,
  value,
  band,
  note,
}: {
  label: string;
  value: string;
  band: string | null;
  note: string;
}) {
  return (
    <div
      style={{
        background: C.surface,
        borderRadius: "12px",
        border: `1.5px solid ${C.border}`,
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: C.t3,
          marginBottom: "4px",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ fontFamily: FM, fontSize: "clamp(22px, 1.9vw, 30px)", color: C.text }}>{value}</span>
        {band && <span style={{ fontSize: "13px", color: C.t2 }}>{band}</span>}
      </div>
      <p style={{ fontSize: "12px", color: C.t3, margin: "4px 0 0", lineHeight: 1.45 }}>{note}</p>
    </div>
  );
}
