export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      businesses: {
        Row: {
          address: string | null
          avg_prep_minutes: number | null
          category_id: string | null
          cnpj: string | null
          cover_url: string | null
          created_at: string
          delivery_enabled: boolean
          delivery_fee_cents: number | null
          description: string | null
          district: string | null
          email: string | null
          geo: Json | null
          id: string
          is_active: boolean
          is_eco_certified: boolean
          is_verified: boolean
          logo_url: string | null
          metadata: Json
          min_order_cents: number | null
          name: string
          opening_hours: Json
          owner_id: string
          payout_pix_key: string | null
          payout_pix_kind: string | null
          slug: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          avg_prep_minutes?: number | null
          category_id?: string | null
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_enabled?: boolean
          delivery_fee_cents?: number | null
          description?: string | null
          district?: string | null
          email?: string | null
          geo?: Json | null
          id?: string
          is_active?: boolean
          is_eco_certified?: boolean
          is_verified?: boolean
          logo_url?: string | null
          metadata?: Json
          min_order_cents?: number | null
          name: string
          opening_hours?: Json
          owner_id: string
          payout_pix_key?: string | null
          payout_pix_kind?: string | null
          slug?: string | null
          type: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          avg_prep_minutes?: number | null
          category_id?: string | null
          cnpj?: string | null
          cover_url?: string | null
          created_at?: string
          delivery_enabled?: boolean
          delivery_fee_cents?: number | null
          description?: string | null
          district?: string | null
          email?: string | null
          geo?: Json | null
          id?: string
          is_active?: boolean
          is_eco_certified?: boolean
          is_verified?: boolean
          logo_url?: string | null
          metadata?: Json
          min_order_cents?: number | null
          name?: string
          opening_hours?: Json
          owner_id?: string
          payout_pix_key?: string | null
          payout_pix_kind?: string | null
          slug?: string | null
          type?: Database["public"]["Enums"]["business_type"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "businesses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          group_id: string
          icon: string | null
          id: string
          is_active: boolean
          label: string
          position: number
        }
        Insert: {
          created_at?: string
          group_id: string
          icon?: string | null
          id: string
          is_active?: boolean
          label: string
          position?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          label?: string
          position?: number
        }
        Relationships: []
      }
      leads: {
        Row: {
          contacted: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          payload: Json
          type: Database["public"]["Enums"]["lead_type"]
          whatsapp: string
        }
        Insert: {
          contacted?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          payload?: Json
          type: Database["public"]["Enums"]["lead_type"]
          whatsapp: string
        }
        Update: {
          contacted?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          payload?: Json
          type?: Database["public"]["Enums"]["lead_type"]
          whatsapp?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          customizations: Json
          id: string
          name_snapshot: string
          notes: string | null
          order_id: string
          quantity: number
          service_id: string
          total_cents: number
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          customizations?: Json
          id?: string
          name_snapshot: string
          notes?: string | null
          order_id: string
          quantity: number
          service_id: string
          total_cents: number
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          customizations?: Json
          id?: string
          name_snapshot?: string
          notes?: string | null
          order_id?: string
          quantity?: number
          service_id?: string
          total_cents?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          business_id: string
          cancellation_reason: string | null
          cancelled_at: string | null
          code: string
          confirmed_at: string | null
          coupon_code: string | null
          created_at: string
          customer_id: string
          delivered_at: string | null
          delivery_fee_cents: number
          destination_geo: Json | null
          destination_kind: string | null
          destination_label: string | null
          destination_notes: string | null
          discount_cents: number
          driver_id: string | null
          id: string
          metadata: Json
          payment_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          placed_at: string | null
          platform_fee_cents: number
          ready_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          service_fee_cents: number
          coupon_discount_cents: number
          cpf_nota: string | null
          delivery_code: string | null
          updated_at: string
        }
        Insert: {
          business_id: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          code?: string
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id: string
          delivered_at?: string | null
          delivery_fee_cents?: number
          destination_geo?: Json | null
          destination_kind?: string | null
          destination_label?: string | null
          destination_notes?: string | null
          discount_cents?: number
          driver_id?: string | null
          id?: string
          metadata?: Json
          payment_id?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string | null
          platform_fee_cents?: number
          ready_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents: number
          total_cents: number
          service_fee_cents?: number
          coupon_discount_cents?: number
          cpf_nota?: string | null
          delivery_code?: string | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          cancellation_reason?: string | null
          cancelled_at?: string | null
          code?: string
          confirmed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          customer_id?: string
          delivered_at?: string | null
          delivery_fee_cents?: number
          destination_geo?: Json | null
          destination_kind?: string | null
          destination_label?: string | null
          destination_notes?: string | null
          discount_cents?: number
          driver_id?: string | null
          id?: string
          metadata?: Json
          payment_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          placed_at?: string | null
          platform_fee_cents?: number
          ready_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_cents?: number
          total_cents?: number
          service_fee_cents?: number
          coupon_discount_cents?: number
          cpf_nota?: string | null
          delivery_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: Json | null
          avatar_url: string | null
          birth_date: string | null
          cnh_category: string | null
          cnh_number: string | null
          cpf: string | null
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          is_resident: boolean
          is_online: boolean
          last_seen_at: string | null
          pix_kind: string | null
          pix_value: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          vehicle: Json | null
          whatsapp: string | null
        }
        Insert: {
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          cnh_category?: string | null
          cnh_number?: string | null
          cpf?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id: string
          is_resident?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          pix_kind?: string | null
          pix_value?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          vehicle?: Json | null
          whatsapp?: string | null
        }
        Update: {
          address?: Json | null
          avatar_url?: string | null
          birth_date?: string | null
          cnh_category?: string | null
          cnh_number?: string | null
          cpf?: string | null
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          is_resident?: boolean
          is_online?: boolean
          last_seen_at?: string | null
          pix_kind?: string | null
          pix_value?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          vehicle?: Json | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          business_id: string | null
          comment: string | null
          created_at: string
          flagged: boolean
          id: string
          order_id: string
          photo_urls: string[]
          rated_by: string
          rated_entity: Database["public"]["Enums"]["rated_entity_kind"]
          rated_entity_id: string
          reply: string | null
          reply_at: string | null
          service_id: string | null
          stars: number
          tags: string[]
        }
        Insert: {
          business_id?: string | null
          comment?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          order_id: string
          photo_urls?: string[]
          rated_by: string
          rated_entity: Database["public"]["Enums"]["rated_entity_kind"]
          rated_entity_id: string
          reply?: string | null
          reply_at?: string | null
          service_id?: string | null
          stars: number
          tags?: string[]
        }
        Update: {
          business_id?: string | null
          comment?: string | null
          created_at?: string
          flagged?: boolean
          id?: string
          order_id?: string
          photo_urls?: string[]
          rated_by?: string
          rated_entity?: Database["public"]["Enums"]["rated_entity_kind"]
          rated_entity_id?: string
          reply?: string | null
          reply_at?: string | null
          service_id?: string | null
          stars?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_rated_by_fkey"
            columns: ["rated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_slots: {
        Row: {
          id: string
          business_id: string
          service_id: string
          start_at: string
          duration_minutes: number
          capacity: number
          booked_count: number
          staff_name: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          service_id: string
          start_at: string
          duration_minutes?: number
          capacity?: number
          booked_count?: number
          staff_name?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          service_id?: string
          start_at?: string
          duration_minutes?: number
          capacity?: number
          booked_count?: number
          staff_name?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_bookings: {
        Row: {
          id: string
          code: string
          business_id: string
          service_id: string
          slot_id: string
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_whatsapp: string | null
          total_cents: number
          platform_fee_cents: number
          status: "requested" | "confirmed" | "completed" | "cancelled" | "refunded" | "no_show"
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_id: string | null
          delivery_code: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          business_id: string
          service_id: string
          slot_id: string
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          total_cents: number
          platform_fee_cents?: number
          status?: "requested" | "confirmed" | "completed" | "cancelled" | "refunded" | "no_show"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          delivery_code?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          business_id?: string
          service_id?: string
          slot_id?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          total_cents?: number
          platform_fee_cents?: number
          status?: "requested" | "confirmed" | "completed" | "cancelled" | "refunded" | "no_show"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          delivery_code?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_bookings: {
        Row: {
          id: string
          code: string
          business_id: string
          service_id: string
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_whatsapp: string | null
          customer_document: string | null
          pickup_at: string
          return_at: string
          daily_cents: number
          total_days: number
          subtotal_cents: number
          deposit_cents: number
          total_cents: number
          platform_fee_cents: number
          status: "requested" | "confirmed" | "active" | "returned" | "cancelled" | "refunded" | "late"
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_id: string | null
          delivery_code: string | null
          return_code: string | null
          pickup_location: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          business_id: string
          service_id: string
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          customer_document?: string | null
          pickup_at: string
          return_at: string
          daily_cents: number
          subtotal_cents: number
          deposit_cents?: number
          total_cents: number
          platform_fee_cents?: number
          status?: "requested" | "confirmed" | "active" | "returned" | "cancelled" | "refunded" | "late"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          delivery_code?: string | null
          return_code?: string | null
          pickup_location?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          business_id?: string
          service_id?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          customer_document?: string | null
          pickup_at?: string
          return_at?: string
          daily_cents?: number
          subtotal_cents?: number
          deposit_cents?: number
          total_cents?: number
          platform_fee_cents?: number
          status?: "requested" | "confirmed" | "active" | "returned" | "cancelled" | "refunded" | "late"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          delivery_code?: string | null
          return_code?: string | null
          pickup_location?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tour_sessions: {
        Row: {
          id: string
          business_id: string
          service_id: string
          start_at: string
          capacity: number
          sold_pax: number
          meeting_point: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          service_id: string
          start_at: string
          capacity: number
          sold_pax?: number
          meeting_point?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          service_id?: string
          start_at?: string
          capacity?: number
          sold_pax?: number
          meeting_point?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tour_bookings: {
        Row: {
          id: string
          code: string
          business_id: string
          service_id: string
          session_id: string
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_whatsapp: string | null
          pax_count: number
          unit_price_cents: number
          total_cents: number
          platform_fee_cents: number
          status: "requested" | "confirmed" | "cancelled" | "refunded" | "no_show" | "completed"
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_id: string | null
          delivery_code: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          business_id: string
          service_id: string
          session_id: string
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          pax_count: number
          unit_price_cents: number
          total_cents: number
          platform_fee_cents?: number
          status?: "requested" | "confirmed" | "cancelled" | "refunded" | "no_show" | "completed"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          delivery_code?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          business_id?: string
          service_id?: string
          session_id?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          pax_count?: number
          unit_price_cents?: number
          total_cents?: number
          platform_fee_cents?: number
          status?: "requested" | "confirmed" | "cancelled" | "refunded" | "no_show" | "completed"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          delivery_code?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          id: string
          business_id: string
          name: string
          description: string | null
          capacity: number
          price_per_night_cents: number
          bed_layout: string | null
          amenities: string[]
          photos: string[]
          position: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          name: string
          description?: string | null
          capacity?: number
          price_per_night_cents: number
          bed_layout?: string | null
          amenities?: string[]
          photos?: string[]
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          name?: string
          description?: string | null
          capacity?: number
          price_per_night_cents?: number
          bed_layout?: string | null
          amenities?: string[]
          photos?: string[]
          position?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          code: string
          business_id: string
          room_id: string
          customer_id: string | null
          customer_name: string
          customer_email: string | null
          customer_whatsapp: string | null
          guests: number
          check_in: string
          check_out: string
          nights: number
          nightly_cents: number
          total_cents: number
          platform_fee_cents: number
          status: "hold" | "requested" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "refunded"
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          payment_id: string | null
          external_source: string | null
          ical_uid: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code?: string
          business_id: string
          room_id: string
          customer_id?: string | null
          customer_name: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          guests?: number
          check_in: string
          check_out: string
          nightly_cents: number
          total_cents: number
          platform_fee_cents?: number
          status?: "hold" | "requested" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "refunded"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          external_source?: string | null
          ical_uid?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          business_id?: string
          room_id?: string
          customer_id?: string | null
          customer_name?: string
          customer_email?: string | null
          customer_whatsapp?: string | null
          guests?: number
          check_in?: string
          check_out?: string
          nightly_cents?: number
          total_cents?: number
          platform_fee_cents?: number
          status?: "hold" | "requested" | "confirmed" | "checked_in" | "checked_out" | "cancelled" | "refunded"
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          payment_id?: string | null
          external_source?: string | null
          ical_uid?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          id: string
          code: string
          kind: "percent" | "fixed"
          value_int: number
          min_subtotal_cents: number
          max_discount_cents: number | null
          business_id: string | null
          starts_at: string | null
          ends_at: string | null
          max_uses: number | null
          used_count: number
          is_active: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          kind: "percent" | "fixed"
          value_int: number
          min_subtotal_cents?: number
          max_discount_cents?: number | null
          business_id?: string | null
          starts_at?: string | null
          ends_at?: string | null
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          kind?: "percent" | "fixed"
          value_int?: number
          min_subtotal_cents?: number
          max_discount_cents?: number | null
          business_id?: string | null
          starts_at?: string | null
          ends_at?: string | null
          max_uses?: number | null
          used_count?: number
          is_active?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: number
          default_take_rate_bps: number
          d_plus_days: number
          updated_at: string
        }
        Insert: {
          id?: number
          default_take_rate_bps?: number
          d_plus_days?: number
          updated_at?: string
        }
        Update: {
          id?: number
          default_take_rate_bps?: number
          d_plus_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      take_rate_campaigns: {
        Row: {
          id: string
          name: string
          notes: string | null
          take_rate_bps: number
          starts_at: string | null
          ends_at: string | null
          applies_to: string
          applies_id: string | null
          priority: number
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          notes?: string | null
          take_rate_bps: number
          starts_at?: string | null
          ends_at?: string | null
          applies_to: string
          applies_id?: string | null
          priority?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          notes?: string | null
          take_rate_bps?: number
          starts_at?: string | null
          ends_at?: string | null
          applies_to?: string
          applies_id?: string | null
          priority?: number
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      service_option_groups: {
        Row: {
          id: string
          service_id: string
          name: string
          kind: "required" | "optional"
          min_choices: number
          max_choices: number
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          name: string
          kind?: "required" | "optional"
          min_choices?: number
          max_choices?: number
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          name?: string
          kind?: "required" | "optional"
          min_choices?: number
          max_choices?: number
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_options: {
        Row: {
          id: string
          group_id: string
          name: string
          price_delta_cents: number
          is_default: boolean
          is_active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          price_delta_cents?: number
          is_default?: boolean
          is_active?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          price_delta_cents?: number
          is_default?: boolean
          is_active?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          business_id: string
          capacity: number | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_active: boolean
          kind: Database["public"]["Enums"]["service_kind"]
          meta: Json
          name: string
          position: number
          price_cents: number
          original_price_cents: number | null
          section: string | null
          is_featured: boolean
          serves_people: number | null
          stock: number | null
          updated_at: string
        }
        Insert: {
          business_id: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind: Database["public"]["Enums"]["service_kind"]
          meta?: Json
          name: string
          position?: number
          price_cents: number
          original_price_cents?: number | null
          section?: string | null
          is_featured?: boolean
          serves_people?: number | null
          stock?: number | null
          updated_at?: string
        }
        Update: {
          business_id?: string
          capacity?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          kind?: Database["public"]["Enums"]["service_kind"]
          meta?: Json
          name?: string
          position?: number
          price_cents?: number
          original_price_cents?: number | null
          section?: string | null
          is_featured?: boolean
          serves_people?: number | null
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_accounts: {
        Row: {
          balance_cents: number
          business_id: string | null
          created_at: string
          id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          balance_cents?: number
          business_id?: string | null
          created_at?: string
          id?: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          balance_cents?: number
          business_id?: string | null
          created_at?: string
          id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_accounts_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          account_id: string
          amount_cents: number
          balance_after_cents: number
          created_at: string
          description: string | null
          id: string
          metadata: Json
          order_id: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          withdrawal_id: string | null
        }
        Insert: {
          account_id: string
          amount_cents: number
          balance_after_cents: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          type: Database["public"]["Enums"]["wallet_tx_type"]
          withdrawal_id?: string | null
        }
        Update: {
          account_id?: string
          amount_cents?: number
          balance_after_cents?: number
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          order_id?: string | null
          type?: Database["public"]["Enums"]["wallet_tx_type"]
          withdrawal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "wallet_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawal_requests: {
        Row: {
          account_id: string
          amount_cents: number
          asaas_transfer_id: string | null
          business_id: string | null
          created_at: string
          id: string
          paid_at: string | null
          pix_key: string
          pix_kind: string
          rejection_reason: string | null
          requested_by: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount_cents: number
          asaas_transfer_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_key: string
          pix_kind: string
          rejection_reason?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount_cents?: number
          asaas_transfer_id?: string | null
          business_id?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          pix_key?: string
          pix_kind?: string
          rejection_reason?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawal_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "wallet_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawal_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      business_scores: {
        Row: {
          avg_stars: number | null
          bayesian_score: number | null
          business_id: string | null
          total_reviews: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      effective_take_rate_bps: {
        Args: { p_business_id: string; p_category_id: string }
        Returns: number
      }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      validate_coupon: {
        Args: {
          p_code: string
          p_subtotal_cents: number
          p_business_id: string
        }
        Returns: { coupon_id: string | null; discount_cents: number; error: string | null }[]
      }
      settle_completed_orders: {
        Args: Record<string, never>
        Returns: { settled: number; total_credited_cents: number }[]
      }
      is_room_available: {
        Args: {
          p_room_id: string
          p_check_in: string
          p_check_out: string
          p_exclude_booking: string | null
        }
        Returns: boolean
      }
      is_rental_available: {
        Args: {
          p_service_id: string
          p_pickup_at: string
          p_return_at: string
          p_exclude_id: string | null
        }
        Returns: boolean
      }
    }
    Enums: {
      business_type:
        | "restaurante"
        | "mercado"
        | "farmacia"
        | "conveniencia"
        | "loja"
        | "operador_passeio"
        | "pousada"
        | "residencia"
        | "locadora"
        | "servico"
        | "motorista"
      lead_type: "waitlist" | "comercio" | "operador" | "motorista" | "pousada"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "ready"
        | "in_transit"
        | "delivered"
        | "completed"
        | "cancelled"
        | "refunded"
      payment_method: "pix" | "card" | "cash" | "wallet"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      rated_entity_kind: "business" | "driver" | "service"
      service_kind:
        | "food_item"
        | "tour"
        | "rental"
        | "lodging"
        | "transport"
        | "service"
        | "ticket"
      user_role: "customer" | "business_owner" | "driver" | "admin"
      wallet_tx_type:
        | "cashback"
        | "topup"
        | "order_payment"
        | "order_refund"
        | "withdrawal"
        | "adjustment"
      withdrawal_status: "requested" | "processing" | "paid" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
