import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const createPost = mutation({
    args: {
        subject: v.string(),
        body: v.string(),
        likes: v.number(),
    },
    handler: async (ctx, { subject, body, likes }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        await ctx.db.insert("posts", {
            userId,
            subject,
            body,
            likes: 0
        })
    }
});

export const getPosts = query({
    handler: async (ctx) => {
        const posts = await ctx.db
            .query("posts")
            .order("desc")
            .collect();

        const userId = await getAuthUserId(ctx);
        if (!userId) {
            return posts.map((post) => ({ ...post, likedByMe: false }));
        }

        const myLikes = await ctx.db
            .query("likes")
            .withIndex("by_user_post", (q) => q.eq("userId", userId))
            .collect();
        const likedPostIds = new Set(myLikes.map((like) => like.postId));

        return posts.map((post) => ({
            ...post,
            likedByMe: likedPostIds.has(post._id),
        }));
    }
})

export const toggleLikePost = mutation({
    args: { postId: v.id("posts") },
    handler: async (ctx, { postId }) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("User not authenticated");

        const like = await ctx.db.query("likes").withIndex("by_user_post", (q) =>
            q.eq("userId", userId).eq("postId", postId)
        ).collect();

        if (like.length > 0) {
            await ctx.db.delete(like[0]._id);
            await ctx.db.patch(postId, { likes: (await ctx.db.get(postId))!.likes - 1 });
        } else {
            await ctx.db.insert("likes", { userId, postId });
            await ctx.db.patch(postId, { likes: (await ctx.db.get(postId))!.likes + 1 });
        }
    }
})