import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message || "Invalid input";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: parsed.data.name || null,
    },
    select: { id: true, email: true },
  });

  return NextResponse.json({ ok: true, userId: user.id });
}
