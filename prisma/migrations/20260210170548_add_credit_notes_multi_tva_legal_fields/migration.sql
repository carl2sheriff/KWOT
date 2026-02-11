-- CreateEnum
CREATE TYPE "CreditNoteStatus" AS ENUM ('DRAFT', 'SENT', 'APPLIED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CREDIT';

-- DropIndex
DROP INDEX "invoices_quote_id_key";

-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN     "ape_code" TEXT,
ADD COLUMN     "bic" TEXT,
ADD COLUMN     "credit_note_prefix" TEXT NOT NULL DEFAULT 'AV',
ADD COLUMN     "early_payment_discount" TEXT,
ADD COLUMN     "iban" TEXT,
ADD COLUMN     "late_penalty_rate" DECIMAL(5,2),
ADD COLUMN     "legal_footer" TEXT,
ADD COLUMN     "legal_form" TEXT,
ADD COLUMN     "next_credit_note_number" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "rcs_city" TEXT,
ADD COLUMN     "rcs_number" TEXT,
ADD COLUMN     "share_capital" TEXT,
ADD COLUMN     "siren" TEXT,
ADD COLUMN     "tva_intracom" TEXT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "situation_number" INTEGER;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 20;

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 20;

-- CreateTable
CREATE TABLE "credit_notes" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "invoice_id" UUID NOT NULL,
    "client_id" UUID NOT NULL,
    "created_by_id" UUID NOT NULL,
    "status" "CreditNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subtotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_note_items" (
    "id" UUID NOT NULL,
    "credit_note_id" UUID NOT NULL,
    "product_id" UUID,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 20,
    "total" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_note_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "credit_notes_reference_key" ON "credit_notes"("reference");

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_notes" ADD CONSTRAINT "credit_notes_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_credit_note_id_fkey" FOREIGN KEY ("credit_note_id") REFERENCES "credit_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_note_items" ADD CONSTRAINT "credit_note_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
