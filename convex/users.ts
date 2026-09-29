import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";

export const viewer = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const user = await ctx.db.get("users", userId);
        if (!user?.email) return null;

        const ucid = user.email.split("@")[0];
        return { name: user.name ?? ucid, ucid, image: user.image ?? null };
    },
});
