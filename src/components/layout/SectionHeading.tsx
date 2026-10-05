interface SectionHeadingProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Título de seção: barra verde inclinada + caixa alta condensada. */
export function SectionHeading({ title, description, action }: SectionHeadingProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <span className="h-5 w-[5px] shrink-0 -skew-x-12 bg-primary" aria-hidden />
          <h2 className="font-display text-xl font-bold tracking-[0.06em] uppercase sm:text-2xl">{title}</h2>
        </div>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
