CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int,
	`user1Id` int NOT NULL,
	`user2Id` int NOT NULL,
	`lastMessageAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `conv_session_id_idx` ON `conversations` (`sessionId`);--> statement-breakpoint
CREATE INDEX `conv_user1_id_idx` ON `conversations` (`user1Id`);--> statement-breakpoint
CREATE INDEX `conv_user2_id_idx` ON `conversations` (`user2Id`);--> statement-breakpoint
CREATE INDEX `msg_conversation_id_idx` ON `messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `msg_sender_id_idx` ON `messages` (`senderId`);--> statement-breakpoint
CREATE INDEX `msg_is_read_idx` ON `messages` (`isRead`);