import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Outreach tracker entries — one per logged outreach, scoped to the user.
    outreachEntries: defineTable({
      ownerId: v.id("users"), // user who logged the entry
      projectName: v.string(),
      contact: v.optional(v.string()),
      dateContacted: v.string(), // yyyy-mm-dd
      status: v.string(), // No response | Replied | In talks | Deal closed | Rejected
      reason: v.string(), // default reason or saved custom reason text
      outreachLocation: v.optional(v.string()), // normalized to https://…
      notes: v.optional(v.string()),
      createdAt: v.number(), // server-side sort key (newest first)
    })
      .index("by_owner_created", ["ownerId", "createdAt"])
      .index("by_owner", ["ownerId"]),

    // Custom outreach reasons the user has typed (deduped), offered as
    // dropdown options in future entries.
    outreachReasons: defineTable({
      ownerId: v.id("users"),
      reason: v.string(),
      createdAt: v.number(),
    }).index("by_owner", ["ownerId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
