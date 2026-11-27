import { json, notFound, resolveSession } from "@/lib/http";
import { computeCoords, parseAnswers } from "@/lib/scoring";
import { addResponse } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Accept one participant submission. Coordinates are computed here, never on the phone. */
export async function POST(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const session = await resolveSession(code);
  if (!session) return notFound();
  if (session.closedAt) return json({ error: "This session is closed." }, 409);

  let body: { answers?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return json({ error: "invalid JSON" }, 400);
  }

  // The session decides what is asked, never the phone.
  const parsed = parseAnswers(body?.answers, session.mode);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const { today, target } = computeCoords(parsed.answers, session.mode);
  const saved = await addResponse({
    sessionId: session.id,
    answers: parsed.answers,
    today,
    target,
  });

  return json({ id: saved.id, today: saved.today, target: saved.target }, 201);
}
