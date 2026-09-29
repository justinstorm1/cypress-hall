"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Heart, MessageCircle, Trash2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AuthorLine, UserAvatar, errorMessage, type Author } from "@/components/post-ui";
import { Replies } from "@/components/Replies";

export type Post = FunctionReturnType<typeof api.posts.getPosts>[number];

export function PostCard({
  post,
  viewer,
  now,
  onError,
}: {
  post: Post;
  viewer: Author | null | undefined;
  now: number;
  onError: (message: string | null) => void;
}) {
  const toggleLikePost = useMutation(api.posts.toggleLikePost);
  const deletePost = useMutation(api.posts.deletePost);
  const [repliesOpen, setRepliesOpen] = useState(false);

  async function handleToggleLike() {
    onError(null);
    try {
      await toggleLikePost({ postId: post._id });
    } catch (err) {
      onError(errorMessage(err, "Couldn't update that like. Try again."));
    }
  }

  async function handleDelete() {
    const prompt =
      post.replyCount > 0
        ? "Delete this post and its replies? This can't be undone."
        : "Delete this post? This can't be undone.";
    if (!window.confirm(prompt)) return;
    onError(null);
    try {
      await deletePost({ postId: post._id });
    } catch (err) {
      onError(errorMessage(err, "Couldn't delete that post. Try again."));
    }
  }

  return (
    <article
      className={cn(
        "flex animate-in gap-4 px-6 py-5 fade-in slide-in-from-top-2 duration-300 transition-colors",
        !repliesOpen && "hover:bg-muted/30"
      )}
    >
      <UserAvatar author={post.author} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <AuthorLine
          author={post.author}
          anonymous={post.anonymous}
          isMine={post.isMine}
          creationTime={post._creationTime}
          now={now}
        />

        {post.subject && (
          <h2 className="text-[17px] leading-snug font-semibold tracking-tight wrap-anywhere">
            {post.subject}
          </h2>
        )}
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap wrap-anywhere text-foreground/90">
          {post.body}
        </p>

        <div className="mt-1 -ml-2 flex items-center">
          <Button
            size="icon"
            variant="ghost"
            aria-label={post.likedByMe ? "Unlike" : "Like"}
            aria-pressed={post.likedByMe}
            className={cn(
              "size-8 rounded-full transition-colors hover:bg-red-500/10 hover:text-red-500 active:scale-90",
              post.likedByMe ? "text-red-500" : "text-muted-foreground"
            )}
            onClick={handleToggleLike}
          >
            <Heart className={cn("size-4", post.likedByMe && "fill-current")} />
          </Button>
          <span
            className={cn(
              "min-w-4 text-sm tabular-nums",
              post.likedByMe ? "text-red-500" : "text-muted-foreground"
            )}
          >
            {post.likes}
          </span>

          <Button
            size="icon"
            variant="ghost"
            aria-label={repliesOpen ? "Hide replies" : "Show replies"}
            aria-expanded={repliesOpen}
            className={cn(
              "ml-4 size-8 rounded-full transition-colors hover:bg-primary/10 hover:text-primary active:scale-90",
              repliesOpen ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setRepliesOpen((open) => !open)}
          >
            <MessageCircle className={cn("size-4", repliesOpen && "fill-current/15")} />
          </Button>
          <span
            className={cn(
              "text-sm tabular-nums",
              repliesOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            {post.replyCount}
          </span>

          {post.isMine && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete post"
              className="ml-auto size-8 rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          )}
        </div>

        {repliesOpen && <Replies postId={post._id} viewer={viewer} now={now} />}
      </div>
    </article>
  );
}
