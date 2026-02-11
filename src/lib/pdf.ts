import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface CompanyInfo {
  companyName: string
  siret?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  tvaIntracom?: string | null
  legalForm?: string | null
  shareCapital?: string | null
  siren?: string | null
  rcsNumber?: string | null
  rcsCity?: string | null
  iban?: string | null
  bic?: string | null
}

interface ClientInfo {
  name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

interface LineItemPDF {
  description: string
  section?: string | null
  quantity: number
  unitPrice: number
  discount: number
  taxRate: number
  total: number
}

interface QuotePDFData {
  reference: string
  status: string
  createdAt: string
  validUntil?: string | null
  clientPONumber?: string | null
  subtotal: number
  taxAmount: number
  discount: number
  discountType: string
  total: number
  notes?: string | null
  terms?: string | null
  client: ClientInfo
  items: LineItemPDF[]
}

interface InvoicePDFData {
  reference: string
  status: string
  issueDate: string
  dueDate: string
  clientPONumber?: string | null
  situationNumber?: number | null
  situationTotal?: number | null
  subtotal: number
  taxAmount: number
  discount: number
  total: number
  amountPaid: number
  amountDue: number
  notes?: string | null
  terms?: string | null
  client: ClientInfo
  items: LineItemPDF[]
  legalMentions: string[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDateFR(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function addHeader(doc: jsPDF, company: CompanyInfo, title: string, reference: string): number {
  // Company info (left)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(company.companyName, 20, 25)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  let y = 32
  if (company.address) { doc.text(company.address, 20, y); y += 4 }
  if (company.phone) { doc.text(`Tel: ${company.phone}`, 20, y); y += 4 }
  if (company.email) { doc.text(company.email, 20, y); y += 4 }
  if (company.siret) { doc.text(`SIRET: ${company.siret}`, 20, y); y += 4 }
  if (company.tvaIntracom) { doc.text(`TVA: ${company.tvaIntracom}`, 20, y); y += 4 }

  // Document title (right)
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 190, 25, { align: 'right' })
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(reference, 190, 33, { align: 'right' })

  return Math.max(y, 40)
}

function addClientBlock(doc: jsPDF, client: ClientInfo, startY: number, meta: { label: string; value: string }[]): number {
  let y = startY + 10

  // Meta info
  doc.setFontSize(8)
  for (const m of meta) {
    doc.setFont('helvetica', 'bold')
    doc.text(`${m.label}:`, 20, y)
    doc.setFont('helvetica', 'normal')
    doc.text(m.value, 55, y)
    y += 5
  }

  // Client block (right side)
  const clientY = startY + 10
  doc.setFillColor(245, 245, 245)
  doc.roundedRect(120, clientY - 5, 70, 30, 2, 2, 'F')

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('DESTINATAIRE', 125, clientY)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(client.name, 125, clientY + 6)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  let cy = clientY + 11
  if (client.company) { doc.text(client.company, 125, cy); cy += 4 }
  if (client.address) { doc.text(client.address, 125, cy); cy += 4 }
  if (client.email) { doc.text(client.email, 125, cy); cy += 4 }

  return Math.max(y, clientY + 35)
}

function addItemsTable(doc: jsPDF, items: LineItemPDF[], startY: number): number {
  // Group by section
  const rows: (string | number)[][] = []
  let currentSection = ''

  for (const item of items) {
    if (item.section && item.section !== currentSection) {
      currentSection = item.section
      rows.push([{ content: currentSection, colSpan: 6, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], fontSize: 8 } } as unknown as string])
    }
    rows.push([
      item.description,
      item.quantity.toFixed(2),
      formatCurrency(item.unitPrice),
      item.taxRate + '%',
      item.discount > 0 ? formatCurrency(item.discount) : '-',
      formatCurrency(item.total),
    ])
  }

  autoTable(doc, {
    startY,
    head: [['Description', 'Qte', 'Prix unit. HT', 'TVA', 'Remise', 'Total HT']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [60, 1, 252], fontSize: 8, font: 'helvetica' },
    bodyStyles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'right' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 15, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 20, right: 20 },
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (doc as any).lastAutoTable.finalY as number
}

function addTotals(doc: jsPDF, y: number, data: { subtotal: number; discount: number; taxAmount: number; total: number; amountPaid?: number; amountDue?: number }): number {
  y += 10
  const x = 130
  const xVal = 185

  doc.setFontSize(9)

  doc.setFont('helvetica', 'normal')
  doc.text('Sous-total HT', x, y)
  doc.text(formatCurrency(data.subtotal), xVal, y, { align: 'right' })
  y += 6

  if (data.discount > 0) {
    doc.text('Remise', x, y)
    doc.text(`-${formatCurrency(data.discount)}`, xVal, y, { align: 'right' })
    y += 6
  }

  doc.text('TVA', x, y)
  doc.text(formatCurrency(data.taxAmount), xVal, y, { align: 'right' })
  y += 8

  // Total line
  doc.setDrawColor(60, 1, 252)
  doc.setLineWidth(0.5)
  doc.line(x, y - 3, xVal, y - 3)

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL TTC', x, y + 2)
  doc.text(formatCurrency(data.total), xVal, y + 2, { align: 'right' })
  y += 10

  if (data.amountPaid !== undefined && data.amountDue !== undefined) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Deja paye', x, y)
    doc.text(formatCurrency(data.amountPaid), xVal, y, { align: 'right' })
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.text('Reste a payer', x, y)
    doc.text(formatCurrency(data.amountDue), xVal, y, { align: 'right' })
    y += 6
  }

