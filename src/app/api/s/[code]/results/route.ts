import { json, notFound, resolveSession } from "@/lib/http";
import { listResponses } from "@/lib/store";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ code: string }> };

/** Every response in the session. Secret-gated; polled every 3s by /results. */
export async function GET(req: Request, ctx: Ctx) {
  const { code } = await ctx.params;
  const k = new URL(req.url).searchParams.get("k");
  const session = await resolveSession(code, { secret: k });
  if (!session) return notFound();

  const responses = await listResponses(session.id);
  return json({
    mode: session.mode,
    closed: Boolean(session.closedAt),
    count: responses.length,
    // No label, and no createdAt: neither identity nor arrival order leaves the
    // server. The id is a uuid, which carries no timestamp.
    responses: responses.map((r) => ({ id: r.id, today: r.today, target: r.target })),
  });
}
