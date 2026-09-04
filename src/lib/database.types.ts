export type Database = {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          nombre: string;
          correo: string;
          rol: "admin" | "usuario";
          fecha_registro: string;
        };
        Insert: Partial<Database["public"]["Tables"]["usuarios"]["Row"]> & {
          id: string;
          nombre: string;
          correo: string;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Row"]>;
        Relationships: [];
      };
      clubes: {
        Row: {
          id: string;
          nombre: string;
          pais: string;
          confederacion: string | null;
          logo_url: string | null;
          eliminado: boolean;
          fecha_eliminacion: string | null;
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clubes"]["Row"]> & {
          nombre: string;
          pais: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubes"]["Row"]>;
        Relationships: [];
      };
      competiciones: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          tipo: "liga" | "copa" | "internacional";
          organizador: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["competiciones"]["Row"]> & {
          slug: string;
          nombre: string;
          tipo: "liga" | "copa" | "internacional";
        };
        Update: Partial<Database["public"]["Tables"]["competiciones"]["Row"]>;
        Relationships: [];
      };
      campeones: {
        Row: {
          id: string;
          club_id: string;
          competicion_id: string;
          titulos: number;
          primer_titulo: number | null;
          ultimo_titulo: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["campeones"]["Row"]> & {
          club_id: string;
          competicion_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["campeones"]["Row"]>;
        Relationships: [];
      };
      partidos: {
        Row: {
          id: string;
          competicion_id: string;
          fase: "liga" | "eliminatoria" | "final";
          // Ronda específica (ej. "octavos_ida", "dieciseisavos", "final").
          ronda: string | null;
          fecha: string;
          local_id: string;
          visitante_id: string;
          goles_local: number;
          goles_visitante: number;
          imagen_evidencia: string | null;
          eliminado: boolean;
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["partidos"]["Row"]> & {
          competicion_id: string;
          fase: "liga" | "eliminatoria" | "final";
          fecha: string;
          local_id: string;
          visitante_id: string;
          goles_local: number;
          goles_visitante: number;
        };
        Update: Partial<Database["public"]["Tables"]["partidos"]["Row"]>;
        Relationships: [];
      };
      rankings: {
        Row: {
          id: string;
          competicion_id: string;
          club_id: string;
          puntos: number;
          partidos_jugados: number;
          // Quitar/restaurar un club de este ranking puntual, sin
          // borrarlo de la tabla "clubes" (que es compartida).
          eliminado: boolean;
          fecha_eliminacion: string | null;
          fecha_actualizacion: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rankings"]["Row"]> & {
          competicion_id: string;
          club_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["rankings"]["Row"]>;
        Relationships: [];
      };
      // Ranking compartido entre varias competiciones (ej. las 4
      // competiciones europeas -> grupo "uefa-global").
      ranking_global: {
        Row: {
          id: string;
          grupo: "uefa-global" | "fifa-world";
          club_id: string;
          puntos: number;
          puntos_base: number;
          partidos_jugados: number;
          victorias: number;
          empates: number;
          derrotas: number;
          eliminado: boolean;
          fecha_eliminacion: string | null;
          fecha_actualizacion: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ranking_global"]["Row"]> & {
          grupo: "uefa-global" | "fifa-world";
          club_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_global"]["Row"]>;
        Relationships: [];
      };
      // Foto histórica de puntos, guardada sola por un trigger cada vez
      // que cambian los puntos de "rankings" o "ranking_global". Sirve
      // para calcular el cambio de 1 año sin que nadie lo cargue a mano.
      ranking_historial: {
        Row: {
          id: string;
          tipo: "competicion" | "grupo";
          referencia: string;
          club_id: string;
          puntos: number;
          fecha: string;
        };
        Insert: Partial<Database["public"]["Tables"]["ranking_historial"]["Row"]> & {
          tipo: "competicion" | "grupo";
          referencia: string;
          club_id: string;
          puntos: number;
        };
        Update: Partial<Database["public"]["Tables"]["ranking_historial"]["Row"]>;
        Relationships: [];
      };
      finales: {
        Row: {
          id: string;
          competicion_id: string;
          anio: number;
          club_local_id: string;
          club_visitante_id: string;
          goles_local: number;
          goles_visitante: number;
          pais_local: string | null;
          pais_visitante: string | null;
          conf_local: string | null;
          conf_visitante: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["finales"]["Row"]> & {
          competicion_id: string;
          anio: number;
          club_local_id: string;
          club_visitante_id: string;
          goles_local: number;
          goles_visitante: number;
        };
        Update: Partial<Database["public"]["Tables"]["finales"]["Row"]>;
        Relationships: [];
      };
      enfrentamientos: {
        Row: {
          id: string;
          club1_id: string;
          club2_id: string;
          competicion_id: string;
          partidos: number;
          victorias_club1: number;
          victorias_club2: number;
          empates: number;
          goles_club1: number;
          goles_club2: number;
        };
        Insert: Partial<Database["public"]["Tables"]["enfrentamientos"]["Row"]> & {
          club1_id: string;
          club2_id: string;
          competicion_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["enfrentamientos"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