  return y
}

export function generateQuotePDF(quote: QuotePDFData, company: CompanyInfo): Uint8Array {
  const doc = new jsPDF()

  let y = addHeader(doc, company, 'DEVIS', quote.reference)

  const meta: { label: string; value: string }[] = [
    { label: 'Date', value: formatDateFR(quote.createdAt) },
  ]
  if (quote.validUntil) meta.push({ label: 'Valide jusqu\'au', value: formatDateFR(quote.validUntil) })
  if (quote.clientPONumber) meta.push({ label: 'N\u00b0 BC client', value: quote.clientPONumber })

  y = addClientBlock(doc, quote.client, y, meta)
  y = addItemsTable(doc, quote.items, y + 5)
  y = addTotals(doc, y, { subtotal: quote.subtotal, discount: quote.discount, taxAmount: quote.taxAmount, total: quote.total })

  // Notes
  if (quote.notes) {
    y += 10
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(quote.notes, 170)
    doc.text(lines, 20, y + 5)
    y += 5 + lines.length * 4
  }

  // Terms
  if (quote.terms) {
    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Conditions:', 20, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(quote.terms, 170)
    doc.text(lines, 20, y + 5)
  }

  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  doc.text(`${company.companyName} - Document genere automatiquement`, 105, 285, { align: 'center' })

  return new Uint8Array(doc.output('arraybuffer'))
}

export function generateInvoicePDF(invoice: InvoicePDFData, company: CompanyInfo): Uint8Array {
  const doc = new jsPDF()

  const title = invoice.situationNumber && invoice.situationTotal
    ? `FACTURE ${invoice.situationNumber}/${invoice.situationTotal}`
    : 'FACTURE'

  let y = addHeader(doc, company, title, invoice.reference)

  const meta: { label: string; value: string }[] = [
    { label: 'Date d\'emission', value: formatDateFR(invoice.issueDate) },
    { label: 'Date d\'echeance', value: formatDateFR(invoice.dueDate) },
  ]
  if (invoice.clientPONumber) meta.push({ label: 'N\u00b0 BC client', value: invoice.clientPONumber })

  y = addClientBlock(doc, invoice.client, y, meta)
  y = addItemsTable(doc, invoice.items, y + 5)
  y = addTotals(doc, y, {
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    taxAmount: invoice.taxAmount,
    total: invoice.total,
    amountPaid: invoice.amountPaid,
    amountDue: invoice.amountDue,
  })

  // Banking info
  if (company.iban) {
    y += 10
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Coordonnees bancaires:', 20, y)
    doc.setFont('helvetica', 'normal')
    y += 5
    doc.text(`IBAN: ${company.iban}`, 20, y)
    if (company.bic) { y += 4; doc.text(`BIC: ${company.bic}`, 20, y) }
    y += 6
  }

  // Legal mentions
  if (invoice.legalMentions.length > 0) {
    y += 5
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    for (const mention of invoice.legalMentions) {
      if (y > 270) { doc.addPage(); y = 20 }
      const lines = doc.splitTextToSize(mention, 170)
      doc.text(lines, 20, y)
      y += lines.length * 3.5
    }
    doc.setTextColor(0)
  }

  // Notes
  if (invoice.notes) {
    if (y > 260) { doc.addPage(); y = 20 }
    y += 5
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes:', 20, y)
    doc.setFont('helvetica', 'normal')
    const lines = doc.splitTextToSize(invoice.notes, 170)
    doc.text(lines, 20, y + 5)
  }

  // Footer
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  const footerParts: string[] = [company.companyName]
  if (company.legalForm) footerParts.push(company.legalForm)
  if (company.rcsCity && company.rcsNumber) footerParts.push(`RCS ${company.rcsCity} ${company.rcsNumber}`)
  if (company.siren) footerParts.push(`SIREN ${company.siren}`)
  doc.text(footerParts.join(' - '), 105, 285, { align: 'center' })

  return new Uint8Array(doc.output('arraybuffer'))
}
