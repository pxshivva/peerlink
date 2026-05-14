CREATE TABLE `credit_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`fromUserId` int NOT NULL,
	`toUserId` int NOT NULL,
	`sessionId` int,
	`amount` decimal(10,2) NOT NULL,
	`transactionType` enum('session_completion','admin_adjustment','initial_grant') NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`revieweeId` int NOT NULL,
	`rating` int NOT NULL,
	`reviewText` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`providerId` int NOT NULL,
	`skillId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`hoursRequested` decimal(5,2) NOT NULL DEFAULT '1.00',
	`status` enum('pending','accepted','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
	`requestedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`completedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `session_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`requesterId` int NOT NULL,
	`providerId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`hoursScheduled` decimal(5,2) NOT NULL DEFAULT '1.00',
	`scheduledDate` timestamp,
	`completedAt` timestamp,
	`creditsTransferred` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_requestId_unique` UNIQUE(`requestId`)
);
--> statement-breakpoint
CREATE TABLE `skills` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skills_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skills_wanted` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillName` varchar(255) NOT NULL,
	`category` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `skills_wanted_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`school` varchar(255),
	`grade` varchar(50),
	`profileComplete` boolean NOT NULL DEFAULT false,
	`creditBalance` decimal(10,2) NOT NULL DEFAULT '1.00',
	`averageRating` decimal(3,2) NOT NULL DEFAULT '0.00',
	`totalSessions` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_profiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_profiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE INDEX `tx_from_user_id_idx` ON `credit_transactions` (`fromUserId`);--> statement-breakpoint
CREATE INDEX `tx_to_user_id_idx` ON `credit_transactions` (`toUserId`);--> statement-breakpoint
CREATE INDEX `tx_session_id_idx` ON `credit_transactions` (`sessionId`);--> statement-breakpoint
CREATE INDEX `review_session_id_idx` ON `reviews` (`sessionId`);--> statement-breakpoint
CREATE INDEX `review_reviewer_id_idx` ON `reviews` (`reviewerId`);--> statement-breakpoint
CREATE INDEX `review_reviewee_id_idx` ON `reviews` (`revieweeId`);--> statement-breakpoint
CREATE INDEX `request_requester_id_idx` ON `session_requests` (`requesterId`);--> statement-breakpoint
CREATE INDEX `request_provider_id_idx` ON `session_requests` (`providerId`);--> statement-breakpoint
CREATE INDEX `request_status_idx` ON `session_requests` (`status`);--> statement-breakpoint
CREATE INDEX `session_request_id_idx` ON `sessions` (`requestId`);--> statement-breakpoint
CREATE INDEX `session_requester_id_idx` ON `sessions` (`requesterId`);--> statement-breakpoint
CREATE INDEX `session_provider_id_idx` ON `sessions` (`providerId`);--> statement-breakpoint
CREATE INDEX `skill_user_id_idx` ON `skills` (`userId`);--> statement-breakpoint
CREATE INDEX `wanted_user_id_idx` ON `skills_wanted` (`userId`);--> statement-breakpoint
CREATE INDEX `user_id_idx` ON `user_profiles` (`userId`);