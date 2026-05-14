import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  decimal,
  boolean,
  index
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with PeerLink-specific fields.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User profiles with PeerLink-specific information
 */
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  bio: text("bio"),
  school: varchar("school", { length: 255 }),
  grade: varchar("grade", { length: 50 }),
  profileComplete: boolean("profileComplete").default(false).notNull(),
  creditBalance: decimal("creditBalance", { precision: 10, scale: 2 }).default("1.00").notNull(),
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }).default("0.00").notNull(),
  totalSessions: int("totalSessions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("user_id_idx").on(table.userId),
}));

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

/**
 * Skills offered by users
 */
export const skills = mysqlTable("skills", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdIdx: index("skill_user_id_idx").on(table.userId),
}));

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = typeof skills.$inferInsert;

/**
 * Skills wanted by users (for search/matching)
 */
export const skillsWanted = mysqlTable("skills_wanted", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("wanted_user_id_idx").on(table.userId),
}));

export type SkillWanted = typeof skillsWanted.$inferSelect;
export type InsertSkillWanted = typeof skillsWanted.$inferInsert;

/**
 * Session requests between users
 */
export const sessionRequests = mysqlTable("session_requests", {
  id: int("id").autoincrement().primaryKey(),
  requesterId: int("requesterId").notNull(),
  providerId: int("providerId").notNull(),
  skillId: int("skillId").notNull(),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  hoursRequested: decimal("hoursRequested", { precision: 5, scale: 2 }).default("1.00").notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "declined", "completed", "cancelled"]).default("pending").notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  respondedAt: timestamp("respondedAt"),
  completedAt: timestamp("completedAt"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  requesterIdIdx: index("request_requester_id_idx").on(table.requesterId),
  providerIdIdx: index("request_provider_id_idx").on(table.providerId),
  statusIdx: index("request_status_idx").on(table.status),
}));

export type SessionRequest = typeof sessionRequests.$inferSelect;
export type InsertSessionRequest = typeof sessionRequests.$inferInsert;

/**
 * Active sessions with scheduling information
 */
export const sessions = mysqlTable("sessions", {
  id: int("id").autoincrement().primaryKey(),
  requestId: int("requestId").notNull().unique(),
  requesterId: int("requesterId").notNull(),
  providerId: int("providerId").notNull(),
  skillName: varchar("skillName", { length: 255 }).notNull(),
  hoursScheduled: decimal("hoursScheduled", { precision: 5, scale: 2 }).default("1.00").notNull(),
  scheduledDate: timestamp("scheduledDate"),
  completedAt: timestamp("completedAt"),
  creditsTransferred: boolean("creditsTransferred").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  requestIdIdx: index("session_request_id_idx").on(table.requestId),
  requesterIdIdx: index("session_requester_id_idx").on(table.requesterId),
  providerIdIdx: index("session_provider_id_idx").on(table.providerId),
}));

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;

/**
 * Reviews and ratings for completed sessions
 */
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: int("sessionId").notNull(),
  reviewerId: int("reviewerId").notNull(),
  revieweeId: int("revieweeId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  reviewText: text("reviewText"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("review_session_id_idx").on(table.sessionId),
  reviewerIdIdx: index("review_reviewer_id_idx").on(table.reviewerId),
  revieweeIdIdx: index("review_reviewee_id_idx").on(table.revieweeId),
}));

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * Credit transaction log for audit trail
 */
export const creditTransactions = mysqlTable("credit_transactions", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("fromUserId").notNull(),
  toUserId: int("toUserId").notNull(),
  sessionId: int("sessionId"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  transactionType: mysqlEnum("transactionType", ["session_completion", "admin_adjustment", "initial_grant"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  fromUserIdIdx: index("tx_from_user_id_idx").on(table.fromUserId),
  toUserIdIdx: index("tx_to_user_id_idx").on(table.toUserId),
  sessionIdIdx: index("tx_session_id_idx").on(table.sessionId),
}));

export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
