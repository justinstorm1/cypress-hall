import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    ...authTables,
    posts: defineTable({
        userId: v.id("users"),
        email: v.string(),
        subject: v.string(),
        body: v.string(),
        likes: v.number(),
    }),
    likes: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
    })
    .index("by_user_post", ["userId", "postId"])
    .index("by_post", ["postId"]),
    replies: defineTable({
        userId: v.id("users"),
        postId: v.id("posts"),
        body: v.string(),
    })
});