"use client";

import { ReactNode, useState } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div className={`card p-6 ${hover ? "card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  accent?: "golden" | "jade" | "sapphire" | "carmine";
}

const accentStyles = {
  golden: "bg-gradient-to-br from-amber-200/50 to-amber-300/30 text-golden-rich border border-golden-deep/30 shadow-sm",
  jade: "bg-gradient-to-br from-emerald-100 to-emerald-200/40 text-jade border border-jade/30 shadow-sm",
  sapphire: "bg-gradient-to-br from-sky-100 to-sky-200/40 text-sapphire border border-sapphire/30 shadow-sm",
  carmine: "bg-gradient-to-br from-rose-100 to-rose-200/40 text-carmine border border-carmine/30 shadow-sm",
};

export function StatCard({ label, value, icon, accent = "golden" }: StatCardProps) {
  return (
    <Card hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-golden-rich uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal">
            {value}
          </p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${accentStyles[accent]}`}
        >
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Badge({ 
  children, 
  variant = "golden",
  className = "" 
}: { 
  children: React.ReactNode; 
  variant?: "golden" | "jade" | "sapphire" | "carmine";
  className?: string;
}) {
  const styles = {
    golden: "bg-golden-deep/15 text-golden-rich border-golden-deep/30 shadow-xs",
    jade: "bg-jade/15 text-jade border-jade/30 shadow-xs",
    sapphire: "bg-sapphire/15 text-sapphire border-sapphire/30 shadow-xs",
    carmine: "bg-carmine/15 text-carmine border-carmine/30 shadow-xs",
  };

  return (
    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-bold ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/50 border border-golden-deep/30 text-golden-rich shadow-sm">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-charcoal">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
    </div>
  );
}

export function MemberAvatar({
  name,
  photo,
  size = "md",
}: {
  name: string;
  photo?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const [loadFailed, setLoadFailed] = useState(false);

  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-16 w-16 text-xl",
    lg: "h-24 w-24 text-3xl",
  };

  const initials = (name || "佛")
    .split("")
    .filter((c) => c.trim())
    .slice(0, 1)
    .join("");

  if (photo && !loadFailed) {
    return (
      <img
        src={photo}
        alt={name}
        onError={() => setLoadFailed(true)}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-golden-deep/30 shadow-md transition-all duration-300 hover:scale-105`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br from-golden-deep via-amber-500 to-ocher font-black text-white ring-2 ring-golden-deep/30 shadow-inner select-none`}
    >
      {initials}
    </div>
  );
}

export { Skeleton } from "@/components/ui/Feedback";
