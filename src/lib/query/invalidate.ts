import type { QueryClient, QueryKey } from "@tanstack/react-query";

/** Invalidate a list of query keys without repeating boilerplate in mutation handlers. */
export function invalidateQueryKeys(queryClient: QueryClient, queryKeys: QueryKey[]) {
  for (const queryKey of queryKeys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}
