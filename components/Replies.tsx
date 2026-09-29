"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Loader2, Trash2 } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { MAX_REPLY_LENGTH } from "@/convex/limits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AnonymousToggle,
  AuthorLine,
  AvatarSkeleton,
  CharCounter,
  UserAvatar,
  errorMessage,
  type Author,
} from "@/components/post-ui";

function ReplyComposer({
  postId,
  viewer,
}: {
  postId: Id<"posts">;
  viewer: Author | null | undefined;
}) {
  const createReply = useMutation(api.replies.createReply);
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canReply = body.trim().length > 0 && !submitting;

  async function handleReply() {
    if (!canReply) return;
    setSubmitting(true);
    setError(null);
    try {
      await createReply({ postId, body, anonymous });
      setBody("");
    } catch (err) {
      setError(errorMessage(err, "Couldn't send that reply. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex gap-3">
      {!anonymous && viewer === undefined ? (
        <AvatarSkeleton size="sm" />
      ) : (
        <UserAvatar author={anonymous ? null : (viewer ?? null)} size="sm" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void handleReply();
            }
          }}
          maxLength={MAX_REPLY_LENGTH}
          placeholder={anonymous ? "Reply anonymously…" : "Write a reply…"}
          aria-label="Reply"
          className="max-h-48 min-h-10 resize-none overflow-y-auto rounded-xl wrap-anywhere"
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <AnonymousToggle
            checked={anonymous}
            onCheckedChange={setAnonymous}
            label="Reply anonymously"
          />
          <div className="flex items-center gap-2">
            {body.length > 0 && <CharCounter count={body.length} max={MAX_REPLY_LENGTH} />}
            <Button
              size="sm"
              className="rounded-full px-4 transition-transform active:scale-95"
              disabled={!canReply}
              onClick={handleReply}
              title="Reply (⌘/Ctrl + Enter)"
            >
              {submitting && <Loader2 className="size-3.5 animate-spin" />}
              Reply
            </Button>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function RepliesSkeleton() {
  return (
    <div className="flex animate-pulse gap-3">
      <div className="size-8 shrink-0 rounded-full bg-muted" />
      <div className="flex w-full flex-col gap-2 pt-1">
        <div className="h-3 w-28 rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
  );
}

export function Replies({
  postId,
  viewer,
  now,
}: {
  postId: Id<"posts">;
  viewer: Author | null | undefined;
  now: number;
}) {
  const replies = useQuery(api.replies.getReplies, { postId });
  const deleteReply = useMutation(api.replies.deleteReply);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(replyId: Id<"replies">) {
    if (!window.confirm("Delete this reply? This can't be undone.")) return;
    setError(null);
    try {
      await deleteReply({ replyId });
    } catch (err) {
      setError(errorMessage(err, "Couldn't delete that reply. Try again."));
    }
  }

  return (
    <div className="mt-3 flex animate-in flex-col gap-4 border-t pt-4 fade-in duration-200">
      {replies === undefined ? (
        <RepliesSkeleton />
      ) : replies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No replies yet — start the conversation.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {replies.map((reply) => (
            <li
              key={reply._id}
              className="flex animate-in gap-3 fade-in slide-in-from-top-1 duration-300"
            >
              <UserAvatar author={reply.author} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <AuthorLine
                  author={reply.author}
                  anonymous={reply.anonymous}
                  isMine={reply.isMine}
                  creationTime={reply._creationTime}
                  now={now}
                />
                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-foreground/90">
                  {reply.body}
                </p>
              </div>
              {reply.isMine && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label="Delete reply"
                  className="shrink-0 rounded-full text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleDelete(reply._id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <ReplyComposer postId={postId} viewer={viewer} />
    </div>
  );
}
