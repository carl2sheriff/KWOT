import { prisma } from '@/lib/db';
import PipelineClient from './PipelineClient';

async function getPipelineData() {
  try {
    const quotes = await prisma.quote.findMany({
      select: {
        id: true,
        reference: true,
        status: true,
        total: true,
        createdAt: true,
        client: {
          select: {
            name: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return quotes;
  } catch (error) {
    console.error('Failed to fetch pipeline data:', error);
    return [];
  }
}

export default async function PipelinePage() {
  const quotes = await getPipelineData();

  // Transform to Kanban format
  const quotesByStage: Record<string, {
    id: string;
    title: string;
    client: string;
    amount: number;
    date: string;
    status: string;
  }[]> = {};

  quotes.forEach((quote) => {
    const stage = quote.status.toLowerCase();
    if (!quotesByStage[stage]) {
      quotesByStage[stage] = [];
    }
    quotesByStage[stage].push({
      id: quote.id,
      title: `${quote.client?.company || quote.client?.name || 'Sans client'} - ${quote.reference}`,
      client: quote.client?.company || quote.client?.name || 'Sans client',
      amount: Number(quote.total),
      date: new Date(quote.createdAt).toLocaleDateString('fr-FR'),
      status: quote.status,
    });
  });

  const totalAmount = quotes.reduce((sum, q) => sum + Number(q.total), 0);
  const wonQuotes = quotesByStage['accepted'] || [];
  const wonAmount = wonQuotes.reduce((sum, q) => sum + q.amount, 0);

  return (
    <PipelineClient 
      initialQuotesByStage={quotesByStage}
      totalAmount={totalAmount}
      wonAmount={wonAmount}
    />
  );
}
