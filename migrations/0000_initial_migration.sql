CREATE TABLE "death" (
	"id" serial PRIMARY KEY NOT NULL,
	"player_record_id" integer NOT NULL,
	"attacker_steam_id" varchar(17),
	"is_teamkill" boolean DEFAULT false NOT NULL,
	"inflictor" varchar(255),
	"hitgroup" integer,
	"time_of_death" timestamp
);
--> statement-breakpoint
CREATE TABLE "map" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"started_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_record" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_id" integer NOT NULL,
	"steam_id" varchar(17) NOT NULL,
	"team_name" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "round" (
	"id" serial PRIMARY KEY NOT NULL,
	"map_id" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"ended_at" timestamp NOT NULL,
	"winning_team" varchar(255) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "death" ADD CONSTRAINT "death_player_record_id_player_record_id_fk" FOREIGN KEY ("player_record_id") REFERENCES "public"."player_record"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_record" ADD CONSTRAINT "player_record_round_id_round_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."round"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "round" ADD CONSTRAINT "round_map_id_map_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."map"("id") ON DELETE no action ON UPDATE no action;