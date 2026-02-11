/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Demo seed script – creates 20 realistic projects for Sheriff Projects presentation
 * Run: export $(cat .env.local | xargs) && npx tsx prisma/seed-demo.ts
 */

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();
const uuid = () => crypto.randomUUID();

const USER_ID = "00000000-0000-0000-0000-000000000001";

// ============================================
// CLIENTS – Realistic French companies
// ============================================
const clients = [
  { id: uuid(), name: "Marie Dupont", company: "L'Oreal Paris", email: "m.dupont@loreal.com", phone: "+33 1 47 56 70 00", address: "41 Rue Martre, 92117 Clichy", status: "active" },
  { id: uuid(), name: "Thomas Martin", company: "Publicis Groupe", email: "t.martin@publicis.fr", phone: "+33 1 44 43 70 00", address: "133 Avenue des Champs-Elysees, 75008 Paris", status: "active" },
  { id: uuid(), name: "Sophie Leroy", company: "Dior Couture", email: "s.leroy@dior.com", phone: "+33 1 40 73 73 73", address: "30 Avenue Montaigne, 75008 Paris", status: "active" },
  { id: uuid(), name: "Antoine Bernard", company: "LVMH", email: "a.bernard@lvmh.com", phone: "+33 1 44 13 22 22", address: "22 Avenue Montaigne, 75008 Paris", status: "active" },
  { id: uuid(), name: "Camille Moreau", company: "Havas Paris", email: "c.moreau@havas.com", phone: "+33 1 58 47 80 00", address: "29/30 Quai de Dion Bouton, 92800 Puteaux", status: "active" },
  { id: uuid(), name: "Lucas Petit", company: "Renault Group", email: "l.petit@renault.com", phone: "+33 1 76 84 04 04", address: "13-15 Quai Le Gallo, 92100 Boulogne-Billancourt", status: "active" },
  { id: uuid(), name: "Julie Roux", company: "Chanel", email: "j.roux@chanel.com", phone: "+33 1 44 50 70 00", address: "135 Avenue Charles de Gaulle, 92200 Neuilly-sur-Seine", status: "active" },
  { id: uuid(), name: "Pierre Fournier", company: "BETC", email: "p.fournier@betc.com", phone: "+33 1 56 41 35 00", address: "37 Rue du Colonel Pierre Avia, 75015 Paris", status: "active" },
  { id: uuid(), name: "Emma Laurent", company: "Danone", email: "e.laurent@danone.com", phone: "+33 1 44 35 20 20", address: "17 Boulevard Haussmann, 75009 Paris", status: "active" },
  { id: uuid(), name: "Hugo Girard", company: "Orange", email: "h.girard@orange.com", phone: "+33 1 44 44 22 22", address: "111 Quai du President Roosevelt, 92130 Issy-les-Moulineaux", status: "prospect" },
];

// ============================================
// PROJECTS – 20 realistic photo/video productions
// ============================================
const now = new Date();
const d = (daysOffset: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() + daysOffset);
  return date;
};

interface ProjectDef {
  id: string;
  clientIdx: number;
  name: string;
  description: string;
  status: string;
  startDate: Date;
  endDate: Date | null;
  budget: number;
}

