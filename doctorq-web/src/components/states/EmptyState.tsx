import { LucideIcon, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "default" | "minimal" | "card";
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nenhum item encontrado",
  description = "Não há itens para exibir no momento.",
  actionLabel,
  onAction,
  variant = "default",
}: EmptyStateProps) {
  if (variant === "minimal") {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-8">
        <Icon className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">{title}</p>
        {actionLabel && onAction && (
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  if (variant === "card") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Icon className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            {description}
          </p>
          {actionLabel && onAction && (
            <Button onClick={onAction}>{actionLabel}</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <Icon className="h-20 w-20 text-muted-foreground/30 mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 text-center max-w-md">{description}</p>
      {actionLabel && onAction && <Button onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}
