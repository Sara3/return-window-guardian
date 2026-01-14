CREATE TABLE `purchase_line_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1,
	`amount_cents` integer,
	`sku` text,
	`status` text DEFAULT 'keeping',
	`return_reason` text,
	`returned_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
