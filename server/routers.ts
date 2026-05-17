import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Profile procedures
  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const profile = await db.getUserProfile(ctx.user.id);
      return profile;
    }),

    setup: protectedProcedure
      .input(z.object({
        bio: z.string().optional(),
        school: z.string(),
        grade: z.string(),
        skillsOffered: z.array(z.string()),
        skillsWanted: z.array(z.string()),
      }))
      .mutation(async ({ ctx, input }) => {
        // Update user profile
        const profile = await db.updateUserProfile(ctx.user.id, {
          bio: input.bio,
          school: input.school,
          grade: input.grade,
          profileComplete: true,
        });

        // Add skills offered
        for (const skill of input.skillsOffered) {
          await db.addSkill(ctx.user.id, skill);
        }

        // Add skills wanted
        for (const skill of input.skillsWanted) {
          await db.addSkillWanted(ctx.user.id, skill);
        }

        return profile;
      }),

    update: protectedProcedure
      .input(z.object({
        bio: z.string().optional(),
        school: z.string().optional(),
        grade: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.updateUserProfile(ctx.user.id, input);
      }),

    getPublic: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        const profile = await db.getUserProfile(input.userId);
        if (!profile) throw new TRPCError({ code: "NOT_FOUND" });
        return profile;
      }),
  }),

  // Skills procedures
  skills: router({
    list: publicProcedure
      .input(z.object({ userId: z.number().optional() }).optional())
      .query(async ({ input }) => {
        if (input?.userId) {
          return db.getUserSkills(input.userId);
        }
        return db.getAllActiveSkills();
      }),

    add: protectedProcedure
      .input(z.object({
        skillName: z.string(),
        description: z.string().optional(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addSkill(ctx.user.id, input.skillName, input.description, input.category);
      }),

    getById: publicProcedure
      .input(z.object({ skillId: z.number() }))
      .query(async ({ input }) => {
        return db.getSkillById(input.skillId);
      }),
  }),

  // Skills wanted procedures
  skillsWanted: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserSkillsWanted(ctx.user.id);
    }),

    add: protectedProcedure
      .input(z.object({
        skillName: z.string(),
        category: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.addSkillWanted(ctx.user.id, input.skillName, input.category);
      }),
  }),

  // Session request procedures
  requests: router({
    create: protectedProcedure
      .input(z.object({
        providerId: z.number(),
        skillId: z.number(),
        skillName: z.string(),
        hoursRequested: z.string().default("1.00"),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.providerId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot request from yourself" });
        }
        return db.createSessionRequest(
          ctx.user.id,
          input.providerId,
          input.skillId,
          input.skillName,
          input.hoursRequested
        );
      }),

    incoming: protectedProcedure.query(async ({ ctx }) => {
      return db.getIncomingRequests(ctx.user.id);
    }),

    outgoing: protectedProcedure.query(async ({ ctx }) => {
      return db.getOutgoingRequests(ctx.user.id);
    }),

    accept: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const request = await db.getSessionRequest(input.requestId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        if (request.providerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        const updated = await db.updateSessionRequestStatus(input.requestId, "accepted");
        
        // Create session
        await db.createSession(
          input.requestId,
          request.requesterId,
          request.providerId,
          request.skillName,
          request.hoursRequested.toString()
        );

        return updated;
      }),

    decline: protectedProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const request = await db.getSessionRequest(input.requestId);
        if (!request) throw new TRPCError({ code: "NOT_FOUND" });
        if (request.providerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return db.updateSessionRequestStatus(input.requestId, "declined");
      }),

    getById: publicProcedure
      .input(z.object({ requestId: z.number() }))
      .query(async ({ input }) => {
        return db.getSessionRequest(input.requestId);
      }),
  }),

  // Session procedures
  sessions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserActiveSessions(ctx.user.id);
    }),

    complete: protectedProcedure
      .input(z.object({ sessionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSession(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (session.requesterId !== ctx.user.id && session.providerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Transfer credits
        const hoursScheduled = parseFloat(session.hoursScheduled.toString());
        await db.transferCredits(
          session.requesterId,
          session.providerId,
          hoursScheduled.toString(),
          session.id,
          `Session completion: ${session.skillName}`
        );

        return db.completeSession(input.sessionId);
      }),

    getById: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return db.getSession(input.sessionId);
      }),
  }),

  // Review procedures
  reviews: router({
    create: protectedProcedure
      .input(z.object({
        sessionId: z.number(),
        revieweeId: z.number(),
        rating: z.number().min(1).max(5),
        reviewText: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const session = await db.getSession(input.sessionId);
        if (!session) throw new TRPCError({ code: "NOT_FOUND" });
        if (!session.completedAt) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Session not completed" });
        }

        // Create review
        const review = await db.createReview(
          input.sessionId,
          ctx.user.id,
          input.revieweeId,
          input.rating,
          input.reviewText
        );

        // Update reviewee's average rating
        const reviews = await db.getUserReviews(input.revieweeId);
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await db.updateUserProfile(input.revieweeId, {
          averageRating: avgRating.toString() as any,
        });

        return review;
      }),

    getForUser: publicProcedure
      .input(z.object({ userId: z.number() }))
      .query(async ({ input }) => {
        return db.getUserReviews(input.userId);
      }),

    getForSession: publicProcedure
      .input(z.object({ sessionId: z.number() }))
      .query(async ({ input }) => {
        return db.getSessionReviews(input.sessionId);
      }),
  }),

  // Messaging procedures
  messages: router({
    getConversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserConversations(ctx.user.id);
    }),

    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify user is part of this conversation
        const convs = await db.getUserConversations(ctx.user.id);
        const conv = convs.find(c => c.id === input.conversationId);
        if (!conv) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        // Mark messages as read
        await db.markMessagesAsRead(input.conversationId);

        return db.getConversationMessages(input.conversationId);
      }),

    send: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1).max(1000),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user is part of this conversation
        const convs = await db.getUserConversations(ctx.user.id);
        const conv = convs.find(c => c.id === input.conversationId);
        if (!conv) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }

        return db.createMessage(input.conversationId, ctx.user.id, input.content);
      }),

    startConversation: protectedProcedure
      .input(z.object({
        otherUserId: z.number(),
        sessionId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id === input.otherUserId) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot message yourself" });
        }

        return db.getOrCreateConversation(ctx.user.id, input.otherUserId, input.sessionId);
      }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadMessageCount(ctx.user.id);
    }),
  }),

  // Admin procedures
  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      // This would need a helper function to get all users
      return [];
    }),

    adjustCredits: protectedProcedure
      .input(z.object({
        userId: z.number(),
        amount: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.adjustCredits(input.userId, input.amount, input.description);
      }),
  }),
});

export type AppRouter = typeof appRouter;
