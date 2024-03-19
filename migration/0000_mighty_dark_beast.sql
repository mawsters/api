CREATE TABLE IF NOT EXISTS "corelists" (
	"key" varchar(256),
	"slug" varchar(256) NOT NULL,
	"source" varchar(256),
	"name" varchar(256),
	"description" varchar(256) DEFAULT '',
	"booksCount" integer DEFAULT 0,
	"books" json DEFAULT '[]'::json,
	"creatorKey" varchar(256) NOT NULL,
	CONSTRAINT "corelists_slug_creatorKey_pk" PRIMARY KEY("slug","creatorKey")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "createdlists" (
	"key" varchar(256),
	"slug" varchar(256) NOT NULL,
	"source" varchar(256),
	"name" varchar(256),
	"description" varchar(256) DEFAULT '',
	"booksCount" integer DEFAULT 0,
	"books" json DEFAULT '[]'::json,
	"creatorKey" varchar(256) NOT NULL,
	CONSTRAINT "createdlists_slug_creatorKey_pk" PRIMARY KEY("slug","creatorKey")
);
