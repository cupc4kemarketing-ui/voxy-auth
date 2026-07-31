export type LicenseDuration = "1_day" | "7_days" | "14_days" | "30_days" | "lifetime";
export type LicenseKeyStatus = "unused" | "redeemed" | "disabled";
export type LicenseStatus = "active" | "expired" | "revoked";

export type Profile = {
  id: string;
  discord_id: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Admin = {
  user_id: string;
  created_at: string;
};

export type LicenseKey = {
  id: string;
  key: string;
  duration: LicenseDuration;
  status: LicenseKeyStatus;
  created_at: string;
  created_by: string | null;
  redeemed_by: string | null;
  redeemed_at: string | null;
};

export type License = {
  id: string;
  user_id: string;
  license_key_id: string;
  duration: LicenseDuration;
  status: LicenseStatus;
  started_at: string;
  expires_at: string | null;
  created_at: string;
};

export type Download = {
  id: string;
  user_id: string;
  version: string;
  filename: string;
  downloaded_at: string;
};

export type Release = {
  id: string;
  version: string;
  changelog: string;
  file_path: string;
  is_latest: boolean;
  released_at: string;
};

type TableDef<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: {
    foreignKeyName: string;
    columns: string[];
    isOneToOne?: boolean;
    referencedRelation: string;
    referencedColumns: string[];
  }[];
};

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<Profile>;
      admins: TableDef<Admin>;
      license_keys: {
        Row: LicenseKey;
        Insert: Partial<LicenseKey>;
        Update: Partial<LicenseKey>;
        Relationships: [
          {
            foreignKeyName: "license_keys_redeemed_by_fkey";
            columns: ["redeemed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      licenses: TableDef<License>;
      downloads: TableDef<Download>;
      releases: TableDef<Release>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
