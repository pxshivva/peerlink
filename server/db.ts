import { eq, and, or, desc, asc, inArray, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users,
  userProfiles,
  skills,
  skillsWanted,
  sessionRequests,
  sessions,
  reviews,
  creditTransactions,
  conversations,
  messages,
  type UserProfile,
  type Skill,
  type SkillWanted,
  type SessionRequest,
  type Session,
  type Review,
  type CreditTransaction,
  type Conversation,
  type Message,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// User Profile helpers
export async function getOrCreateUserProfile(userId: number): Promise<UserProfile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(userProfiles).values({
    userId,
    creditBalance: "1.00",
    profileComplete: false,
  });

  const created = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return created[0];
}

export async function updateUserProfile(userId: number, data: Partial<UserProfile>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(userProfiles).set(data).where(eq(userProfiles.userId, userId));
  
  const updated = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return updated[0];
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Skills helpers
export async function addSkill(userId: number, skillName: string, description?: string, category?: string): Promise<Skill> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(skills).values({
    userId,
    skillName,
    description,
    category,
  });

  const result = await db.select().from(skills).where(eq(skills.userId, userId)).orderBy(desc(skills.createdAt)).limit(1);
  return result[0];
}

export async function getUserSkills(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(skills).where(and(eq(skills.userId, userId), eq(skills.isActive, true)));
}

export async function getAllActiveSkills() {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(skills).where(eq(skills.isActive, true));
}

export async function getSkillById(skillId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(skills).where(eq(skills.id, skillId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Skills wanted helpers
export async function addSkillWanted(userId: number, skillName: string, category?: string): Promise<SkillWanted> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(skillsWanted).values({
    userId,
    skillName,
    category,
  });

  const result = await db.select().from(skillsWanted).where(eq(skillsWanted.userId, userId)).orderBy(desc(skillsWanted.createdAt)).limit(1);
  return result[0];
}

export async function getUserSkillsWanted(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(skillsWanted).where(eq(skillsWanted.userId, userId));
}

// Session request helpers
export async function createSessionRequest(
  requesterId: number,
  providerId: number,
  skillId: number,
  skillName: string,
  hoursRequested: string = "1.00"
): Promise<SessionRequest> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(sessionRequests).values({
    requesterId,
    providerId,
    skillId,
    skillName,
    hoursRequested: hoursRequested as any,
  });

  const result = await db.select().from(sessionRequests).orderBy(desc(sessionRequests.requestedAt)).limit(1);
  return result[0];
}

export async function getSessionRequest(requestId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sessionRequests).where(eq(sessionRequests.id, requestId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getIncomingRequests(providerId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sessionRequests)
    .where(eq(sessionRequests.providerId, providerId))
    .orderBy(desc(sessionRequests.requestedAt));
}

export async function getOutgoingRequests(requesterId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(sessionRequests)
    .where(eq(sessionRequests.requesterId, requesterId))
    .orderBy(desc(sessionRequests.requestedAt));
}

export async function updateSessionRequestStatus(requestId: number, status: string, respondedAt: Date = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sessionRequests)
    .set({ status: status as any, respondedAt })
    .where(eq(sessionRequests.id, requestId));

  const updated = await db.select().from(sessionRequests).where(eq(sessionRequests.id, requestId)).limit(1);
  return updated[0];
}

// Session helpers
export async function createSession(
  requestId: number,
  requesterId: number,
  providerId: number,
  skillName: string,
  hoursScheduled: string = "1.00"
): Promise<Session> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(sessions).values({
    requestId,
    requesterId,
    providerId,
    skillName,
    hoursScheduled: hoursScheduled as any,
  });

  const result = await db.select().from(sessions).where(eq(sessions.requestId, requestId)).limit(1);
  return result[0];
}

export async function getSession(sessionId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getSessionByRequestId(requestId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(sessions).where(eq(sessions.requestId, requestId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserActiveSessions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  // Get sessions where user is either requester or provider and credits haven't been transferred
  const userSessions = await db.select().from(sessions)
    .where(eq(sessions.creditsTransferred, false))
    .orderBy(desc(sessions.createdAt));
  
  return userSessions.filter(s => s.requesterId === userId || s.providerId === userId);
}

export async function completeSession(sessionId: number, completedAt: Date = new Date()) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(sessions)
    .set({ completedAt, creditsTransferred: true })
    .where(eq(sessions.id, sessionId));

  const updated = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
  return updated[0];
}

// Review helpers
export async function createReview(
  sessionId: number,
  reviewerId: number,
  revieweeId: number,
  rating: number,
  reviewText?: string
): Promise<Review> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(reviews).values({
    sessionId,
    reviewerId,
    revieweeId,
    rating,
    reviewText,
  });

  const result = await db.select().from(reviews).orderBy(desc(reviews.createdAt)).limit(1);
  return result[0];
}

export async function getUserReviews(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews).where(eq(reviews.revieweeId, userId));
}

