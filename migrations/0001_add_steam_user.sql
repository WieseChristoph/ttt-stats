CREATE TABLE "steam_user" (
	"id" serial PRIMARY KEY NOT NULL,
	"steam_id" varchar(17) NOT NULL,
	"username" varchar(255) NOT NULL,
	"profile_url" varchar(255) NOT NULL,
	"avatar" varchar(255),
	"avatar_medium" varchar(255),
	"avatar_full" varchar(255)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "steamIdUniqueIndex" ON "steam_user" USING btree ("steam_id");