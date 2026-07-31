import type { License, LicenseKey, Profile } from "@/types/database";

export interface LicenseKeyWithProfile extends LicenseKey {
  redeemed_profile: Pick<Profile, "username" | "avatar_url"> | null;
}

export interface AdminUser extends Profile {
  licenses: License[];
}
