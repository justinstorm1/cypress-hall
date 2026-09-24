"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Ghost, GraduationCap, Heart, Loader2, MessagesSquare, VenetianMask } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Id } from "@/convex/_generated/dataModel";

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
    <Avatar className="size-10 shrink-0 bg-muted">
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

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPost = body.trim().length > 0 && !submitting;

  async function handlePost() {
    if (!canPost) return;
    setSubmitting(true);
    setError(null);
    try {
      await createPost({ subject: subject.trim(), body: body.trim(), likes: 0 });
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

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col border-x">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/80 px-6 py-4 backdrop-blur">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessagesSquare className="size-4" />
          </div>
          <div>
            <h1 className="text-base leading-tight font-semibold">Cypresshall</h1>
            <p className="text-xs text-muted-foreground">Anonymous · NJIT only</p>
          </div>
        </header>

        <div className="border-b p-6">
          <div className="flex gap-4">
            <AnonAvatar />

            <div className="flex w-full flex-col gap-3">
              <div>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="resize-none border-0 bg-transparent p-3 text-2xl! font-bold shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What's happening?"
                  className="resize-none border-0 bg-transparent p-3 text-lg! shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <GraduationCap className="size-3.5" />
                  Only NJIT students can see this
                </div>

                <div className="flex items-center gap-3">
                  {error && <span className="text-xs text-destructive">{error}</span>}
                  <Button
                    className="rounded-full px-5"
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
          <div className="flex flex-col items-center gap-2 px-6 py-24 text-center text-muted-foreground">
            <Ghost className="size-8" />
            <p className="font-medium text-foreground">No posts yet</p>
            <p className="text-sm">Be the first to share something anonymously.</p>
          </div>
        ) : (
          <div className="divide-y">
            {posts.map((post) => (
              <article key={post._id} className="flex gap-4 px-6 py-5">
                <AnonAvatar />

                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="font-medium">Anonymous</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">
                      {timeAgo(post._creationTime)}
                    </span>
                  </div>

                  <h2 className="font-semibold">{post.subject}</h2>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                    {post.body}
                  </p> 

                  <div className="flex gap-1 items-center text-sm text-muted-foreground focus-visible:ring-0">
                    <Button
                      variant="ghost"
                      onClick={() => handleToggleLikePost(post._id)}
                      className="focus-visible:ring-0 border-0 outline-0 hover:bg-transparent"
                    >
                      <Heart
                        className={
                          post.likedByMe
                            ? "size-4 fill-red-500 text-red-500"
                            : "size-4"
                        }
                      />
                      {post.likes}
                    </Button>
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
