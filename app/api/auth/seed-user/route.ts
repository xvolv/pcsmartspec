import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { hashPassword } from "@/lib/auth/password";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }
    if (!/^\d{6}$/.test(password)) {
      return NextResponse.json(
        { error: "Password must be a 6-digit code" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdmin();

    // Create Supabase Auth user (idempotent-ish): if already exists, ignore error
    let authUserId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createErr) {
      // If user already exists, try to find by signing in to get id or proceed
      // Supabase doesn't have getUserByEmail in admin API. We'll proceed without id.
    } else {
      authUserId = created.user?.id ?? null;
    }

    // Upsert into your public.users table with hashed password
    const password_hash = await hashPassword(password);
    const { error: upsertErr } = await admin
      .from("users")
      .upsert({ email, password_hash }, { onConflict: "email" })
      .select("id")
      .single();

    if (upsertErr) {
      return NextResponse.json(
        { error: upsertErr.message || "Failed to upsert local user" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, authUserId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
