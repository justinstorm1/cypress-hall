import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { createAuthorLoader } from "./authors";
import { MAX_REPLY_LENGTH } from "./limits";

const THREAD_SIZE = 100;

export const getReplies = query({
    args: { postId: v.id("posts") },
    handler: async (ctx, { postId }) => {
        const viewerId = await getAuthUserId(ctx);
        if (!viewerId) return [];

        // Take the newest replies so fresh ones always show, then display oldest-first.
        const newestFirst = await ctx.db
            .query("replies")
            .withIndex("by_postId", (q) => q.eq("postId", postId))
            .order("desc")
            .take(THREAD_SIZE);
        const loadAuthor = createAuthorLoader(ctx);

        return await Promise.all(
            newestFirst.reverse().map(async (reply) => ({
                _id: reply._id,
                _creationTime: reply._creationTime,
                body: reply.body,
                anonymous: reply.anonymous,
                author: await loadAuthor(reply),
                isMine: reply.userId === viewerId,
            })),
        );
    },
});

export const createReply = mutation({
    args: {
        postId: v.id("posts"),
        body: v.string(),
        anonymous: v.boolean(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("You need to be signed in to reply.");

        const user = await ctx.db.get("users", userId);
        if (!user?.email) throw new ConvexError("Your account has no email on file.");

        const post = await ctx.db.get("posts", args.postId);
        if (!post) throw new ConvexError("That post no longer exists.");

        const body = args.body.trim();
        if (!body) throw new ConvexError("Replies can't be empty.");
        if (body.length > MAX_REPLY_LENGTH) {
            throw new ConvexError(`Replies are limited to ${MAX_REPLY_LENGTH} characters.`);
        }

        await ctx.db.insert("replies", {
            userId,
            postId: args.postId,
            email: user.email,
            anonymous: args.anonymous,
            body,
        });
        await ctx.db.patch("posts", args.postId, { replyCount: post.replyCount + 1 });
        return null;
    },
});

export const deleteReply = mutation({
    args: { replyId: v.id("replies") },
    handler: async (ctx, { replyId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("You need to be signed in.");

        const reply = await ctx.db.get("replies", replyId);
        if (!reply) throw new ConvexError("That reply no longer exists.");
        if (reply.userId !== userId) throw new ConvexError("You can only delete your own replies.");

        await ctx.db.delete("replies", replyId);
        const post = await ctx.db.get("posts", reply.postId);
        if (post) {
            await ctx.db.patch("posts", reply.postId, {
                replyCount: Math.max(0, post.replyCount - 1),
            });
        }
        return null;
    },
});
