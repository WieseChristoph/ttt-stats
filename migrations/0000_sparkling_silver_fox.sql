CREATE TYPE "public"."stats_round_event_type" AS ENUM('death', 'role_change', 'revival');--> statement-breakpoint
CREATE TABLE "stats_death" (
	"event_id" integer PRIMARY KEY NOT NULL,
	"victim_player_id" integer NOT NULL,
	"attacker_player_id" integer,
	"victim_team_name" varchar(255) NOT NULL,
	"victim_subrole_name" varchar(255),
	"attacker_team_name" varchar(255),
	"attacker_subrole_name" varchar(255),
	"is_teamkill" boolean DEFAULT false NOT NULL,
	"inflictor" varchar(255),
	"hitgroup" integer
);
--> statement-breakpoint
CREATE TABLE "stats_map" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"steam_id" varchar(17) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats_revival" (
	"event_id" integer PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"team_name" varchar(255) NOT NULL,
	"subrole_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "stats_role_change" (
	"event_id" integer PRIMARY KEY NOT NULL,
	"player_id" integer NOT NULL,
	"from_team_name" varchar(255) NOT NULL,
	"from_subrole_name" varchar(255),
	"to_team_name" varchar(255) NOT NULL,
	"to_subrole_name" varchar(255)
);
--> statement-breakpoint
CREATE TABLE "stats_round" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"round_key" varchar(255) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone NOT NULL,
	"winning_team" varchar(255) NOT NULL,
	"winning_subrole" varchar(255),
	"telemetry_version" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats_round_event" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"type" "stats_round_event_type" NOT NULL,
	"occurred_at" timestamp with time zone,
	"legacy_key" varchar(255),
	CONSTRAINT "stats_round_event_sequence_positive" CHECK ("stats_round_event"."sequence" > 0)
);
--> statement-breakpoint
CREATE TABLE "stats_round_player" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"player_id" integer NOT NULL,
	"initial_team_name" varchar(255) NOT NULL,
	"initial_subrole_name" varchar(255),
	"final_team_name" varchar(255) NOT NULL,
	"final_subrole_name" varchar(255),
	"joined_at" timestamp with time zone,
	"left_at" timestamp with time zone,
	"kills" integer DEFAULT 0 NOT NULL,
	"deaths" integer DEFAULT 0 NOT NULL,
	"team_kills" integer DEFAULT 0 NOT NULL,
	"damage_dealt" real,
	"damage_taken" real,
	"shots_fired" integer,
	"shots_hit" integer,
	"survival_seconds" real
);
--> statement-breakpoint
CREATE TABLE "stats_session" (
	"id" serial PRIMARY KEY NOT NULL,
	"map_id" integer NOT NULL,
	"session_key" varchar(255) NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "stats_weapon_stat" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_player_id" integer NOT NULL,
	"weapon_name" varchar(255) NOT NULL,
	"kills" integer DEFAULT 0 NOT NULL,
	"shots_fired" integer,
	"shots_hit" integer,
	"damage_dealt" real
);
--> statement-breakpoint
ALTER TABLE "stats_death" ADD CONSTRAINT "stats_death_event_id_stats_round_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."stats_round_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_death" ADD CONSTRAINT "stats_death_victim_player_id_stats_player_id_fk" FOREIGN KEY ("victim_player_id") REFERENCES "public"."stats_player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_death" ADD CONSTRAINT "stats_death_attacker_player_id_stats_player_id_fk" FOREIGN KEY ("attacker_player_id") REFERENCES "public"."stats_player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_revival" ADD CONSTRAINT "stats_revival_event_id_stats_round_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."stats_round_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_revival" ADD CONSTRAINT "stats_revival_player_id_stats_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."stats_player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_role_change" ADD CONSTRAINT "stats_role_change_event_id_stats_round_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."stats_round_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_role_change" ADD CONSTRAINT "stats_role_change_player_id_stats_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."stats_player"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_round" ADD CONSTRAINT "stats_round_session_id_stats_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."stats_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_round_event" ADD CONSTRAINT "stats_round_event_round_id_stats_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."stats_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_round_player" ADD CONSTRAINT "stats_round_player_round_id_stats_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."stats_round"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_round_player" ADD CONSTRAINT "stats_round_player_player_id_stats_player_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."stats_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_session" ADD CONSTRAINT "stats_session_map_id_stats_map_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."stats_map"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_weapon_stat" ADD CONSTRAINT "stats_weapon_stat_round_player_id_stats_round_player_id_fk" FOREIGN KEY ("round_player_id") REFERENCES "public"."stats_round_player"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "stats_map_name_unique" ON "stats_map" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_player_steam_id_unique" ON "stats_player" USING btree ("steam_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_round_session_key_unique" ON "stats_round" USING btree ("session_id","round_key");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_round_event_sequence_unique" ON "stats_round_event" USING btree ("round_id","sequence");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_round_event_legacy_key_unique" ON "stats_round_event" USING btree ("legacy_key");--> statement-breakpoint
CREATE INDEX "stats_round_event_round_occurred_at_idx" ON "stats_round_event" USING btree ("round_id","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_round_player_unique" ON "stats_round_player" USING btree ("round_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_session_key_unique" ON "stats_session" USING btree ("session_key");--> statement-breakpoint
CREATE INDEX "stats_session_map_id_idx" ON "stats_session" USING btree ("map_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stats_weapon_stat_unique" ON "stats_weapon_stat" USING btree ("round_player_id","weapon_name");