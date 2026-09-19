import { createSession } from "@/lib/store";
import { json } from "@/lib/http";
import { MODES, type Mode } from "@/lib/scoring";

export const dynamic = "force-dynamic";

/** Create a session. Used by the facilitator home page and by scripts/seed.mjs. */
export async function POST(req: Request) {
  let title = "Cultural Compass";
  let mode: Mode = "both";
  try {
    const body = (await req.json()) as { title?: unknown; mode?: unknown };
    if (typeof body?.title === "string" && body.title.trim()) title = body.title;
    if (body?.mode !== undefined) {
      if (!(MODES as unknown[]).includes(body.mode)) return json({ error: "invalid mode" }, 400);
      mode = body.mode as Mode;
    }
  } catch {
    // no body — keep the defaults
  }
  const session = await createSession(title, mode);
  return json(
    { code: session.code, secret: session.secret, title: session.title, mode: session.mode },
    201,
  );
}
