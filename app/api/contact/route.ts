import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { name, school, email, phone, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from:    "Skolastik <noreply@maripatechagency.com>",
      to:      ["maripatechagency@gmail.com"],
      replyTo: email,
      subject: `[Skolastik] ${subject} — ${name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f0f4f8">
          <div style="background:#1e3a6e;padding:24px 28px;border-radius:12px 12px 0 0">
            <h1 style="color:#fff;margin:0;font-size:20px;font-weight:800;letter-spacing:1px">
              SKOLA<span style="color:#e8a020">STIK</span>
            </h1>
            <p style="color:rgba(255,255,255,0.6);margin:4px 0 0;font-size:11px;letter-spacing:2px;text-transform:uppercase">School Solutions</p>
            <h2 style="color:#fff;margin:16px 0 0;font-size:16px;font-weight:600">${subject}</h2>
          </div>
          <div style="background:#fff;padding:28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none">
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr>
                <td style="padding:10px 0;color:#64748b;width:110px;vertical-align:top">Name</td>
                <td style="padding:10px 0;font-weight:600;color:#1e293b">${name}</td>
              </tr>
              ${school ? `
              <tr>
                <td style="padding:10px 0;color:#64748b;vertical-align:top">School</td>
                <td style="padding:10px 0;font-weight:600;color:#1e293b">${school}</td>
              </tr>` : ""}
              <tr>
                <td style="padding:10px 0;color:#64748b;vertical-align:top">Email</td>
                <td style="padding:10px 0;font-weight:600;color:#1e293b">
                  <a href="mailto:${email}" style="color:#1e3a6e">${email}</a>
                </td>
              </tr>
              ${phone ? `
              <tr>
                <td style="padding:10px 0;color:#64748b;vertical-align:top">Phone</td>
                <td style="padding:10px 0;font-weight:600;color:#1e293b">
                  <a href="tel:${phone}" style="color:#1e3a6e">${phone}</a>
                </td>
              </tr>` : ""}
            </table>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0"/>
            <p style="color:#64748b;font-size:12px;margin:0 0 8px;text-transform:uppercase;letter-spacing:1px">Message</p>
            <p style="color:#1e293b;font-size:14px;line-height:1.7;white-space:pre-wrap;margin:0;background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e2e8f0">${message}</p>
          </div>
          <p style="color:#94a3b8;font-size:11px;text-align:center;margin-top:16px">
            Sent via Skolastik School Solutions · <a href="https://skolastik.com" style="color:#94a3b8">skolastik.com</a>
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (err: any) {
    console.error("Contact email error:", err);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
