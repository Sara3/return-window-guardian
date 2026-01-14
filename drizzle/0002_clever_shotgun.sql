ALTER TABLE `purchases` ADD `tracking_number` text;--> statement-breakpoint
ALTER TABLE `purchases` ADD `carrier` text;--> statement-breakpoint
ALTER TABLE `purchases` ADD `refund_expected_amount` integer;--> statement-breakpoint
ALTER TABLE `purchases` ADD `refund_confirmed_at` integer;--> statement-breakpoint
ALTER TABLE `purchases` ADD `refund_amount` integer;