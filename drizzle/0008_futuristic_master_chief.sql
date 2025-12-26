CREATE TABLE "sapphire_tournament_prize_item" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"prize_level_id" varchar(255) NOT NULL,
	"prize_type" varchar(20) NOT NULL,
	"percentage" numeric(5, 2),
	"fixed_amount" integer,
	"custom_prize_label" text,
	"custom_prize_value" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sapphire_tournament_prize_structure" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"tournament_id" varchar(255) NOT NULL,
	"min_entrants" integer NOT NULL,
	"max_entrants" integer,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP CONSTRAINT "sapphire_tournament_prize_level_tournament_id_sapphire_tournament_id_fk";
--> statement-breakpoint
DROP INDEX "tournament_prize_level_tournament_id_idx";--> statement-breakpoint
DROP INDEX "tournament_prize_level_min_entrants_idx";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "prize_structure_id" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_item" ADD CONSTRAINT "sapphire_tournament_prize_item_prize_level_id_sapphire_tournament_prize_level_id_fk" FOREIGN KEY ("prize_level_id") REFERENCES "public"."sapphire_tournament_prize_level"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_structure" ADD CONSTRAINT "sapphire_tournament_prize_structure_tournament_id_sapphire_tournament_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."sapphire_tournament"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_prize_item_level_id_idx" ON "sapphire_tournament_prize_item" USING btree ("prize_level_id");--> statement-breakpoint
CREATE INDEX "tournament_prize_item_sort_order_idx" ON "sapphire_tournament_prize_item" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "tournament_prize_structure_tournament_id_idx" ON "sapphire_tournament_prize_structure" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_prize_structure_sort_order_idx" ON "sapphire_tournament_prize_structure" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" ADD CONSTRAINT "sapphire_tournament_prize_level_prize_structure_id_sapphire_tournament_prize_structure_id_fk" FOREIGN KEY ("prize_structure_id") REFERENCES "public"."sapphire_tournament_prize_structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tournament_prize_level_structure_id_idx" ON "sapphire_tournament_prize_level" USING btree ("prize_structure_id");--> statement-breakpoint
CREATE INDEX "tournament_prize_level_sort_order_idx" ON "sapphire_tournament_prize_level" USING btree ("sort_order");--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "tournament_id";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "min_entrants";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "max_entrants";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "prize_type";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "percentage";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "fixed_amount";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "custom_prize_label";--> statement-breakpoint
ALTER TABLE "sapphire_tournament_prize_level" DROP COLUMN "custom_prize_value";