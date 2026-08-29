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
      };
      clubes: {
        Row: {
          id: string;
          nombre: string;
          pais: string;
          confederacion: string | null;
          logo_url: string | null;
          creado_en: string;
        };
        Insert: Partial<Database["public"]["Tables"]["clubes"]["Row"]> & {
          nombre: string;
          pais: string;
        };
        Update: Partial<Database["public"]["Tables"]["clubes"]["Row"]>;
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
      };
      partidos: {
        Row: {
          id: string;
          competicion_id: string;
          fase: "liga" | "eliminatoria" | "final";
          fecha: string;
          local_id: string;
          visitante_id: string;
          goles_local: number;
          goles_visitante: number;
          imagen_evidencia: string | null;
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
      };
      rankings: {
        Row: {
          id: string;
          competicion_id: string;
          club_id: string;
          puntos: number;
          partidos_jugados: number;
          fecha_actualizacion: string;
        };
        Insert: Partial<Database["public"]["Tables"]["rankings"]["Row"]> & {
          competicion_id: string;
          club_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["rankings"]["Row"]>;
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
      };
    };
  };
};
