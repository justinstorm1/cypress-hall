import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    ...authTables,
    posts: defineTable({
        userId: v.id("users"),
        email: v.string(),
        anonymous: v.boolean(),
        subject: v.string(),
        body: v.string(),
        likes: v.number(),
        replyCount: v.number(),
    }),
    likes: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
    })
    .index("by_userId_and_postId", ["userId", "postId"])
    .index("by_postId", ["postId"]),
    replies: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
        email: v.string(),
        anonymous: v.boolean(),
        body: v.string(),
    })
    .index("by_postId", ["postId"]),
});