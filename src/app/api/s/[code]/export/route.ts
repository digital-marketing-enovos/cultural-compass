import { ITEMS } from "@/lib/items";
import { notFound, resolveSession } from "@/lib/http";
import { listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/**
 * Quote anything that could confuse a spreadsheet, and neutralise formula
 * injection in free text. Plain numbers — including negative answers like -3 —
 * are passed through untouched so they stay numeric in Excel.
 */
function cell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (s !== "" && Number.isFinite(Number(s))) return s;
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/**
 * One row per response: the twenty-four raw answers, the four coordinates, the
 * team and the session code.
 *
 * Deliberately absent: timestamps, response ids, and anything else that could
 * restore the order in which people answered. In a room where everyone answers
 * within the same few minutes, that order identifies people as reliably as a
 * name, which would undo the anonymity the questionnaire promises.
 *
 * The raw answers are exported, not just the coordinates, because the two axes
 * are only independent if the items that load on them are. Items 5 and 10 both
 * touch the team's relationship to systematic controls and sit on different
 * axes; if they correlate strongly, every point drifts along the diagonal. That
 * can only be checked from the raw answers after a real session.
 */
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const k = new URL(req.url).searchParams.get("k");
  const session = await resolveSession(code, { secret: k });
  if (!session) return notFound();

  const responses = await listResponses(session.id);

  const header = [
    "session_code",
    "team",
    "today_x",
    "today_y",
    "next_x",
    "next_y",
    ...ITEMS.flatMap((i) => [`i${i.id}_today`, `i${i.id}_next`]),
  ];

  const rows = responses.map((r) =>
    [
      session.code,
      session.title,
      r.today?.x.toFixed(4) ?? "",
      r.today?.y.toFixed(4) ?? "",
      r.target.x.toFixed(4),
      r.target.y.toFixed(4),
      ...ITEMS.flatMap((i) => [
        r.answers[String(i.id)]?.today ?? "",
        r.answers[String(i.id)]?.target ?? "",
      ]),
    ].map(cell),
  );

  // BOM so Excel opens the UTF-8 text correctly.
  const csv = "﻿" + [header.map(cell), ...rows].map((r) => r.join(",")).join("\r\n") + "\r\n";
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="cultural-compass-${session.code}-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
}