const projects: ProjectDef[] = [
  // Active projects (current work)
  { id: uuid(), clientIdx: 0, name: "L'Oreal – Campagne Printemps 2026", description: "Shooting photo et video pour la campagne skincare printemps. 3 jours studio + 1 jour exterieur.", status: "active", startDate: d(-15), endDate: d(20), budget: 45000 },
  { id: uuid(), clientIdx: 1, name: "Publicis – Film Corporate Stellantis", description: "Film institutionnel 3 minutes pour rapport annuel Stellantis. Tournage usine + siege.", status: "active", startDate: d(-10), endDate: d(30), budget: 32000 },
  { id: uuid(), clientIdx: 2, name: "Dior – Lookbook Haute Couture SS26", description: "Shooting lookbook collection haute couture printemps-ete 2026. 40 looks, 2 mannequins.", status: "active", startDate: d(-5), endDate: d(15), budget: 65000 },
  { id: uuid(), clientIdx: 3, name: "LVMH – Video Recrutement", description: "Serie de 5 temoignages video collaborateurs pour marque employeur. Format vertical + horizontal.", status: "active", startDate: d(-20), endDate: d(5), budget: 18000 },
  { id: uuid(), clientIdx: 4, name: "Havas – Spot TV BNP Paribas", description: "Production spot TV 30s pour campagne epargne BNP Paribas. Casting + tournage studio.", status: "active", startDate: d(-3), endDate: d(45), budget: 85000 },
  { id: uuid(), clientIdx: 5, name: "Renault – Lancement Scenic E-Tech", description: "Contenu photo/video multi-plateforme pour lancement nouveau Scenic electrique. 2 jours.", status: "active", startDate: d(-8), endDate: d(25), budget: 52000 },
  { id: uuid(), clientIdx: 6, name: "Chanel – Packshots N°5 L'Eau", description: "Shooting packshots et ambiance pour renouvellement assets digitaux N°5 L'Eau.", status: "active", startDate: d(-2), endDate: d(10), budget: 28000 },

  // Completed projects (recent)
  { id: uuid(), clientIdx: 0, name: "L'Oreal – Tutos YouTube Elvive", description: "Production de 8 tutos capillaires pour chaine YouTube. Format court, eclairage naturel.", status: "completed", startDate: d(-60), endDate: d(-15), budget: 24000 },
  { id: uuid(), clientIdx: 7, name: "BETC – Campagne Lacoste Automne", description: "Direction artistique et production photo campagne automne-hiver Lacoste.", status: "completed", startDate: d(-90), endDate: d(-30), budget: 72000 },
  { id: uuid(), clientIdx: 8, name: "Danone – Video RSE Evian", description: "Documentaire court-metrage 5min sur engagements RSE Evian. Tournage Alpes + usine.", status: "completed", startDate: d(-75), endDate: d(-20), budget: 38000 },
  { id: uuid(), clientIdx: 2, name: "Dior – Shooting Sauvage EDT", description: "Campagne photo parfum Sauvage. Tournage desert + studio. Photographe invitee.", status: "completed", startDate: d(-120), endDate: d(-60), budget: 95000 },
  { id: uuid(), clientIdx: 3, name: "LVMH – Rapport Annuel 2025", description: "Production photos dirigeants et sites pour rapport annuel groupe. 6 locations.", status: "completed", startDate: d(-100), endDate: d(-55), budget: 42000 },
  { id: uuid(), clientIdx: 1, name: "Publicis – Social Media Carrefour", description: "Production batch 20 visuels et 10 videos courtes pour reseaux sociaux Carrefour.", status: "completed", startDate: d(-45), endDate: d(-10), budget: 15000 },
  { id: uuid(), clientIdx: 5, name: "Renault – Photos Presse Megane", description: "Shooting presse nouvelle Megane E-Tech. Circuit + route. 1 journee.", status: "completed", startDate: d(-80), endDate: d(-70), budget: 19000 },

  // Draft / planning
  { id: uuid(), clientIdx: 7, name: "BETC – Film Manifeste Air France", description: "Film de marque 60s pour Air France. Concept en cours de validation. Tournage multi-pays.", status: "draft", startDate: d(15), endDate: d(90), budget: 120000 },
  { id: uuid(), clientIdx: 9, name: "Orange – Campagne 5G Pro", description: "Contenu video B2B pour offre 5G Pro. 3 cas clients a filmer sur sites industriels.", status: "draft", startDate: d(10), endDate: d(50), budget: 35000 },
  { id: uuid(), clientIdx: 6, name: "Chanel – Video Formation Interne", description: "Serie de 12 modules video e-learning pour formation vendeurs boutique. Studio.", status: "draft", startDate: d(20), endDate: d(80), budget: 48000 },

  // Cancelled
  { id: uuid(), clientIdx: 4, name: "Havas – Spot Radio SNCF", description: "Production spot radio 20s campagne ete SNCF. Annule suite changement strategie.", status: "cancelled", startDate: d(-40), endDate: null, budget: 8000 },
  { id: uuid(), clientIdx: 8, name: "Danone – Activation Salon Agriculture", description: "Couverture photo/video stand Danone au Salon de l'Agriculture. Annule.", status: "cancelled", startDate: d(-30), endDate: null, budget: 12000 },
  { id: uuid(), clientIdx: 9, name: "Orange – Podcast Serie Interne", description: "Production podcast 6 episodes pour communication interne. Budget non valide.", status: "cancelled", startDate: d(-25), endDate: null, budget: 22000 },
];

