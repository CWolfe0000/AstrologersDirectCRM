import { handler } from "@/lib/server/http";
import { serveMedia } from "@/lib/server/media";

export const GET = handler(async (req: Request, ctx: { params: Promise<{ id: string }> }) => serveMedia(req, "files", (await ctx.params).id));
