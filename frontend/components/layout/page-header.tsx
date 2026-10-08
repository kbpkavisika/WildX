interface PageHeaderProps {
  title: string;
  badge?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, badge, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="mr-auto flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <h1 className="m-0 text-page-title">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="m-0 text-nav text-ink-body">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
