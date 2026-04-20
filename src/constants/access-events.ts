/** Fired when API returns 403 with inactive / deactivated role group message */
export const ACCESS_BLOCKED_EVENT = "billbook:access-blocked";

/** Optional: ask AuthProvider to refetch /auth/me (e.g. after 403) */
export const REFRESH_PERMISSIONS_EVENT = "billbook:refresh-permissions";
