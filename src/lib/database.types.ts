export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nome: string;
          login: string;
          email: string;
          role: "student" | "admin" | "super_admin";
          must_change_password: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nome: string;
          login: string;
          email: string;
          role?: "student" | "admin" | "super_admin";
          must_change_password?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          login?: string;
          email?: string;
          role?: "student" | "admin" | "super_admin";
          must_change_password?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      numeros: {
        Row: {
          id: string;
          numero: number;
          aluno_id: string;
          status: "DISPONIVEL" | "PEGO";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero: number;
          aluno_id: string;
          status?: "DISPONIVEL" | "PEGO";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero?: number;
          aluno_id?: string;
          status?: "DISPONIVEL" | "PEGO";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "numeros_aluno_id_fkey";
            columns: ["aluno_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      registros: {
        Row: {
          id: string;
          numero_id: string;
          aluno_id: string;
          nome_comprador: string;
          telefone: string;
          comprovante_url: string;
          valor: number;
          status: "PEGO" | "CANCELADO";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          numero_id: string;
          aluno_id: string;
          nome_comprador: string;
          telefone: string;
          comprovante_url: string;
          valor?: number;
          status?: "PEGO" | "CANCELADO";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          numero_id?: string;
          aluno_id?: string;
          nome_comprador?: string;
          telefone?: string;
          comprovante_url?: string;
          valor?: number;
          status?: "PEGO" | "CANCELADO";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "registros_numero_id_fkey";
            columns: ["numero_id"];
            isOneToOne: true;
            referencedRelation: "numeros";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "registros_aluno_id_fkey";
            columns: ["aluno_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      student_progress: {
        Row: {
          id: string;
          nome: string;
          login: string;
          role: "student" | "admin" | "super_admin";
          total: number;
          vendidos: number;
          disponiveis: number;
          arrecadado: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      get_raffle_stats: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      register_raffle_number: {
        Args: {
          p_numero_id: string;
          p_nome_comprador: string;
          p_telefone: string;
          p_comprovante_path: string;
        };
        Returns: Json;
      };
      admin_set_role: {
        Args: {
          p_user_id: string;
          p_role: "student" | "admin";
        };
        Returns: Json;
      };
      admin_release_number: {
        Args: {
          p_numero_id: string;
        };
        Returns: Json;
      };
      admin_mark_number_taken: {
        Args: {
          p_numero_id: string;
          p_nome_comprador: string;
          p_telefone: string;
          p_comprovante_path?: string;
        };
        Returns: Json;
      };
      admin_delete_registro: {
        Args: {
          p_registro_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
