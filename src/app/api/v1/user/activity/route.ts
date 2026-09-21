import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (!sessionUserId) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié. Veuillez vous connecter.' },
        { status: 401 }
      );
    }

    // 1. Fetch from ActivityLog table
    const explicitLogs = await prisma.activityLog.findMany({
      where: { userId: sessionUserId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // 2. Fetch user's orders (purchases)
    const orders = await prisma.order.findMany({
      where: { buyerId: sessionUserId, status: 'PAID' },
      include: { resource: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 3. Fetch user's published resources
    const resources = await prisma.academicResource.findMany({
      where: { authorId: sessionUserId },
      include: { accessPolicy: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Merge and format into unified chronological events
    const timeline: any[] = [];

    // Add explicit logs
    for (const log of explicitLogs) {
      timeline.push({
        id: log.id,
        action: log.action,
        title: log.title,
        category: log.category,
        date: log.createdAt,
        metadata: log.metadata ? JSON.parse(log.metadata) : null,
      });
    }

    // Add order purchases if not already captured
    for (const order of orders) {
      const alreadyHas = timeline.some(
        (t) => t.action === 'RESOURCE_PURCHASED' && t.metadata?.orderId === order.id
      );
      if (!alreadyHas) {
        timeline.push({
          id: `order-${order.id}`,
          action: 'RESOURCE_PURCHASED',
          title: `Acquisition document : ${order.resource.title}`,
          category: 'COMMERCE',
          date: order.createdAt,
          metadata: {
            orderNumber: order.orderNumber,
            amount: order.grossAmount,
            resourceTitle: order.resource.title,
          },
        });
      }
    }

    // Add publication events
    for (const res of resources) {
      const alreadyHas = timeline.some(
        (t) => t.action === 'RESOURCE_PUBLISHED' && t.metadata?.resourceId === res.id
      );
      if (!alreadyHas) {
        timeline.push({
          id: `res-${res.id}`,
          action: 'RESOURCE_PUBLISHED',
          title: `Soumission pédagogique : ${res.title}`,
          category: 'ACADEMIC',
          date: res.createdAt,
          metadata: {
            resourceId: res.id,
            validationStatus: res.validationStatus,
            price: res.accessPolicy?.priceAmount || 0,
          },
        });
      }
    }

    // Sort chronologically descending
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      success: true,
      timeline,
    });
  } catch (error: any) {
    console.error('Error GET /api/v1/user/activity:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors du chargement de l'historique d'activité." },
      { status: 500 }
    );
  }
}
