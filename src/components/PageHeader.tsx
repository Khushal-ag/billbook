import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function PageHeader({ title, description, action }: PageHeaderProps) {
  if (action) {
    return (
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="page-header mb-0">
          <h1 className="page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {title}
          </h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
    );
  }

  return (
    <div className="page-header">
      <h1 className="page-title bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
        {title}
      </h1>
      {description && <p className="page-description">{description}</p>}
    </div>
  );
}
