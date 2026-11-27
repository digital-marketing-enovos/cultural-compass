"use client";

import { useState } from "react";
import { C, FB, FM } from "@/lib/theme";
import { Shell } from "@/components/Shell";

type Mode = "both" | "target";
type Created = { code: string; secret: string; title: string; mode: Mode };

const card = {
  background: C.surface,
  borderRadius: "12px",
  border: `1px solid ${C.border}`,
  padding: "24px",
  marginBottom: "14px",
} as const;

const label = {
  fontSize: "9px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: C.t3,
  marginBottom: "8px",
} as const;

export default function FacilitatorHome() {
  const [title, setTitle] = useState("Cultural Compass — team");
  const [nextYearOnly, setNextYearOnly] = useState(false);
  const [session, setSession] = useState<Created | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, mode: nextYearOnly ? "target" : "both" }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<Created> & { error?: string };
      if (!res.ok || !body.code || !body.secret) {
        setError(body.error ?? "Could not create the session.");
        return;
      }
      setSession({
        code: body.code,
        secret: body.secret,
        title: body.title ?? title,
        mode: body.mode ?? (nextYearOnly ? "target" : "both"),
      });
    } catch {
      setError("Could not create the session.");
    } finally {
      setBusy(false);
    }
  }

  if (session) return <CreatedPanel session={session} />;

  return (
    <Shell subtitle="Facilitator · create a session">
      <div style={card}>
        <div style={label}>Session title</div>
        <input
          value={title}
          maxLength={80}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            width: "100%",
            minHeight: "48px",
            padding: "12px 14px",
            border: `1px solid ${C.border}`,
            borderRadius: "8px",
            fontSize: "15px",
            fontFamily: FB,
            color: C.text,
            background: C.bg,
            boxSizing: "border-box",
          }}
        />
        <Toggle
          on={nextYearOnly}
          onChange={setNextYearOnly}
          label="Next year only"
          hint="Participants only say what would help the team work best next year — 12 answers instead of 24. The results screen then shows Next year, with no Today view and no movement."
        />
        {error && (
          <p role="alert" style={{ fontSize: "13px", color: C.fire, margin: "12px 0 0" }}>
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={create}
          disabled={busy}
          style={{
            width: "100%",
            minHeight: "52px",
            marginTop: "16px",
            borderRadius: "10px",
            border: "none",
            background: C.accent,
            color: "#fff",
            fontSize: "15px",
            fontWeight: 600,
            cursor: busy ? "wait" : "pointer",
            fontFamily: FB,
          }}
        >
          {busy ? "Creating…" : "Create session"}
        </button>
      </div>

      <AdminLinks />
    </Shell>
  );
}

function CreatedPanel({ session }: { session: Created }) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const joinUrl = `${origin}/s/${session.code}`;
  const presentUrl = `${origin}/s/${session.code}/present`;
  const resultsUrl = `${origin}/s/${session.code}/results?k=${session.secret}`;

  return (
    <Shell subtitle={session.title}>
      <div
        style={{
          ...card,
          borderColor: C.accent + "55",
          background: C.accent + "0A",
        }}
      >
        <div style={label}>Keep this tab open</div>
        <p style={{ fontSize: "14px", color: C.t2, lineHeight: 1.7, margin: "0 0 4px" }}>
          The results link below is the only key to this session. It is shown once and is not
          recoverable — bookmark it now.
        </p>
      </div>

      <div style={card}>
        <div style={label}>Session code</div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: FM, fontSize: "32px", color: C.text, letterSpacing: "0.06em" }}>
            {session.code}
          </span>
          <span
            style={{
              fontSize: "12px",
              color: session.mode === "target" ? C.accent : C.t2,
              border: `1px solid ${session.mode === "target" ? C.accent + "66" : C.border}`,
              borderRadius: "999px",
              padding: "3px 11px",
            }}
          >
            {session.mode === "target" ? "Next year only" : "Today and next year"}
          </span>
        </div>
      </div>

      <LinkRow name="Join screen — project this" href={presentUrl} />
      <LinkRow name="Results — facilitator only" href={resultsUrl} />
      <LinkRow name="Participant link" href={joinUrl} />

      <AdminLinks />
    </Shell>
  );
}

function LinkRow({ name, href }: { name: string; href: string }) {
  return (
    <div style={card}>
      <div style={label}>{name}</div>
      <a
        href={href}
        // New tab: this panel shows the facilitator key once and cannot show it
        // again. Navigating away from it loses access to the results screen.
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontFamily: FM,
          fontSize: "13px",
          color: C.accent,
          wordBreak: "break-all",
          lineHeight: 1.6,
          display: "block",
        }}
      >
        {href}
      </a>
    </div>
  );
}

/** The admin screens carry no session key, so they are plain links. */
function AdminLinks() {
  const item = {
    minHeight: "44px",
    display: "inline-flex",
    alignItems: "center",
    padding: "0 16px",
    borderRadius: "9px",
    border: `1px solid ${C.border}`,
    background: C.surface,
    color: C.t2,
    fontSize: "14px",
    fontFamily: FB,
    textDecoration: "none",
  } as const;

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "4px" }}>
      <a href="/admin" target="_blank" rel="noopener noreferrer" style={item}>
        Edit the questions
      </a>
      <a href="/admin/sessions" target="_blank" rel="noopener noreferrer" style={item}>
        Past sessions
      </a>
    </div>
  );
}

/** An on/off switch in the page's own idiom: orange when on, a real button underneath. */
function Toggle({
  on,
  onChange,
  label: text,
  hint,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "14px",
        width: "100%",
        marginTop: "16px",
        padding: "14px 16px",
        borderRadius: "10px",
        border: `1px solid ${on ? C.accent + "66" : C.border}`,
        background: on ? C.accent + "0D" : C.bg,
        textAlign: "left",
        cursor: "pointer",
        fontFamily: FB,
      }}
    >
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: "40px",
          height: "24px",
          marginTop: "1px",
          borderRadius: "999px",
          background: on ? C.accent : C.border,
          position: "relative",
          transition: "background .15s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: on ? "19px" : "3px",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 2px rgba(0,0,0,.2)",
            transition: "left .15s",
          }}
        />
      </span>
      <span>
        <span style={{ display: "block", fontSize: "15px", fontWeight: 600, color: C.text }}>{text}</span>
        <span style={{ display: "block", fontSize: "13px", color: C.t2, lineHeight: 1.55, marginTop: "3px" }}>
          {hint}
        </span>
      </span>
    </button>
  );
}
