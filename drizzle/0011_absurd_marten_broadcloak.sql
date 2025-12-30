ALTER TABLE "sapphire_cash_game" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "sapphire_tournament" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "cash_game_sort_order_idx" ON "sapphire_cash_game" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "tournament_sort_order_idx" ON "sapphire_tournament" USING btree ("sort_order");