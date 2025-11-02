import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { verifyPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const { data: user, error } = await admin
      .from("users")
      .select("id,email,password_hash")
      .eq("email", email.trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const stored = (user as any).password_hash as string | null;
    if (!stored) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    const ok = await verifyPassword(password.trim(), stored);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    return NextResponse.json({ ok: true, id: user.id, email: user.email });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
