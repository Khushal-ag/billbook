import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessUsers } from "@/hooks/use-business";

interface BusinessUsersCardProps {
  embedded?: boolean;
}

export function BusinessUsersCard({ embedded = false }: BusinessUsersCardProps) {
  const { data: users, isPending } = useBusinessUsers();

  const headerEmbedded = embedded ? (
    <div className="mb-6">
      <h3 className="text-base font-semibold tracking-tight">Team & access</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        People who can sign in to this business. Roles control who can change{" "}
        <strong>business settings</strong> (owners only).
      </p>
    </div>
  ) : null;

  if (isPending) {
    const sk = (
      <div className="space-y-3" aria-label="Loading team members">
        <Skeleton className="h-16 rounded-md" />
        <Skeleton className="h-16 rounded-md" />
      </div>
    );
    if (embedded) {
      return (
        <div>
          {headerEmbedded}
          {sk}
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team & access</CardTitle>
          <CardDescription>Business settings — who can use this organization</CardDescription>
        </CardHeader>
        <CardContent>{sk}</CardContent>
      </Card>
    );
  }

  if (!users || !Array.isArray(users) || users.length === 0) {
    const empty = (
      <p className="text-sm text-muted-foreground">
        No team members found. Add users to collaborate on your business.
      </p>
    );
    if (embedded) {
      return (
        <div>
          {headerEmbedded}
          {empty}
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team & access</CardTitle>
          <CardDescription>Business settings</CardDescription>
        </CardHeader>
        <CardContent>{empty}</CardContent>
      </Card>
    );
  }

  const list = (
    <div className="space-y-3" role="list" aria-label="Team members list">
      {users.map((u) => (
        <div
          key={u.id}
          role="listitem"
          className="flex items-center justify-between rounded-lg border bg-background/50 px-4 py-3 transition-colors hover:bg-muted/40"
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
            className="ml-3 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium capitalize text-primary"
            aria-label={`Role: ${u.role.toLowerCase()}`}
          >
            {u.role.toLowerCase()}
          </span>
        </div>
      ))}
    </div>
  );

  if (embedded) {
    return (
      <div>
        {headerEmbedded}
        {list}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team & access</CardTitle>
        <CardDescription>Business settings — organization members and roles</CardDescription>
      </CardHeader>
      <CardContent>{list}</CardContent>
    </Card>
  );
}
