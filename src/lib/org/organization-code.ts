/** Platform admin org codes — OTP login is not used; use admin password sign-in instead. */
export function isReservedAdminOrganizationCode(code: string): boolean {
  const u = code.trim().toUpperCase();
  return u === "ADMIN0" || u === "ADMIN";
}
