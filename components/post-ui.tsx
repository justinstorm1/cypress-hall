"use client";

import { ConvexError } from "convex/values";
import { VenetianMask } from "lucide-react";

import type { PublicAuthor } from "@/convex/authors";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export type Author = PublicAuthor;

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ConvexError && typeof err.data === "string" ? err.data : fallback;
}

export function timeAgo(creationTime: number, now: number) {
  const seconds = Math.max(0, Math.floor((now - creationTime) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(creationTime).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function UserAvatar({
  author,
  size = "md",
  className,
}: {
  author: Author | null;
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "size-8" : "size-10";

  if (!author) {
    return (
      <Avatar
        className={cn(
          sizeClass,
          "shrink-0 bg-gradient-to-br from-muted to-muted/60 ring-1 ring-border",
          className
        )}
      >
        <AvatarFallback className="bg-transparent text-muted-foreground">
          <VenetianMask className={size === "sm" ? "size-4" : "size-5"} />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar className={cn(sizeClass, "shrink-0 ring-1 ring-border", className)}>
      {author.image && <AvatarImage src={author.image} alt="" referrerPolicy="no-referrer" />}
      <AvatarFallback
        className={cn("bg-primary/10 font-medium text-primary", size === "sm" && "text-xs")}
      >
        {initials(author.name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function AvatarSkeleton({ size = "md", className }: { size?: "sm" | "md"; className?: string }) {
  return (
    <div
      className={cn(
        size === "sm" ? "size-8" : "size-10",
        "shrink-0 animate-pulse rounded-full bg-muted",
        className
      )}
    />
  );
}

export function AuthorLine({
  author,
  anonymous,
  isMine,
  creationTime,
  now,
  className,
}: {
  author: Author | null;
  anonymous: boolean;
  isMine: boolean;
  creationTime: number;
  now: number;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 text-sm", className)}>
      <span className="min-w-0 truncate font-semibold">{author?.name ?? "Anonymous"}</span>
      {author && <span className="shrink-0 text-muted-foreground">{author.ucid}</span>}
      {anonymous && isMine && (
        <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-px text-[11px] font-medium text-primary">
          You
        </span>
      )}
      <span aria-hidden="true" className="shrink-0 text-muted-foreground">
        ·
      </span>
      <time
        dateTime={new Date(creationTime).toISOString()}
        title={new Date(creationTime).toLocaleString()}
        className="shrink-0 text-muted-foreground"
      >
        {timeAgo(creationTime, now)}
      </time>
    </div>
  );
}

export function CharCounter({ count, max }: { count: number; max: number }) {
  const remaining = max - count;
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(count / max, 1);
  const tone =
    remaining <= 0 ? "text-destructive" : remaining <= 50 ? "text-amber-500" : "text-primary";

  return (
    <div className="flex items-center gap-1.5" title={`${count} / ${max} characters`}>
      {remaining <= 50 && (
        <span className={cn("text-xs font-medium tabular-nums", tone)}>{remaining}</span>
      )}
      <svg viewBox="0 0 24 24" className="size-6 -rotate-90" aria-hidden="true">
        <circle cx="12" cy="12" r={radius} fill="none" strokeWidth="2.5" className="stroke-muted" />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={cn("transition-[stroke-dashoffset,color] duration-200", tone)}
        />
      </svg>
      <span className="sr-only" aria-live="polite">
        {remaining} characters remaining
      </span>
    </div>
  );
}

export function AnonymousToggle({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <Label className="cursor-pointer gap-2 font-normal text-muted-foreground transition-colors hover:text-foreground has-data-checked:text-foreground">
      <Checkbox checked={checked} onCheckedChange={(value) => onCheckedChange(value)} />
      <VenetianMask className="size-4" />
      {label}
    </Label>
  );
}
