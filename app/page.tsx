"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ghost, Loader2, LogOut, MessagesSquare } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { MAX_BODY_LENGTH, MAX_SUBJECT_LENGTH } from "@/convex/limits";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AnonymousToggle,
  AvatarSkeleton,
  CharCounter,
  UserAvatar,
  errorMessage,
  type Author,
} from "@/components/post-ui";
import { PostCard } from "@/components/PostCard";

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function FeedSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex animate-pulse gap-4 px-6 py-5">
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="flex w-full flex-col gap-2 pt-1">
            <div className="h-3 w-32 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Composer({ viewer }: { viewer: Author | null | undefined }) {
  const createPost = useMutation(api.posts.createPost);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = body.trim().length > 0 && !submitting;
  const subjectRemaining = MAX_SUBJECT_LENGTH - subject.length;

  async function handlePost() {
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPost({ subject, body, anonymous });
      setSubject("");
      setBody("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't post that. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="border-b px-6 pt-5 pb-4 transition-colors focus-within:bg-muted/20">
      <div className="flex gap-4">
        {!anonymous && viewer === undefined ? (
          <AvatarSkeleton className="mt-1" />
        ) : (
          <UserAvatar author={anonymous ? null : (viewer ?? null)} className="mt-1" />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate px-3 text-sm text-muted-foreground">
            {anonymous ? (
              <>
                Posting as <span className="font-medium text-foreground">Anonymous</span>
                <span> — your name and UCID stay hidden</span>
              </>
            ) : viewer ? (
              <>
                Posting as <span className="font-medium text-foreground">{viewer.name}</span>
                <span> · {viewer.ucid}</span>
              </>
            ) : (
              <span className="inline-block h-3 w-40 animate-pulse rounded bg-muted align-middle" />
            )}
          </p>

          <div className="flex items-start gap-2">
            <Textarea
              value={subject}
              onChange={(e) => setSubject(e.target.value.replace(/\s*\n\s*/g, " "))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  bodyRef.current?.focus();
                }
              }}
              rows={1}
              maxLength={MAX_SUBJECT_LENGTH}
              placeholder="Title (optional)"
              aria-label="Title"
              className="min-h-0 min-w-0 flex-1 resize-none border-0 bg-transparent p-3 pb-1 text-2xl! leading-tight font-bold tracking-tight wrap-anywhere shadow-none placeholder:text-muted-foreground/40 focus-visible:ring-0 dark:bg-transparent"
            />
            {subjectRemaining <= 20 && (
              <span
                className={cn(
                  "shrink-0 pt-4 text-xs tabular-nums",
                  subjectRemaining <= 0 ? "text-destructive" : "text-amber-500"
                )}
              >
                {subjectRemaining} left
              </span>
            )}
          </div>

          <Textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void handlePost();
              }
            }}
            maxLength={MAX_BODY_LENGTH}
            placeholder="What's happening?"
            aria-label="Post"
            className="max-h-72 min-h-16 resize-none overflow-y-auto border-0 bg-transparent p-3 text-lg! leading-snug wrap-anywhere shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent"
          />

          <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <AnonymousToggle
              checked={anonymous}
              onCheckedChange={setAnonymous}
              label="Post anonymously"
            />

            <div className="flex items-center gap-3">
              {body.length > 0 && <CharCounter count={body.length} max={MAX_BODY_LENGTH} />}
              <Button
                className="rounded-full px-5 shadow-sm transition-transform active:scale-95"
                disabled={!canPost}
                onClick={handlePost}
                title="Post (⌘/Ctrl + Enter)"
              >
                {submitting && <Loader2 className="size-4 animate-spin" />}
                Post
              </Button>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-2 px-3 text-xs text-destructive">
              {error}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default function Page() {
  const posts = useQuery(api.posts.getPosts);
  const viewer = useQuery(api.users.viewer);
  const { signOut } = useAuthActions();
  const now = useNow(30_000);

  const [actionError, setActionError] = useState<string | null>(null);

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col border-x bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-6 py-3.5 backdrop-blur-md">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <MessagesSquare className="size-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-base leading-tight font-semibold tracking-tight">Cypresshall</h1>
            <p className="text-xs text-muted-foreground">NJIT students only</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              render={<Button variant="ghost" size="icon" className="size-9 rounded-full p-0" />}
            >
              {viewer === undefined ? (
                <AvatarSkeleton size="sm" />
              ) : (
                <UserAvatar author={viewer} size="sm" />
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {viewer && (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="flex flex-col gap-0.5 py-1.5">
                      <span className="truncate text-sm font-medium text-foreground">
                        {viewer.name}
                      </span>
                      <span className="truncate font-normal">{viewer.ucid}@njit.edu</span>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <Composer viewer={viewer} />

        {actionError && (
          <p role="alert" className="border-b bg-destructive/5 px-6 py-2 text-sm text-destructive">
            {actionError}
          </p>
        )}

        {posts === undefined ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-24 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Ghost className="size-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">No posts yet</p>
              <p className="text-sm">Be the first to share something.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                viewer={viewer}
                now={now}
                onError={setActionError}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
