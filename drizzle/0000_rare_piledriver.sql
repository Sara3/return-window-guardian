CREATE TABLE `cached_card_protections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_name` text NOT NULL,
	`window_days` integer,
	`max_claim` integer,
	`source_url` text,
	`raw_response` text,
	`looked_up_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cached_card_protections_card_name_unique` ON `cached_card_protections` (`card_name`);--> statement-breakpoint
CREATE TABLE `cached_policies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`merchant` text NOT NULL,
	`window_days` integer,
	`starts_from` text,
	`source_url` text,
	`raw_response` text,
	`looked_up_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `cached_policies_merchant_unique` ON `cached_policies` (`merchant`);--> statement-breakpoint
CREATE TABLE `processed_emails` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`message_id` text NOT NULL,
	`purchase_id` integer,
	`email_type` text,
	`processed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `processed_emails_message_id_unique` ON `processed_emails` (`message_id`);--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`transaction_id` text,
	`merchant` text NOT NULL,
	`amount` integer NOT NULL,
	`card_used` text,
	`purchase_date` integer NOT NULL,
	`item_description` text,
	`order_number` text,
	`delivery_date` integer,
	`store_policy_window_days` integer,
	`store_policy_starts_from` text,
	`store_policy_source_url` text,
	`store_policy_looked_up` integer,
	`card_protection_window_days` integer,
	`card_protection_max_claim` integer,
	`card_protection_source_url` text,
	`card_protection_looked_up` integer,
	`store_expires` integer,
	`card_expires` integer,
	`store_alert_sent` integer DEFAULT false,
	`card_alert_sent` integer DEFAULT false,
	`status` text DEFAULT 'tracking',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `purchases_transaction_id_unique` ON `purchases` (`transaction_id`);--> statement-breakpoint
CREATE TABLE `sent_alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`purchase_id` integer NOT NULL,
	`alert_type` text NOT NULL,
	`sent_at` integer NOT NULL
);
