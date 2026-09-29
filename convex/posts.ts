import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createAuthorLoader } from "./authors";
import { MAX_BODY_LENGTH, MAX_SUBJECT_LENGTH } from "./limits";

const FEED_SIZE = 100;

export const createPost = mutation({
    args: {
        subject: v.string(),
        body: v.string(),
        anonymous: v.boolean(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("You need to be signed in to post.");

        const user = await ctx.db.get("users", userId);
        if (!user?.email) throw new ConvexError("Your account has no email on file.");

        const subject = args.subject.trim();
        const body = args.body.trim();
        if (!body) throw new ConvexError("Posts can't be empty.");
        if (subject.length > MAX_SUBJECT_LENGTH) {
            throw new ConvexError(`Titles are limited to ${MAX_SUBJECT_LENGTH} characters.`);
        }
        if (body.length > MAX_BODY_LENGTH) {
            throw new ConvexError(`Posts are limited to ${MAX_BODY_LENGTH} characters.`);
        }

        await ctx.db.insert("posts", {
            userId,
            email: user.email,
            anonymous: args.anonymous,
            subject,
            body,
            likes: 0,
            replyCount: 0,
        });
        return null;
    },
});

async function isLikedBy(ctx: QueryCtx, userId: Id<"users">, postId: Id<"posts">) {
    const like = await ctx.db
        .query("likes")
        .withIndex("by_userId_and_postId", (q) => q.eq("userId", userId).eq("postId", postId))
        .unique();
    return like !== null;
}

export const getPosts = query({
    args: {},
    handler: async (ctx) => {
        const viewerId = await getAuthUserId(ctx);
        if (!viewerId) return [];

        const posts = await ctx.db.query("posts").order("desc").take(FEED_SIZE);
        const loadAuthor = createAuthorLoader(ctx);

        return await Promise.all(
            posts.map(async (post) => ({
                _id: post._id,
                _creationTime: post._creationTime,
                subject: post.subject,
                body: post.body,
                likes: post.likes,
                replyCount: post.replyCount,
                anonymous: post.anonymous,
                author: await loadAuthor(post),
                isMine: post.userId === viewerId,
                likedByMe: await isLikedBy(ctx, viewerId, post._id),
            })),
        );
    },
});

export const deletePost = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, { postId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("You need to be signed in.");

        const post = await ctx.db.get("posts", postId);
        if (!post) throw new ConvexError("That post no longer exists.");
        if (post.userId !== userId) throw new ConvexError("You can only delete your own posts.");

        for await (const like of ctx.db
            .query("likes")
            .withIndex("by_postId", (q) => q.eq("postId", postId))) {
            await ctx.db.delete("likes", like._id);
        }
        for await (const reply of ctx.db
            .query("replies")
            .withIndex("by_postId", (q) => q.eq("postId", postId))) {
            await ctx.db.delete("replies", reply._id);
        }
        await ctx.db.delete("posts", postId);
        return null;
    },
});

export const toggleLikePost = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, { postId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new ConvexError("You need to be signed in.");

        const post = await ctx.db.get("posts", postId);
        if (!post) throw new ConvexError("That post no longer exists.");

        const existing = await ctx.db
            .query("likes")
            .withIndex("by_userId_and_postId", (q) => q.eq("userId", userId).eq("postId", postId))
            .unique();

        if (existing) {
            await ctx.db.delete("likes", existing._id);
            await ctx.db.patch("posts", postId, { likes: Math.max(0, post.likes - 1) });
        } else {
            await ctx.db.insert("likes", { userId, postId });
            await ctx.db.patch("posts", postId, { likes: post.likes + 1 });
        }
        return null;
    },
});
