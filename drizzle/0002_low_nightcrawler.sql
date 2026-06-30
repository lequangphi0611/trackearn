CREATE INDEX "devices_status_idx" ON "devices" USING btree ("status");--> statement-breakpoint
CREATE INDEX "devices_buy_date_idx" ON "devices" USING btree ("buy_date");