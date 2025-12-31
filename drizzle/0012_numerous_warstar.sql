CREATE TABLE "sapphire_session_event" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"event_type" varchar(50) NOT NULL,
	"event_data" jsonb,
	"sequence" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sapphire_session_event" ADD CONSTRAINT "sapphire_session_event_session_id_sapphire_poker_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sapphire_poker_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_session_event" ADD CONSTRAINT "sapphire_session_event_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_event_session_id_idx" ON "sapphire_session_event" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "session_event_event_type_idx" ON "sapphire_session_event" USING btree ("event_type");--> statement-breakpoint
CREATE INDEX "session_event_sequence_idx" ON "sapphire_session_event" USING btree ("sequence");--> statement-breakpoint
CREATE INDEX "session_event_recorded_at_idx" ON "sapphire_session_event" USING btree ("recorded_at");