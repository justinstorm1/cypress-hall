import { QueryCtx } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

export type PublicAuthor = { name: string; ucid: string; image: string | null };

// Anonymous content resolves to null so no identifying field ever leaves the server.
export function createAuthorLoader(ctx: QueryCtx) {
    const users = new Map<Id<"users">, Promise<Doc<"users"> | null>>();

    return async (item: {
        userId: Id<"users">;
        email: string;
        anonymous: boolean;
    }): Promise<PublicAuthor | null> => {
        if (item.anonymous) return null;

        let user = users.get(item.userId);
        if (!user) {
            user = ctx.db.get("users", item.userId);
            users.set(item.userId, user);
        }
        const doc = await user;
        const ucid = item.email.split("@")[0];
        return { name: doc?.name ?? ucid, ucid, image: doc?.image ?? null };
    };
}
