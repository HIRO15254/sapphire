CREATE TABLE "sapphire_cash_game" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"currency_id" varchar(255),
	"small_blind" integer NOT NULL,
	"big_blind" integer NOT NULL,
	"straddle1" integer,
	"straddle2" integer,
	"ante" integer,
	"ante_type" varchar(20),
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_store" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"place_id" varchar(255),
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "sapphire_tournament_blind_level" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tournament_id" varchar(255) NOT NULL,
	"level" integer NOT NULL,
	"small_blind" integer NOT NULL,
	"big_blind" integer NOT NULL,
	"ante" integer,
	"duration_minutes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sapphire_tournament_prize_level" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tournament_id" varchar(255) NOT NULL,
	"position" integer NOT NULL,
	"percentage" numeric(5, 2),
	"fixed_amount" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sapphire_tournament" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"store_id" varchar(255) NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"currency_id" varchar(255),
	"name" varchar(255),
	"buy_in" integer NOT NULL,
	"starting_stack" integer,
	"notes" text,
	"is_archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "sapphire_cash_game" ADD CONSTRAINT "sapphire_cash_game_store_id_sapphire_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sapphire_store"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_cash_game" ADD CONSTRAINT "sapphire_cash_game_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_cash_game" ADD CONSTRAINT "sapphire_cash_game_currency_id_sapphire_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sapphire_currency"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_store" ADD CONSTRAINT "sapphire_store_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_blind_level" ADD CONSTRAINT "sapphire_tournament_blind_level_tournament_id_sapphire_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."sapphire_tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD CONSTRAINT "sapphire_tournament_prize_level_tournament_id_sapphire_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."sapphire_tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_tournament" ADD CONSTRAINT "sapphire_tournament_store_id_sapphire_store_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sapphire_store"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_tournament" ADD CONSTRAINT "sapphire_tournament_user_id_sapphire_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."sapphire_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_tournament" ADD CONSTRAINT "sapphire_tournament_currency_id_sapphire_currency_id_fk" FOREIGN KEY ("currency_id") REFERENCES "public"."sapphire_currency"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cash_game_store_id_idx" ON "sapphire_cash_game" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "cash_game_user_id_idx" ON "sapphire_cash_game" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cash_game_currency_id_idx" ON "sapphire_cash_game" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "cash_game_is_archived_idx" ON "sapphire_cash_game" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "store_user_id_idx" ON "sapphire_store" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "store_is_archived_idx" ON "sapphire_store" USING btree ("is_archived");--> statement-breakpoint
CREATE INDEX "tournament_blind_level_tournament_id_idx" ON "sapphire_tournament_blind_level" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_blind_level_level_idx" ON "sapphire_tournament_blind_level" USING btree ("level");--> statement-breakpoint
CREATE INDEX "tournament_prize_level_tournament_id_idx" ON "sapphire_tournament_prize_level" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_prize_level_position_idx" ON "sapphire_tournament_prize_level" USING btree ("position");--> statement-breakpoint
CREATE INDEX "tournament_store_id_idx" ON "sapphire_tournament" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "tournament_user_id_idx" ON "sapphire_tournament" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tournament_currency_id_idx" ON "sapphire_tournament" USING btree ("currency_id");--> statement-breakpoint
CREATE INDEX "tournament_is_archived_idx" ON "sapphire_tournament" USING btree ("is_archived");