import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { name, email, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "HealthLex Contact <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL!,
      replyTo: email,
      subject: `[HealthLex] Message de ${name}`,
      text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur d'envoi." }, { status: 500 });
  }
}