// ============================================
// LINE ITEMS templates (for quotes/invoices)
// ============================================
function getLineItems(budget: number, projectName: string) {
  const isVideo = projectName.toLowerCase().includes("video") || projectName.toLowerCase().includes("film") || projectName.toLowerCase().includes("spot") || projectName.toLowerCase().includes("tournage");
  const isPhoto = projectName.toLowerCase().includes("photo") || projectName.toLowerCase().includes("shooting") || projectName.toLowerCase().includes("lookbook") || projectName.toLowerCase().includes("packshot");

  if (isVideo && isPhoto) {
    return [
      { description: "Direction artistique et conception", unitPrice: Math.round(budget * 0.15), quantity: 1 },
      { description: "Journee de tournage photo (equipe complete)", unitPrice: Math.round(budget * 0.2), quantity: 2 },
      { description: "Journee de tournage video (equipe complete)", unitPrice: Math.round(budget * 0.2), quantity: 1 },
      { description: "Post-production et retouche photo", unitPrice: Math.round(budget * 0.12), quantity: 1 },
      { description: "Montage video et etalonnage", unitPrice: Math.round(budget * 0.15), quantity: 1 },
      { description: "Livraison multi-formats et adaptation", unitPrice: Math.round(budget * 0.05), quantity: 1 },
    ];
  }
  if (isVideo) {
    return [
      { description: "Pre-production et reperage", unitPrice: Math.round(budget * 0.1), quantity: 1 },
      { description: "Journee de tournage (equipe technique)", unitPrice: Math.round(budget * 0.3), quantity: 2 },
      { description: "Direction artistique", unitPrice: Math.round(budget * 0.12), quantity: 1 },
      { description: "Montage et post-production", unitPrice: Math.round(budget * 0.18), quantity: 1 },
      { description: "Etalonnage et mixage son", unitPrice: Math.round(budget * 0.08), quantity: 1 },
    ];
  }
  // Photo default
  return [
    { description: "Direction artistique et moodboard", unitPrice: Math.round(budget * 0.12), quantity: 1 },
    { description: "Journee de shooting (photographe + assistant)", unitPrice: Math.round(budget * 0.25), quantity: 2 },
    { description: "Location studio et eclairage", unitPrice: Math.round(budget * 0.1), quantity: 2 },
    { description: "Retouche et post-production", unitPrice: Math.round(budget * 0.15), quantity: 1 },
    { description: "Livraison fichiers HD + web", unitPrice: Math.round(budget * 0.03), quantity: 1 },
  ];
}

// ============================================
// SUPPLIERS
// ============================================
const suppliers = [
  { id: uuid(), name: "Studio Lumiere", company: "Studio Lumiere SARL", email: "contact@studiolumiere.fr", phone: "+33 1 42 33 11 22", status: "active" },
  { id: uuid(), name: "TechniCam Rental", company: "TechniCam SAS", email: "booking@technicam.fr", phone: "+33 1 45 67 89 00", status: "active" },
  { id: uuid(), name: "Casting Plus", company: "Casting Plus", email: "info@castingplus.fr", phone: "+33 1 53 20 10 10", status: "active" },
];

