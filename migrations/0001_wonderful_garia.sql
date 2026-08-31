CREATE INDEX "stats_death_attacker_player_id_idx" ON "stats_death" USING btree ("attacker_player_id");--> statement-breakpoint
CREATE INDEX "stats_death_victim_player_id_idx" ON "stats_death" USING btree ("victim_player_id");--> statement-breakpoint
CREATE INDEX "stats_round_started_at_idx" ON "stats_round" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "stats_round_player_player_id_idx" ON "stats_round_player" USING btree ("player_id");