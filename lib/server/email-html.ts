import "server-only";
import { BUSINESS_ADDRESS_LINE, LEGAL_NAME } from "@/lib/site";

/**
 * The branded HTML version of a plain-text email: a header with the
 * wordmark, paragraphs, a clear button for each important link, and the
 * company footer. The plain text is still sent alongside it.
 */
const ACCENT = "#824B59";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const URL_RE = /https?:\/\/[^\s<>"]+/g;

/** What a button says, from where it goes. */
function buttonLabel(url: string) {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  const rules: [RegExp, string][] = [
    [/^\/auth\/verify/, "Confirm Your Email"],
    [/^\/auth\/link/, "Sign In"],
    [/^\/auth\/reset/, "Choose a New Password"],
    [/^\/auth\/invite/, "Open Your Portal"],
    [/^\/auth\/signup/, "Create Your Account"],
    [/^\/auth\/login/, "Sign In"],
    [/^\/book\/manage\/[^#]+#intake/, "Fill In the Form"],
    [/^\/book\/manage/, "Manage Your Booking"],
    [/^\/book\//, "Book Again"],
    [/^\/portal\/forms/, "Fill In the Form"],
    [/^\/portal\/messages/, "Read and Reply"],
    [/^\/portal\/readings/, "Open Your Reading"],
    [/^\/portal/, "Open Your Portal"],
    [/^\/app\/consultations/, "Open the Session"],
    [/^\/app\/messages/, "Reply"],
    [/^\/app\/admin/, "Open Admin"],
    [/^\/app/, "Open Astrologers Direct"],
  ];
  return rules.find(([re]) => re.test(path))?.[1] ?? "Open Link";
}

const linkify = (s: string) => esc(s).replace(URL_RE, (u) => `<a href="${u}" style="color:${ACCENT};word-break:break-all">${u}</a>`);

export function emailHtml(subject: string, text: string) {
  const blocks = text.replace(/\r/g, "").trim().split(/\n{2,}/);
  const body = blocks
    .map((block) => {
      const t = block.trim();
      // A link on its own line becomes a button (unsubscribe links stay small).
      if (/^https?:\/\/\S+$/.test(t) && !/unsubscribe/.test(t))
        return `<p style="margin:24px 0"><a href="${esc(t)}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 22px;border-radius:10px">${buttonLabel(t)}</a></p>`;
      if (t === "—") return `<hr style="border:none;border-top:1px solid #E8E2DC;margin:28px 0 16px">`;
      return `<p style="margin:0 0 16px">${t
        .split("\n")
        .map((line) => (/^https?:\/\/\S+$/.test(line.trim()) && !/unsubscribe/.test(line) ? `<a href="${esc(line.trim())}" style="color:${ACCENT};font-weight:600">${buttonLabel(line.trim())} →</a>` : linkify(line)))
        .join("<br>")}</p>`;
    })
    .join("\n");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;background:#F7F4F0;padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#2B2530">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:4px 8px 16px;font-family:Georgia,'Times New Roman',serif;font-size:20px;color:${ACCENT}">✦ Astrologers Direct</td></tr>
<tr><td style="background:#ffffff;border:1px solid #E8E2DC;border-radius:16px;padding:28px 28px 12px;font-size:15px;line-height:1.6">${body}</td></tr>
<tr><td style="padding:16px 8px;font-size:12px;line-height:1.5;color:#8A8290">${esc(LEGAL_NAME)} · ${esc(BUSINESS_ADDRESS_LINE)}</td></tr>
</table></td></tr></table></body></html>`;
}
