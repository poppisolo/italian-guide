export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      classi: {
        Row: {
          aula: string | null
          created_at: string
          giorno_settimana: string | null
          id: string
          insegnante_id: string | null
          livello: string | null
          nome: string
          orario_fine: string | null
          orario_inizio: string | null
        }
        Insert: {
          aula?: string | null
          created_at?: string
          giorno_settimana?: string | null
          id?: string
          insegnante_id?: string | null
          livello?: string | null
          nome: string
          orario_fine?: string | null
          orario_inizio?: string | null
        }
        Update: {
          aula?: string | null
          created_at?: string
          giorno_settimana?: string | null
          id?: string
          insegnante_id?: string | null
          livello?: string | null
          nome?: string
          orario_fine?: string | null
          orario_inizio?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classi_insegnante_id_fkey"
            columns: ["insegnante_id"]
            isOneToOne: false
            referencedRelation: "insegnanti"
            referencedColumns: ["id"]
          },
        ]
      }
      insegnanti: {
        Row: {
          cognome: string
          created_at: string
          data_nascita: string | null
          data_scadenza_socio: string | null
          disponibilita: Json | null
          email: string | null
          id: string
          livello_preferito: string | null
          nazionalita: string | null
          nome: string
          note_metodologiche: string | null
          telefono: string | null
        }
        Insert: {
          cognome: string
          created_at?: string
          data_nascita?: string | null
          data_scadenza_socio?: string | null
          disponibilita?: Json | null
          email?: string | null
          id?: string
          livello_preferito?: string | null
          nazionalita?: string | null
          nome: string
          note_metodologiche?: string | null
          telefono?: string | null
        }
        Update: {
          cognome?: string
          created_at?: string
          data_nascita?: string | null
          data_scadenza_socio?: string | null
          disponibilita?: Json | null
          email?: string | null
          id?: string
          livello_preferito?: string | null
          nazionalita?: string | null
          nome?: string
          note_metodologiche?: string | null
          telefono?: string | null
        }
        Relationships: []
      }
      iscrizioni: {
        Row: {
          attiva: boolean | null
          classe_id: string
          data_iscrizione: string | null
          id: string
          studente_id: string
        }
        Insert: {
          attiva?: boolean | null
          classe_id: string
          data_iscrizione?: string | null
          id?: string
          studente_id: string
        }
        Update: {
          attiva?: boolean | null
          classe_id?: string
          data_iscrizione?: string | null
          id?: string
          studente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "iscrizioni_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iscrizioni_studente_id_fkey"
            columns: ["studente_id"]
            isOneToOne: false
            referencedRelation: "studenti"
            referencedColumns: ["id"]
          },
        ]
      }
      presenze: {
        Row: {
          classe_id: string
          data: string
          id: string
          note: string | null
          presente: boolean | null
          studente_id: string
        }
        Insert: {
          classe_id: string
          data: string
          id?: string
          note?: string | null
          presente?: boolean | null
          studente_id: string
        }
        Update: {
          classe_id?: string
          data?: string
          id?: string
          note?: string | null
          presente?: boolean | null
          studente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presenze_classe_id_fkey"
            columns: ["classe_id"]
            isOneToOne: false
            referencedRelation: "classi"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presenze_studente_id_fkey"
            columns: ["studente_id"]
            isOneToOne: false
            referencedRelation: "studenti"
            referencedColumns: ["id"]
          },
        ]
      }
      studenti: {
        Row: {
          cognome: string
          created_at: string
          data_nascita: string | null
          disponibilita: Json | null
          email: string | null
          id: string
          lingue_parlate: string[] | null
          livello: string | null
          nazionalita: string | null
          nome: string
          note: string | null
          stato_scuola: string
          telefono: string | null
        }
        Insert: {
          cognome: string
          created_at?: string
          data_nascita?: string | null
          disponibilita?: Json | null
          email?: string | null
          id?: string
          lingue_parlate?: string[] | null
          livello?: string | null
          nazionalita?: string | null
          nome: string
          note?: string | null
          stato_scuola?: string
          telefono?: string | null
        }
        Update: {
          cognome?: string
          created_at?: string
          data_nascita?: string | null
          disponibilita?: Json | null
          email?: string | null
          id?: string
          lingue_parlate?: string[] | null
          livello?: string | null
          nazionalita?: string | null
          nome?: string
          note?: string | null
          stato_scuola?: string
          telefono?: string | null
        }
        Relationships: []
      }
      test: {
        Row: {
          created_at: string
          data_test: string | null
          id: string
          livello_assegnato: string | null
          note: string | null
          studente_id: string
        }
        Insert: {
          created_at?: string
          data_test?: string | null
          id?: string
          livello_assegnato?: string | null
          note?: string | null
          studente_id: string
        }
        Update: {
          created_at?: string
          data_test?: string | null
          id?: string
          livello_assegnato?: string | null
          note?: string | null
          studente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_studente_id_fkey"
            columns: ["studente_id"]
            isOneToOne: false
            referencedRelation: "studenti"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
