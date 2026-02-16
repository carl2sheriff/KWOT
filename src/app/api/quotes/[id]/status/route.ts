import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/api-middleware';

// PATCH /api/quotes/[id]/status - Update quote status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'PENDING', 'NEGOTIATION'];
    if (!status || !validStatuses.includes(status)) {
      return apiError('Invalid status', 400);
    }

    const quote = await prisma.quote.update({
      where: { id },
      data: { status: status as any },
      select: {
        id: true,
        reference: true,
        status: true,
        total: true,
      },
    });

    return apiSuccess({
      message: 'Status updated',
      quote,
    });
  } catch (error) {
    console.error('Update quote status error:', error);
    return apiError('Failed to update status', 500);
  }
}
