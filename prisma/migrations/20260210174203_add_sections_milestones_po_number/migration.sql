-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "counter_year" INTEGER NOT NULL DEFAULT 2026;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "section" TEXT;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "client_po_number" TEXT,
ADD COLUMN     "situation_total" INTEGER;

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "section" TEXT;

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "client_po_number" TEXT;

-- CreateTable
CREATE TABLE "quote_milestones" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "position" INTEGER NOT NULL,
    "invoice_id" UUID,

    CONSTRAINT "quote_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quote_milestones_invoice_id_key" ON "quote_milestones"("invoice_id");

-- AddForeignKey
ALTER TABLE "quote_milestones" ADD CONSTRAINT "quote_milestones_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_milestones" ADD CONSTRAINT "quote_milestones_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
