export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string
          brand: string | null
          model: string | null
          cpu: string | null
          ram_gb: string | null
          ram_type: string | null
          ram_speed_mhz: string | null
          storage: Json | null
          gpu: string | null
          display_resolution: string | null
          screen_size_inch: number | null
          os: string | null
          status: 'draft' | 'published' | 'sold'
          images: string[] | null
          created_at: string
          updated_at: string | null
          user_id: string
          price: number | null
          description: string | null
        }
        Insert: {
          id?: string
          brand?: string | null
          model?: string | null
          cpu?: string | null
          ram_gb?: string | null
          ram_type?: string | null
          ram_speed_mhz?: string | null
          storage?: Json | null
          gpu?: string | null
          display_resolution?: string | null
          screen_size_inch?: number | null
          os?: string | null
          status?: 'draft' | 'published' | 'sold'
          images?: string[] | null
          created_at?: string
          updated_at?: string | null
          user_id: string
          price?: number | null
          description?: string | null
        }
        Update: {
          id?: string
          brand?: string | null
          model?: string | null
          cpu?: string | null
          ram_gb?: string | null
          ram_type?: string | null
          ram_speed_mhz?: string | null
          storage?: Json | null
          gpu?: string | null
          display_resolution?: string | null
          screen_size_inch?: number | null
          os?: string | null
          status?: 'draft' | 'published' | 'sold'
          images?: string[] | null
          created_at?: string
          updated_at?: string | null
          user_id?: string
          price?: number | null
          description?: string | null
        }
      }
      receipts: {
        Row: {
          id: string
          listing_id: string | null
          receipt_number: string
          buyer_name: string
          buyer_phone: string
          buyer_address: string | null
          sale_date: string
          purchase_price: number
          seller_signature: string | null
          pc_specs_snapshot: Json
          notes: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          listing_id?: string | null
          receipt_number: string
          buyer_name: string
          buyer_phone: string
          buyer_address?: string | null
          sale_date?: string
          purchase_price: number
          seller_signature?: string | null
          pc_specs_snapshot: Json
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          listing_id?: string | null
          receipt_number?: string
          buyer_name?: string
          buyer_phone?: string
          buyer_address?: string | null
          sale_date?: string
          purchase_price?: number
          seller_signature?: string | null
          pc_specs_snapshot?: Json
          notes?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      scans: {
        Row: {
          id: string
          brand: string | null
          model: string | null
          cpu: string | null
          cores: string | null
          threads: string | null
          base_speed_mhz: string | null
          ram_gb: string | null
          ram_speed_mhz: string | null
          ram_type: string | null
          storage: Json | null
          gpu: string | null
          display_resolution: string | null
          screen_size_inch: number | null
          os: string | null
          scan_time: string | null
          status: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          brand?: string | null
          model?: string | null
          cpu?: string | null
          cores?: string | null
          threads?: string | null
          base_speed_mhz?: string | null
          ram_gb?: string | null
          ram_speed_mhz?: string | null
          ram_type?: string | null
          storage?: Json | null
          gpu?: string | null
          display_resolution?: string | null
          screen_size_inch?: number | null
          os?: string | null
          scan_time?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          brand?: string | null
          model?: string | null
          cpu?: string | null
          cores?: string | null
          threads?: string | null
          base_speed_mhz?: string | null
          ram_gb?: string | null
          ram_speed_mhz?: string | null
          ram_type?: string | null
          storage?: Json | null
          gpu?: string | null
          display_resolution?: string | null
          screen_size_inch?: number | null
          os?: string | null
          scan_time?: string | null
          status?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
