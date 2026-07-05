import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const HubCard = ({
  href,
  icon,
  title,
  children,
  badge,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) => {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-muted/40"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{title}</p>
          {badge}
        </div>
        <p className="text-xs text-muted-foreground">{children}</p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  );
};
