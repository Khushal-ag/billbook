import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook to check user permissions based on role
 */
export function usePermissions() {
  const { user } = useAuth();

  return {
    isOwner: user?.role === "OWNER",
    isUser: user?.role === "STAFF",
    role: user?.role,
    user,
  };
}
