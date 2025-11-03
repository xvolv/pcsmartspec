import { createSupabaseAdmin } from './supabase/admin';

type ScanData = {
  id: string;
  Brand: string;
  Model: string;
  CPU: string;
  Cores: string;
  Threads: string;
  BaseSpeed_MHz: string;
  RAM_GB: string;
  RAM_Speed_MHz: string;
  RAM_Type: string;
  Storage: Array<{
    Model: string;
    Size_GB: number;
    Type: string;
    BusType: string;
  }>;
  GPU: string;
  Display_Resolution: string;
  Screen_Size_inch: number;
  OS: string;
  Scan_Time: string;
  createdAt: string;
  status: string;
};

// Convert database row to ScanData format
function dbRowToScanData(row: any): ScanData {
  return {
    id: row.id,
    Brand: row.brand || '',
    Model: row.model || '',
    CPU: row.cpu || '',
    Cores: row.cores || '',
    Threads: row.threads || '',
    BaseSpeed_MHz: row.base_speed_mhz || '',
    RAM_GB: row.ram_gb || '',
    RAM_Speed_MHz: row.ram_speed_mhz || '',
    RAM_Type: row.ram_type || '',
    Storage: (row.storage as any[]) || [],
    GPU: row.gpu || '',
    Display_Resolution: row.display_resolution || '',
    Screen_Size_inch: row.screen_size_inch || 0,
    OS: row.os || '',
    Scan_Time: row.scan_time || row.created_at,
    createdAt: row.created_at,
    status: row.status || 'pending',
  };
}

// Convert ScanData to database insert format
function scanDataToDbRow(data: Omit<ScanData, 'id'> | Partial<ScanData>, id?: string): any {
  return {
    id: id || (data as any).id,
    brand: (data as any).Brand || data.brand,
    model: (data as any).Model || data.model,
    cpu: (data as any).CPU || data.cpu,
    cores: (data as any).Cores || data.cores,
    threads: (data as any).Threads || data.threads,
    base_speed_mhz: (data as any).BaseSpeed_MHz || data.base_speed_mhz,
    ram_gb: (data as any).RAM_GB || data.ram_gb,
    ram_speed_mhz: (data as any).RAM_Speed_MHz || data.ram_speed_mhz,
    ram_type: (data as any).RAM_Type || data.ram_type,
    storage: (data as any).Storage || data.storage,
    gpu: (data as any).GPU || data.gpu,
    display_resolution: (data as any).Display_Resolution || data.display_resolution,
    screen_size_inch: (data as any).Screen_Size_inch || data.screen_size_inch,
    os: (data as any).OS || data.os,
    scan_time: (data as any).Scan_Time || data.scan_time,
    status: (data as any).status || data.status || 'pending',
  };
}

export const getScan = async (id: string): Promise<ScanData | undefined> => {
  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from('scans')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Error fetching scan:', error);
      return undefined;
    }

    // Don't return published scans - they shouldn't be shown on attach page
    if (data.status === 'published') {
      return undefined;
    }

    return dbRowToScanData(data);
  } catch (error) {
    console.error('Error in getScan:', error);
    return undefined;
  }
};

export const setScan = async (id: string, data: Omit<ScanData, 'id'>): Promise<void> => {
  try {
    const admin = createSupabaseAdmin();
    const dbRow = scanDataToDbRow(data, id);
    
    const { error } = await admin
      .from('scans')
      .upsert(dbRow, { onConflict: 'id' });

    if (error) {
      console.error('Error saving scan:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in setScan:', error);
    throw error;
  }
};

export const deleteScan = async (id: string): Promise<void> => {
  try {
    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from('scans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting scan:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteScan:', error);
    throw error;
  }
};

export const getLatestScan = async (): Promise<ScanData | undefined> => {
  try {
    const admin = createSupabaseAdmin();
    // Filter out published scans - only return pending or non-published scans
    const { data, error } = await admin
      .from('scans')
      .select('*')
      .or('status.is.null,status.neq.published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error in getLatestScan:', error);
      return undefined;
    }

    if (!data) {
      return undefined;
    }

    return dbRowToScanData(data);
  } catch (error) {
    console.error('Error in getLatestScan:', error);
    return undefined;
  }
};

export const getAllScans = async (): Promise<ScanData[]> => {
  try {
    const admin = createSupabaseAdmin();
    const { data, error } = await admin
      .from('scans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all scans:', error);
      return [];
    }

    return (data || []).map(dbRowToScanData);
  } catch (error) {
    console.error('Error in getAllScans:', error);
    return [];
  }
};

export const updateScan = async (id: string, patch: Partial<ScanData> & Record<string, any>): Promise<ScanData | undefined> => {
  try {
    const admin = createSupabaseAdmin();
    const updateData = scanDataToDbRow(patch);
    
    const { data, error } = await admin
      .from('scans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating scan:', error);
      return undefined;
    }

    return dbRowToScanData(data);
  } catch (error) {
    console.error('Error in updateScan:', error);
    return undefined;
  }
};