// ============================================
// SEED FUNCTION
// ============================================
async function main() {
  console.log("🎬 Seeding KWOT Finance demo data...\n");

  // 1. Ensure user exists
  await prisma.user.upsert({
    where: { id: USER_ID },
    create: { id: USER_ID, email: "carl@sheriffprojects.com", name: "Carl Sheriff", role: "admin" },
    update: {},
  });

  // Create additional team members
  const teamMembers = [
    { id: uuid(), email: "alex@sheriffprojects.com", name: "Alexandre Morin", role: "manager" },
    { id: uuid(), email: "lea@sheriffprojects.com", name: "Lea Mercier", role: "user" },
    { id: uuid(), email: "julien@sheriffprojects.com", name: "Julien Costa", role: "user" },
  ];

  for (const member of teamMembers) {
    await prisma.user.upsert({
      where: { email: member.email },
      create: member,
      update: {},
    });
  }
  const allUserIds = [USER_ID, ...teamMembers.map((m) => m.id)];

  console.log("✓ Users created (4 team members)");

  // 2. Create clients
  for (const c of clients) {
    await prisma.client.create({
      data: { id: c.id, name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address, status: c.status, createdById: USER_ID },
    });
  }
  console.log(`✓ ${clients.length} clients created`);

  // 3. Create suppliers
  for (const s of suppliers) {
    await prisma.supplier.create({ data: s });
  }
  console.log(`✓ ${suppliers.length} suppliers created`);

  // 4. Ensure CompanySettings exist and get counters
  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    settings = await prisma.companySettings.create({ data: {} });
  }
  let quoteNum = settings.nextQuoteNumber || 1;
  let invoiceNum = settings.nextInvoiceNumber || 1;
  let paymentNum = settings.nextPaymentNumber || 1;
  let poNum = settings.nextPONumber || 1;

  // 5. Create projects + quotes + invoices + payments + time entries + expenses
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const client = clients[p.clientIdx];

    const project = await prisma.project.create({
      data: {
        id: p.id,
        clientId: client.id,
        name: p.name,
        description: p.description,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        budget: p.budget,
        ownerId: USER_ID,
      },
    });

    // Skip financials for cancelled projects
    if (p.status === "cancelled") {
      console.log(`  [${i + 1}/20] ${p.name} (cancelled – no financials)`);
      continue;
    }

    // -- QUOTE --
    const lineItems = getLineItems(p.budget, p.name);
    const subtotal = lineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);
    const taxRate = 20;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    const quoteRef = `DEV-2026-${String(quoteNum).padStart(4, "0")}`;
    quoteNum++;

    const quoteStatus =
      p.status === "draft" ? "DRAFT" :
      p.status === "active" ? "APPROVED" : "APPROVED";

    const quote = await prisma.quote.create({
      data: {
        id: uuid(),
        reference: quoteRef,
        clientId: client.id,
        projectId: project.id,
        createdById: USER_ID,
        status: quoteStatus,
        validUntil: d(30),
        subtotal,
        taxRate,
        taxAmount,
        total,
        items: {
          create: lineItems.map((li, idx) => ({
            id: uuid(),
            description: li.description,
            quantity: li.quantity,
            unitPrice: li.unitPrice,
            taxRate: 20,
            total: li.unitPrice * li.quantity,
            position: idx,
          })),
        },
      },
    });

    // -- INVOICE (for active and completed projects) --
    if (p.status === "active" || p.status === "completed") {
      const invoiceRef = `FAC-2026-${String(invoiceNum).padStart(4, "0")}`;
      invoiceNum++;

      const isPaid = p.status === "completed" && Math.random() > 0.3;
      const isPartial = !isPaid && p.status === "completed";
      const isSent = p.status === "active";

      let invStatus: string;
      let amountPaid: number;
      if (isPaid) {
        invStatus = "PAID";
        amountPaid = total;
      } else if (isPartial) {
        invStatus = "PARTIALLY_PAID";
        amountPaid = Math.round(total * 0.3 * 100) / 100; // 30% acompte
      } else if (isSent) {
        invStatus = "SENT";
        amountPaid = 0;
      } else {
        invStatus = "DRAFT";
        amountPaid = 0;
      }

      const invoice = await prisma.invoice.create({
        data: {
          id: uuid(),
          reference: invoiceRef,
          quoteId: quote.id,
          clientId: client.id,
          projectId: project.id,
          createdById: USER_ID,
          status: invStatus,
          issueDate: p.startDate,
          dueDate: d(p.status === "completed" ? -10 : 30),
          subtotal,
          taxRate,
          taxAmount,
          total,
          amountPaid,
          amountDue: Math.round((total - amountPaid) * 100) / 100,
          items: {
            create: lineItems.map((li, idx) => ({
              id: uuid(),
              description: li.description,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
              taxRate: 20,
              total: li.unitPrice * li.quantity,
              position: idx,
            })),
          },
        },
      });

      // -- PAYMENT (for paid/partial invoices) --
      if (amountPaid > 0) {
        const payRef = `PAY-2026-${String(paymentNum).padStart(4, "0")}`;
        paymentNum++;
        await prisma.payment.create({
          data: {
            id: uuid(),
            reference: payRef,
            invoiceId: invoice.id,
            receivedById: USER_ID,
            amount: amountPaid,
            method: Math.random() > 0.5 ? "BANK_TRANSFER" : "CHECK",
            status: "COMPLETED",
            paidAt: d(p.status === "completed" ? -20 : -5),
          },
        });
      }

      // -- PURCHASE ORDER (for bigger projects, ~50% chance) --
      if (p.budget > 30000 && Math.random() > 0.4) {
        const poRef = `PO-2026-${String(poNum).padStart(4, "0")}`;
        poNum++;
        const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];
        const poSubtotal = Math.round(p.budget * (0.1 + Math.random() * 0.15));
        const poTax = Math.round(poSubtotal * 20) / 100;
        const poTotal = poSubtotal + poTax;

        await prisma.purchaseOrder.create({
          data: {
            id: uuid(),
            reference: poRef,
            supplierId: supplier.id,
            projectId: project.id,
            createdById: USER_ID,
            status: p.status === "completed" ? "RECEIVED" : "CONFIRMED",
            subtotal: poSubtotal,
            taxRate: 20,
            taxAmount: poTax,
            total: poTotal,
            items: {
              create: [
                { id: uuid(), description: "Location studio journee", quantity: 2, unitPrice: Math.round(poSubtotal * 0.6), total: Math.round(poSubtotal * 0.6) * 2, position: 0 },
                { id: uuid(), description: "Location materiel technique", quantity: 1, unitPrice: Math.round(poSubtotal * 0.4), total: Math.round(poSubtotal * 0.4), position: 1 },
              ],
            },
          },
        });
      }
    }

    // -- TIME ENTRIES (for active and completed projects) --
    if (p.status === "active" || p.status === "completed") {
      const numEntries = p.status === "completed" ? 8 + Math.floor(Math.random() * 12) : 3 + Math.floor(Math.random() * 6);
      const hourlyRates = [65, 75, 85, 95, 110];
      const descriptions = [
        "Pre-production et preparation",
        "Journee de tournage",
        "Direction artistique sur set",
        "Retouche et post-production",
        "Montage video",
        "Etalonnage couleur",
        "Reunion client",
        "Reperage terrain",
        "Casting et selection",
        "Livraison et exports",
        "Coordination equipe",
        "Revision et corrections client",
        "Mixage audio",
        "Gestion de production",
        "Supervision impression",
      ];

      for (let j = 0; j < numEntries; j++) {
        const daysAgo = Math.floor(Math.random() * 60) + 5;
        const startHour = 9 + Math.floor(Math.random() * 4);
        const durationMin = [60, 90, 120, 180, 240, 300, 360, 420, 480][Math.floor(Math.random() * 9)];
        const entryDate = d(-daysAgo);
        entryDate.setHours(startHour, 0, 0, 0);
        const endDate = new Date(entryDate.getTime() + durationMin * 60000);
        const rate = hourlyRates[Math.floor(Math.random() * hourlyRates.length)];

        await prisma.timeEntry.create({
          data: {
            id: uuid(),
            projectId: project.id,
            userId: allUserIds[Math.floor(Math.random() * allUserIds.length)],
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            startTime: entryDate,
            endTime: endDate,
            duration: durationMin,
            hourlyRate: rate,
            billable: Math.random() > 0.15,
            invoiced: p.status === "completed" && Math.random() > 0.3,
          },
        });
      }
    }

    // -- EXPENSES (for active and completed projects) --
    if (p.status === "active" || p.status === "completed") {
      const numExpenses = Math.floor(Math.random() * 5) + 1;
      const categories = ["transport", "location", "catering", "equipment", "props", "other"];
      const expenseDescs: Record<string, string[]> = {
        transport: ["Uber plateau tournage", "Train Paris-Lyon equipe", "Location vehicule journee", "Parking studio"],
        location: ["Location studio photo Bastille", "Location loft shooting", "Location rooftop Paris 16e"],
        catering: ["Traiteur equipe tournage", "Craft service journee", "Dejeuner client", "Petit-dejeuner equipe"],
        equipment: ["Location drone DJI Mavic", "Eclairage supplementaire Profoto", "Location objectif Canon 70-200"],
        props: ["Accessoires decoration set", "Fleurs et plantes plateau", "Maquillage et coiffure mannequins"],
        other: ["Assurance tournage journee", "Permis de tournage mairie", "Impression tirages preview"],
      };

      for (let j = 0; j < numExpenses; j++) {
        const cat = categories[Math.floor(Math.random() * categories.length)];
        const descs = expenseDescs[cat];
        const desc = descs[Math.floor(Math.random() * descs.length)];
        const amounts: Record<string, number[]> = {
          transport: [25, 45, 85, 120, 180, 250],
          location: [800, 1200, 1500, 2000, 2500, 3500],
          catering: [80, 120, 180, 250, 350],
          equipment: [150, 250, 400, 600, 900],
          props: [50, 120, 200, 350, 500],
          other: [100, 200, 350, 500, 750],
        };
        const amount = amounts[cat][Math.floor(Math.random() * amounts[cat].length)];

        await prisma.expense.create({
          data: {
            id: uuid(),
            projectId: project.id,
            userId: allUserIds[Math.floor(Math.random() * allUserIds.length)],
            category: cat,
            description: desc,
            amount,
            date: d(-Math.floor(Math.random() * 50) - 5),
            billable: Math.random() > 0.2,
            invoiced: p.status === "completed" && Math.random() > 0.4,
          },
        });
      }
    }

    console.log(`  [${i + 1}/20] ${p.name} (${p.status})`);
  }

  // 6. Update counters
  await prisma.companySettings.update({
    where: { id: settings.id },
    data: {
      nextQuoteNumber: quoteNum,
      nextInvoiceNumber: invoiceNum,
      nextPaymentNumber: paymentNum,
      nextPONumber: poNum,
    },
  });

  console.log(`\n✅ Demo seed complete!`);
  console.log(`   ${clients.length} clients`);
  console.log(`   ${projects.length} projects`);
  console.log(`   ${quoteNum - (settings.nextQuoteNumber || 1)} quotes`);
  console.log(`   ${invoiceNum - (settings.nextInvoiceNumber || 1)} invoices`);
  console.log(`   Counters updated in CompanySettings`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
