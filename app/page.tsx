"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import {
  Ellipsis,
  Ghost,
  GraduationCap,
  Heart,
  Loader2,
  LogOut,
  MessagesSquare,
  Trash2,
  VenetianMask,
} from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function timeAgo(creationTime: number) {
  const seconds = Math.floor((Date.now() - creationTime) / 1000);
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

function AnonAvatar() {
  return (
    <Avatar className="size-10 shrink-0 bg-gradient-to-br from-muted to-muted/60 ring-1 ring-border">
      <AvatarFallback className="bg-transparent text-muted-foreground">
        <VenetianMask className="size-5" />
      </AvatarFallback>
    </Avatar>
  );
}

function FeedSkeleton() {
  return (
    <div className="divide-y">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex animate-pulse gap-4 px-6 py-5">
          <div className="size-10 shrink-0 rounded-full bg-muted" />
          <div className="flex w-full flex-col gap-2 pt-1">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-4 w-2/3 rounded bg-muted" />
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const posts = useQuery(api.posts.getPosts);
  const createPost = useMutation(api.posts.createPost);
  const toggleLikePost = useMutation(api.posts.toggleLikePost);
  const deletePost = useMutation(api.posts.deletePost);
  const { signOut } = useAuthActions();

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = body.trim().length > 0 && !submitting;

  async function handlePost() {
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    const trimmedBody = body.trim();
    const trimmedSubject = subject.trim() || trimmedBody.split("\n")[0].slice(0, 80);
    try {
      await createPost({ subject: trimmedSubject, body: trimmedBody, likes: 0 });
      setSubject("");
      setBody("");
    } catch {
      setError("Couldn't post that. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleLikePost(postId: Id<"posts">) {
    try {
      await toggleLikePost({ postId });
    } catch {
      setError("Couldn't toggle like. Try again.");
    }
  }

  async function handleDeletePost(postId: Id<"posts">) {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await deletePost({ postId });
    } catch {
      setError("Couldn't delete that. Try again.");
    }
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col border-x bg-background">
        <header className="sticky top-0 z-10 flex items-center gap-3 border-b bg-background/80 px-6 py-4 backdrop-blur-md">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
            <MessagesSquare className="size-4" />
          </div>
          <div className="flex-1">
            <h1 className="text-base leading-tight font-semibold tracking-tight">
              Cypresshall
            </h1>
            <p className="text-xs text-muted-foreground">Anonymous · NJIT only</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground"
                />
              }
            >
              <Ellipsis className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem variant="destructive" onClick={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="border-b p-6 transition-colors focus-within:bg-muted/10">
          <div className="flex gap-4">
            <AnonAvatar />

            <div className="flex w-full flex-col gap-1">
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Give it a title"
                className="h-auto border-0 bg-transparent p-3 pb-0 text-2xl! font-bold shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's happening?"
                className="min-h-16 resize-none border-0 bg-transparent p-3 text-lg! leading-snug shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent"
              />

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="size-3.5" />
                  Only NJIT students can see this
                </div>

                <div className="flex items-center gap-3">
                  {error && <span className="text-xs text-destructive">{error}</span>}
                  <Button
                    className="rounded-full px-5 shadow-sm transition-transform active:scale-95"
                    disabled={!canPost}
                    onClick={handlePost}
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {posts === undefined ? (
          <FeedSkeleton />
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-24 text-center text-muted-foreground">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Ghost className="size-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">No posts yet</p>
              <p className="text-sm">Be the first to share something anonymously.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <article
                key={post._id}
                className="group flex animate-in gap-4 px-6 py-5 fade-in slide-in-from-top-2 duration-300 transition-colors hover:bg-muted/30"
              >
                <AnonAvatar />

                <div className="flex w-full min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium">Anonymous</span>
                    <span className="text-muted-foreground">·</span>
                    <time
                      className="text-muted-foreground"
                      title={new Date(post._creationTime).toLocaleString()}
                    >
                      {timeAgo(post._creationTime)}
                    </time>
                  </div>

                  <h2 className="font-semibold tracking-tight">{post.subject}</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {post.body}
                  </p>

                  <div className="-ml-2 flex items-center gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className={cn(
                          "size-8 rounded-full transition-colors hover:bg-red-500/10 hover:text-red-500",
                          post.likedByMe && "text-red-500"
                        )}
                        onClick={() => handleToggleLikePost(post._id)}
                      >
                        <Heart className={cn("size-4", post.likedByMe && "fill-current")} />
                      </Button>
                      <span
                        className={cn(
                          "text-sm tabular-nums",
                          post.likedByMe ? "text-red-500" : "text-muted-foreground"
                        )}
                      >
                        {post.likes}
                      </span>
                    </div>

                    {post.isMine && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="ml-auto size-8 rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        onClick={() => handleDeletePost(post._id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
