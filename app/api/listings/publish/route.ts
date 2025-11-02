import { NextResponse } from 'next/server';
import { updateScan, getScan } from '@/lib/scanStore';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_LISTING_BUCKET || 'listing-images';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, title, price, extras, images } = body || {};

    const admin = createSupabaseAdmin();

    // helper parsers for manual entries
    const takeNumber = (s?: any): number | null => {
      if (!s || typeof s !== 'string') return null;
      const m = s.match(/\d+(?:\.\d+)?/);
      return m ? Number(m[0]) : null;
    };
    const parseSizeGB = (s?: any): number | null => {
      if (!s || typeof s !== 'string') return null;
      const num = takeNumber(s);
      if (num == null) return null;
      const lower = s.toLowerCase();
      if (lower.includes('tb')) return Math.round(num * 1024);
      return Math.round(num);
    };

    // Optional image upload: accept base64 data URLs from client
    const uploadImages = async (keyPrefix: string, imgs: any[]): Promise<string[]> => {
      const urls: string[] = [];
      if (Array.isArray(imgs) && imgs.length) {
        for (let i = 0; i < Math.min(imgs.length, 4); i++) {
          const dataUrl: string = imgs[i];
          if (typeof dataUrl !== 'string') continue;
          const match = dataUrl.match(/^data:(.*?);base64,(.*)$/);
          if (!match) continue;
          const contentType = match[1] || 'image/png';
          const base64 = match[2];
          const buffer = Buffer.from(base64, 'base64');
          const ext = contentType.includes('jpeg') ? 'jpg' : contentType.split('/')[1] || 'png';
          const path = `${keyPrefix}/${Date.now()}_${i}.${ext}`;
          const { error: upErr } = await admin.storage.from(BUCKET).upload(path, buffer, {
            contentType,
            upsert: true,
          });
          if (upErr) continue;
          const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
          if (data?.publicUrl) urls.push(data.publicUrl);
        }
      }
      return urls;
    };

    // Branch 1: scan-backed publish (existing behavior)
    if (id) {
      const scan = await getScan(id as string);
      if (!scan) {
        return NextResponse.json({ status: 'error', error: 'Scan not found' }, { status: 404 });
      }

      const imageUrls = await uploadImages(String(id), images);

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

      await updateScan(id, {
        status: 'published',
        title: payload.title,
        price: payload.price,
        publishedAt: payload.published_at,
      } as any);

      return NextResponse.json({ status: 'ok', data: inserted });
    }

    // Branch 2: manual publish (no scan id)
    // Accept fields directly; map into columns to minimize extras usage
    const brand = body.brand || '';
    const series = body.series || '';
    const model = body.model || '';

    const cpu = [body.cpuBrand, body.cpuSeries, body.cpuGeneration, body.cpuModel]
      .filter(Boolean)
      .join(' ')
      .trim() || null;

    const ram_type = body.ramType || null;
    const ram_gb_val = parseSizeGB(body.ramCapacity);
    const ram_gb = ram_gb_val != null ? String(ram_gb_val) : null;

    const storageArr = (() => {
      const type = body.storageTypeMain || null;
      const sizeGB = parseSizeGB(body.storageCapacity);
      if (!type && sizeGB == null) return [] as any[];
      return [
        { Model: null, Size_GB: sizeGB ?? 0, Type: type ?? '', BusType: null },
      ];
    })();

    const display_resolution = body.resolution || null;
    const screen_size_inch = takeNumber(body.screenSize);

    const gpu = [body.gpuType, body.gpuBrand, body.gpuSeries, body.gpuVram]
      .filter(Boolean)
      .join(' ')
      .trim() || null;

    const condition = body.condition ?? extras?.condition ?? null;
    const negotiable = typeof body.negotiable === 'boolean' ? body.negotiable : (typeof extras?.negotiable === 'boolean' ? extras.negotiable : null);
    const battery = body.batteryCondition ?? extras?.battery ?? null;
    const special_features = Array.isArray(body.extraItems) ? body.extraItems : (Array.isArray(extras?.specialFeatures) ? extras.specialFeatures : null);

    const manualTitle = title || [brand, series, model].filter(Boolean).join(' ').trim() || null;

    const imageUrls = await uploadImages(manualTitle || 'manual', images);

    const payload = {
      scan_id: null,
      title: manualTitle,
      price: String(price ?? ''),
      status: 'published',
      brand: brand || null,
      model: model || null,
      cpu,
      cores: null,
      threads: null,
      base_speed_mhz: null,
      ram_gb,
      ram_type,
      ram_speed_mhz: null,
      storage: storageArr,
      gpu,
      display_resolution,
      screen_size_inch,
      os: null,
      images: imageUrls.length ? imageUrls : null,
      condition,
      negotiable,
      battery,
      special_features,
      // Keep extras lean: include only fields without first-class columns
      extras: {
        warranty: body.warranty || null,
        refreshRate: body.refreshRate || null,
        specs: body.specs || null,
      },
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

    return NextResponse.json({ status: 'ok', data: inserted });
  } catch (e: any) {
    return NextResponse.json({ status: 'error', error: e?.message || 'Failed to publish' }, { status: 500 });
  }
}
