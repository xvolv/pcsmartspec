import { NextResponse } from 'next/server';
import { updateScan, getScan } from '@/lib/scanStore';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LISTING_BUCKET || 'listing-images';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, price, extras, images } = body || {};
    if (!id) {
      return NextResponse.json({ status: 'error', error: 'Missing id' }, { status: 400 });
    }

    const scan = await getScan(id as string);
    if (!scan) {
      return NextResponse.json({ status: 'error', error: 'Scan not found' }, { status: 404 });
    }

    const admin = createSupabaseAdmin();

    // Optional image upload: accept base64 data URLs from client
    let imageUrls: string[] = [];
    if (Array.isArray(images) && images.length) {
      for (let i = 0; i < Math.min(images.length, 4); i++) {
        const dataUrl: string = images[i];
        if (typeof dataUrl !== 'string') continue;
        const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
        if (!match) continue;
        const contentType = match[1] || 'image/png';
        const base64 = match[2];
        const buffer = Buffer.from(base64, 'base64');
        const ext = contentType.includes('jpeg') ? 'jpg' : contentType.split('/')[1] || 'png';
        const path = `${id}/${Date.now()}_${i}.${ext}`;
        const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
          contentType,
          upsert: true,
        });
        if (upErr) continue;
        const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
        if (data?.publicUrl) imageUrls.push(data.publicUrl);
      }
    }

    // Insert listing row in Supabase
    const payload = {
      scan_id: id,
      title: title ?? `${scan.Brand} ${scan.Model}`,
      price: String(price ?? ''),
      status: 'published',
      brand: scan.Brand,
      model: scan.Model,
      cpu: scan.CPU,
      cores: (scan as any).Cores ?? null,
      threads: (scan as any).Threads ?? null,
      base_speed_mhz: (scan as any).BaseSpeed_MHz ?? null,
      ram_gb: scan.RAM_GB,
      ram_type: scan.RAM_Type,
      ram_speed_mhz: scan.RAM_Speed_MHz,
      storage: scan.Storage ? JSON.parse(JSON.stringify(scan.Storage)) : [],
      gpu: scan.GPU,
      display_resolution: scan.Display_Resolution,
      screen_size_inch: scan.Screen_Size_inch,
      os: scan.OS,
      images: imageUrls.length ? imageUrls : null,
      extras: extras || null,
      condition: extras?.condition ?? null,
      negotiable: typeof extras?.negotiable === 'boolean' ? extras.negotiable : null,
      battery: extras?.battery ?? null,
      special_features: Array.isArray(extras?.specialFeatures) ? extras.specialFeatures : null,
      guarantee_months: Number.isFinite(extras?.guaranteeMonths) ? extras.guaranteeMonths : null,
      guarantee_provider: extras?.guaranteeProvider ?? null,
      published_at: new Date().toISOString(),
    } as any;

    const { data: inserted, error } = await admin
      .from('listings')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
    }

    // Keep local store updated (optional)
    await updateScan(id, {
      status: 'published',
      title: payload.title,
      price: payload.price,
      publishedAt: payload.published_at,
    } as any);

    return NextResponse.json({ status: 'ok', data: inserted });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e?.message || 'Failed to publish' }, { status: 500 });
  }
}
