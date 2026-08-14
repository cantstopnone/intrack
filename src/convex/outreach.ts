import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server";

type UserId = NonNullable<Awaited<ReturnType<typeof getAuthUserId>>>;

/** Shared argument shape for creating or updating an outreach entry. */
const entryArgs = {
  projectName: v.string(),
  contact: v.optional(v.string()),
  dateContacted: v.string(), // yyyy-mm-dd
  status: v.string(),
  reason: v.string(),
  outreachLocation: v.optional(v.string()),
  notes: v.optional(v.string()),
  // When true, `reason` is a freshly typed custom reason and should be
  // persisted so it shows up as a dropdown option next time.
  saveReason: v.optional(v.boolean()),
};

async function requireUser(ctx: QueryCtx): Promise<UserId> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError("Not signed in");
  }
  return userId;
}

/** Persist a custom reason (deduped) for future dropdown use. */
async function saveCustomReason(
  ctx: MutationCtx,
  ownerId: UserId,
  reason: string,
) {
  const existing = await ctx.db
    .query("outreachReasons")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .filter((q) => q.eq(q.field("reason"), reason))
    .first();

  if (existing === null) {
    await ctx.db.insert("outreachReasons", {
      ownerId,
      reason,
      createdAt: Date.now(),
    });
  }
}

/** All entries for the signed-in user, newest first. */
export const listEntries = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    return await ctx.db
      .query("outreachEntries")
      .withIndex("by_owner_created", (q) => q.eq("ownerId", userId))
      .order("desc")
      .collect();
  },
});

/** Custom reasons saved by the signed-in user. */
export const listReasons = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUser(ctx);
    const reasons = await ctx.db
      .query("outreachReasons")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("asc")
      .collect();
    return reasons.map((r) => r.reason);
  },
});

export const addEntry = mutation({
  args: entryArgs,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    if (args.projectName.trim() === "") {
      throw new ConvexError("Project name is required");
    }

    if (args.saveReason) {
      await saveCustomReason(ctx, userId, args.reason);
    }

    return await ctx.db.insert("outreachEntries", {
      ownerId: userId,
      projectName: args.projectName.trim(),
      contact: args.contact?.trim() || undefined,
      dateContacted: args.dateContacted,
      status: args.status,
      reason: args.reason,
      outreachLocation: args.outreachLocation?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
      createdAt: Date.now(),
    });
  },
});

export const updateEntry = mutation({
  args: { id: v.id("outreachEntries"), ...entryArgs },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (existing === null || existing.ownerId !== userId) {
      throw new ConvexError("Entry not found");
    }
    if (args.projectName.trim() === "") {
      throw new ConvexError("Project name is required");
    }

    if (args.saveReason) {
      await saveCustomReason(ctx, userId, args.reason);
    }

    await ctx.db.patch(args.id, {
      projectName: args.projectName.trim(),
      contact: args.contact?.trim() || undefined,
      dateContacted: args.dateContacted,
      status: args.status,
      reason: args.reason,
      outreachLocation: args.outreachLocation?.trim() || undefined,
      notes: args.notes?.trim() || undefined,
    });
  },
});

export const deleteEntry = mutation({
  args: { id: v.id("outreachEntries") },
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);
    const existing = await ctx.db.get(args.id);
    if (existing === null || existing.ownerId !== userId) {
      throw new ConvexError("Entry not found");
    }
    await ctx.db.delete(args.id);
  },
});
