CREATE TABLE "sapphire_all_in_record" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"session_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"pot_amount" integer NOT NULL,
	"win_probability" numeric(5, 2) NOT NULL,
	"actual_result" boolean NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_poker_session" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"store_id" varchar(255),
	"game_type" varchar(20),
	"cash_game_id" varchar(255),
	"tournament_id" varchar(255),
	"currency_id" varchar(255),
	"is_active" boolean DEFAULT false NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone,
	"buy_in" integer NOT NULL,
	"cash_out" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sapphire_all_in_record" ADD CONSTRAINT "sapphire_all_in_record_session_id_sapphire_poker_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sapphire_poker_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_all_in_record" ADD CONSTRAINT "sapphire_all_in_record_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD CONSTRAINT "sapphire_poker_session_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD CONSTRAINT "sapphire_poker_session_store_id_sapphire_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sapphire_store"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD CONSTRAINT "sapphire_poker_session_cash_game_id_sapphire_cash_game_id_fk" FOREIGN KEY ("cash_game_id") REFERENCES "public"."sapphire_cash_game"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD CONSTRAINT "sapphire_poker_session_tournament_id_sapphire_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."sapphire_tournament"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_poker_session" ADD CONSTRAINT "sapphire_poker_session_currency_id_sapphire_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sapphire_currency"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "all_in_record_session_id_idx" ON "sapphire_all_in_record" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "all_in_record_user_id_idx" ON "sapphire_all_in_record" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "poker_session_user_id_idx" ON "sapphire_poker_session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "poker_session_store_id_idx" ON "sapphire_poker_session" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "poker_session_start_time_idx" ON "sapphire_poker_session" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "poker_session_is_active_idx" ON "sapphire_poker_session" USING btree ("is_active");