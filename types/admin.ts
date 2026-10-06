import type { License, LicenseKey, Profile, SharedConfig } from "@/types/database";

export interface LicenseKeyWithProfile extends LicenseKey {
  redeemed_profile: Pick<Profile, "username" | "avatar_url"> | null;
}

export interface AdminUser extends Profile {
  licenses: License[];
}

export interface SharedConfigWithAuthor extends SharedConfig {
  author: string;
}