export async function getSessionReviews(sessionId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(reviews).where(eq(reviews.sessionId, sessionId));
}

// Credit transaction helpers
export async function transferCredits(
  fromUserId: number,
  toUserId: number,
  amount: string,
  sessionId?: number,
  description?: string
): Promise<CreditTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create transaction record
  await db.insert(creditTransactions).values({
    fromUserId,
    toUserId,
    sessionId,
    amount: amount as any,
    transactionType: "session_completion",
    description,
  });

  // Update credit balances
  const fromProfile = await getUserProfile(fromUserId);
  const toProfile = await getUserProfile(toUserId);

  if (fromProfile && toProfile) {
    const fromBalance = parseFloat(fromProfile.creditBalance.toString()) - parseFloat(amount);
    const toBalance = parseFloat(toProfile.creditBalance.toString()) + parseFloat(amount);

    await updateUserProfile(fromUserId, { creditBalance: fromBalance.toString() as any });
    await updateUserProfile(toUserId, { creditBalance: toBalance.toString() as any });
  }

  const result = await db.select().from(creditTransactions).orderBy(desc(creditTransactions.createdAt)).limit(1);
  return result[0];
}

export async function adjustCredits(
  userId: number,
  amount: string,
  description?: string
): Promise<CreditTransaction> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Create transaction record
  await db.insert(creditTransactions).values({
    fromUserId: 0, // System adjustment
    toUserId: userId,
    amount: amount as any,
    transactionType: "admin_adjustment",
    description,
  });

  // Update credit balance
  const profile = await getUserProfile(userId);
  if (profile) {
    const newBalance = parseFloat(profile.creditBalance.toString()) + parseFloat(amount);
    await updateUserProfile(userId, { creditBalance: newBalance.toString() as any });
  }

  const result = await db.select().from(creditTransactions).orderBy(desc(creditTransactions.createdAt)).limit(1);
  return result[0];
}

export async function getUserTransactions(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(creditTransactions)
    .where(inArray(creditTransactions.toUserId, [userId]))
    .orderBy(desc(creditTransactions.createdAt));
}

// ========== MESSAGING QUERIES ==========

export async function getOrCreateConversation(
  user1Id: number,
  user2Id: number,
  sessionId?: number
): Promise<Conversation> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Normalize user IDs to ensure consistent conversation lookup
  const [minId, maxId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  // Try to find existing conversation
  const existing = await db
    .select()
    .from(conversations)
    .where(
      and(
        or(
          and(eq(conversations.user1Id, minId), eq(conversations.user2Id, maxId)),
          and(eq(conversations.user1Id, maxId), eq(conversations.user2Id, minId))
        )
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new conversation
  const result = await db.insert(conversations).values({
    user1Id: minId,
    user2Id: maxId,
    sessionId,
  });

  return {
    id: result[0].insertId as number,
    user1Id: minId,
    user2Id: maxId,
    sessionId: sessionId || null,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function getUserConversations(userId: number): Promise<
  (Conversation & { otherUserId: number; lastMessage?: string })[]
> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const convs = await db
    .select()
    .from(conversations)
    .where(
      or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      )
    )
    .orderBy(desc(conversations.lastMessageAt));

  // Get last message for each conversation
  const result = await Promise.all(
    convs.map(async (conv) => {
      const lastMsg = await db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, conv.id))
        .orderBy(desc(messages.createdAt))
        .limit(1);

      const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;

      return {
        ...conv,
        otherUserId,
        lastMessage: lastMsg[0]?.content,
      };
    })
  );

  return result;
}

export async function getConversationMessages(
  conversationId: number,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(desc(messages.createdAt))
    .limit(limit)
    .offset(offset);

  return result.reverse(); // Return in ascending order (oldest first)
}

export async function createMessage(
  conversationId: number,
  senderId: number,
  content: string
): Promise<Message> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(messages).values({
    conversationId,
    senderId,
    content,
  });

  // Update conversation's lastMessageAt
  await db
    .update(conversations)
    .set({ lastMessageAt: new Date() })
    .where(eq(conversations.id, conversationId));

  return {
    id: result[0].insertId as number,
    conversationId,
    senderId,
    content,
    isRead: false,
    readAt: null,
    createdAt: new Date(),
  };
}

export async function markMessagesAsRead(
  conversationId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(messages)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        eq(messages.isRead, false)
      )
    );
}

export async function getUnreadMessageCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all conversations for this user
  const userConvs = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      )
    );

  if (userConvs.length === 0) return 0;

  const convIds = userConvs.map((c) => c.id);

  // Count unread messages from other users
  const result = await db
    .select()
    .from(messages)
    .where(
      and(
        inArray(messages.conversationId, convIds),
        eq(messages.isRead, false)
      )
    );

  return result.length;
}
