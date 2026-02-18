import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessUsers } from "@/hooks/use-business";

export function BusinessUsersCard() {
  const { data: users, isPending } = useBusinessUsers();

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" aria-label="Loading team members">
            <Skeleton className="h-16 rounded-md" />
            <Skeleton className="h-16 rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No team members found. Add users to collaborate on your business.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Members</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3" role="list" aria-label="Team members list">
          {users.map((u) => (
            <div
              key={u.id}
              role="listitem"
              className="flex items-center justify-between rounded-md border px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {u.firstName || u.lastName
                    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                    : u.email}
                </p>
                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
              </div>
              <span
                className="ml-3 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize"
                aria-label={`Role: ${u.role.toLowerCase()}`}
              >
                {u.role.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
