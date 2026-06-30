CREATE TABLE "error_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"level" text NOT NULL,
	"action" text NOT NULL,
	"message" text NOT NULL,
	"stack" text,
	"request_id" text,
	"user_id" text,
	"extra" jsonb
);
--> statement-breakpoint
CREATE INDEX "error_logs_created_at_idx" ON "error_logs" USING btree ("created_at");