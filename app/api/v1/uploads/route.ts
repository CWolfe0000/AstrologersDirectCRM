import { z } from "zod";
import { handler, HttpError, json, rateLimit, readJson, requireUser } from "@/lib/server/http";
import { ALLOWED_TYPES, MAX_UPLOAD_BYTES, createUpload } from "@/lib/server/storage";

const Body = z.object({ fileName: z.string().min(1).max(300), contentType: z.string().max(120), size: z.number().int().positive() }).strict();

/** Start an upload: returns where the browser should PUT the file. */
export const POST = handler(async (req) => {
  rateLimit(req, "upload", 120, 3_600_000);
  const user = await requireUser("owner");
  const parsed = Body.safeParse(await readJson(req));
  if (!parsed.success) throw new HttpError(422, "Invalid upload request.");
  const { fileName, contentType, size } = parsed.data;
  if (!ALLOWED_TYPES.includes(contentType)) throw new HttpError(415, "This file type isn’t supported. Upload a PDF, Word document, image, audio or video file.");
  if (size > MAX_UPLOAD_BYTES) throw new HttpError(413, "Files can be up to 2 GB.");
  return json(await createUpload(user.practiceId, fileName, contentType, size));
});
