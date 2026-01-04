CREATE TABLE "sapphire_session_tablemate" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"nickname" varchar(100) NOT NULL,
	"seat_number" integer,
	"session_notes" text,
	"player_id" varchar(255),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sapphire_session_tablemate" ADD CONSTRAINT "sapphire_session_tablemate_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_session_tablemate" ADD CONSTRAINT "sapphire_session_tablemate_session_id_sapphire_poker_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sapphire_poker_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_session_tablemate" ADD CONSTRAINT "sapphire_session_tablemate_player_id_sapphire_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."sapphire_player"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_tablemate_user_id_idx" ON "sapphire_session_tablemate" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_tablemate_session_id_idx" ON "sapphire_session_tablemate" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_tablemate_player_id_idx" ON "sapphire_session_tablemate" USING btree ("player_id");