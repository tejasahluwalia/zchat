DROP TABLE IF EXISTS "chats";
DROP TABLE IF EXISTS "messages";
DROP TABLE IF EXISTS "users";

CREATE TABLE "chats" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"userId" varchar(21) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"chatId" varchar(21) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"sentByUser" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_chats_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;
