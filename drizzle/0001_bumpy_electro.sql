ALTER TABLE "appointments" ALTER COLUMN "from" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "to" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ALTER COLUMN "url" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "participants" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "title" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "polls" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "mode" SET NOT NULL;