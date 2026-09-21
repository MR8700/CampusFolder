import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    let user = null;
    if (sessionUserId) {
      user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        select: {
          id: true,
          email: true,
          notifyEmailAll: true,
          notifyOnPurchase: true,
          notifyOnSale: true,
          notifyOnDownload: true,
          notifyOnPublish: true,
          notifyOnWithdrawal: true,
        },
      });
    }

    if (!user) {
      // Default demo session: Aminata
      user = await prisma.user.findFirst({
        where: { email: 'aminata@campusfolder.bf' },
        select: {
          id: true,
          email: true,
          notifyEmailAll: true,
          notifyOnPurchase: true,
          notifyOnSale: true,
          notifyOnDownload: true,
          notifyOnPublish: true,
          notifyOnWithdrawal: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const whereClause: any = {
      OR: [{ userId: user.id }, { recipient: user.email! }],
    };

    // Fetch user notifications history
    const notifications = await prisma.emailNotification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const unreadCount = await prisma.emailNotification.count({
      where: {
        ...whereClause,
        isRead: false,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: {
        notifyEmailAll: user.notifyEmailAll,
        notifyOnPurchase: user.notifyOnPurchase,
        notifyOnSale: user.notifyOnSale,
        notifyOnDownload: user.notifyOnDownload,
        notifyOnPublish: user.notifyOnPublish,
        notifyOnWithdrawal: user.notifyOnWithdrawal,
      },
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('API Error /user/notifications (GET):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;
    const body = await req.json();

    const user = await prisma.user.findFirst({
      where: sessionUserId ? { id: sessionUserId } : { email: 'aminata@campusfolder.bf' },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const whereClause: any = {
      OR: [{ userId: user.id }, { recipient: user.email! }],
    };

    // 1. Mark single notification as read
    if (body.action === 'MARK_READ' && body.notificationId) {
      await prisma.emailNotification.updateMany({
        where: {
          id: body.notificationId,
          ...whereClause,
        },
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Notification marquée comme lue.' });
    }

    // 2. Mark all notifications as read
    if (body.action === 'MARK_ALL_READ') {
      await prisma.emailNotification.updateMany({
        where: whereClause,
        data: { isRead: true },
      });
      return NextResponse.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues.' });
    }

    // 3. Otherwise, update email preferences
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        notifyEmailAll: body.notifyEmailAll !== undefined ? Boolean(body.notifyEmailAll) : undefined,
        notifyOnPurchase: body.notifyOnPurchase !== undefined ? Boolean(body.notifyOnPurchase) : undefined,
        notifyOnSale: body.notifyOnSale !== undefined ? Boolean(body.notifyOnSale) : undefined,
        notifyOnDownload: body.notifyOnDownload !== undefined ? Boolean(body.notifyOnDownload) : undefined,
        notifyOnPublish: body.notifyOnPublish !== undefined ? Boolean(body.notifyOnPublish) : undefined,
        notifyOnWithdrawal: body.notifyOnWithdrawal !== undefined ? Boolean(body.notifyOnWithdrawal) : undefined,
      },
      select: {
        notifyEmailAll: true,
        notifyOnPurchase: true,
        notifyOnSale: true,
        notifyOnDownload: true,
        notifyOnPublish: true,
        notifyOnWithdrawal: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Préférences de notifications mises à jour avec succès.',
      preferences: updated,
    });
  } catch (error) {
    console.error('API Error /user/notifications (PATCH):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;
    const body = await req.json().catch(() => ({}));

    const user = await prisma.user.findFirst({
      where: sessionUserId ? { id: sessionUserId } : { email: 'aminata@campusfolder.bf' },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const whereClause: any = {
      OR: [{ userId: user.id }, { recipient: user.email! }],
    };

    // 1. Delete all notifications
    if (body.all) {
      const res = await prisma.emailNotification.deleteMany({
        where: whereClause,
      });
      return NextResponse.json({
        success: true,
        message: `${res.count} notification(s) supprimée(s) avec succès.`,
      });
    }

    // 2. Delete single notification
    if (body.notificationId) {
      await prisma.emailNotification.deleteMany({
        where: {
          id: body.notificationId,
          ...whereClause,
        },
      });
      return NextResponse.json({
        success: true,
        message: 'Notification effacée avec succès.',
      });
    }

    return NextResponse.json({ error: 'Identifiant de notification ou action globale requis.' }, { status: 400 });
  } catch (error) {
    console.error('API Error /user/notifications (DELETE):', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

