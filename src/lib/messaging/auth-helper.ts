import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function getSessionUser() {
  try {
    const cookieStore = await cookies();
    const sessionUserId = cookieStore.get('campus_user_id')?.value;

    if (sessionUserId) {
      const user = await prisma.user.findUnique({
        where: { id: sessionUserId },
        include: {
          profile: true,
          wallet: true,
          roles: { include: { role: true } },
        },
      });

      if (user && user.status === 'ACTIVE') {
        return user;
      }
    }

    // Fallback in dev/demo: Use default student Aminata or first active user
    let defaultUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'aminata.sawadogo@campusfolder.bf' },
          { email: 'aminata@campusfolder.bf' },
          { id: 'user-aminata' },
        ],
      },
      include: {
        profile: true,
        wallet: true,
        roles: { include: { role: true } },
      },
    });

    if (!defaultUser) {
      defaultUser = await prisma.user.findFirst({
        where: { status: 'ACTIVE' },
        include: {
          profile: true,
          wallet: true,
          roles: { include: { role: true } },
        },
      });
    }

    return defaultUser;
  } catch (err) {
    console.error('Session resolution error:', err);
    return null;
  }
}
