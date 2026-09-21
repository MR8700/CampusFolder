import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const adminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isSuperAdmin: true },
          { roles: { some: { role: { code: 'ADMIN' } } } },
        ],
      },
      include: {
        profile: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      admins: adminUsers.map((u) => ({
        id: u.id,
        email: u.email,
        phoneNumber: u.phoneNumber,
        isSuperAdmin: u.isSuperAdmin,
        isSuspended: u.isSuspended,
        status: u.status,
        createdAt: u.createdAt,
        name: u.profile ? `${u.profile.firstName} ${u.profile.lastName}` : u.email,
        roles: u.roles.map((r) => r.role.code),
      })),
    });
  } catch (error) {
    console.error('API Error /admin/admins (GET):', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des administrateurs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, firstName, lastName, phoneNumber, isSuperAdmin } = body;

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, mot de passe, nom et prénom sont obligatoires pour créer un administrateur.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà.' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = hashPassword(password);

    // Get or create ADMIN role
    let adminRole = await prisma.role.findUnique({
      where: { code: 'ADMIN' },
    });

    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          code: 'ADMIN',
          name: 'Administrateur',
          description: 'Gestion des universités, des validations et de la modération',
        },
      });
    }

    // Create user and profile
    const newUser = await prisma.user.create({
      data: {
        email,
        phoneNumber: phoneNumber || null,
        passwordHash,
        status: 'ACTIVE',
        isSuperAdmin: Boolean(isSuperAdmin),
        emailVerified: true,
        profile: {
          create: {
            firstName,
            lastName,
            displayName: `${firstName} ${lastName}`,
            avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBC6eY32kQ-5_pB7gD8b14A89XlT41B2_1ZfLq',
            city: 'Ouagadougou',
            region: 'Centre',
          },
        },
        roles: {
          create: {
            roleId: adminRole.id,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Administrateur ${firstName} ${lastName} créé avec succès.`,
      admin: {
        id: newUser.id,
        email: newUser.email,
        name: `${firstName} ${lastName}`,
        isSuperAdmin: newUser.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('API Error /admin/admins (POST):', error);
    return NextResponse.json({ error: 'Erreur lors de la création de l’administrateur' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { adminId, isSuspended, isSuperAdmin } = body;

    if (!adminId) {
      return NextResponse.json({ error: 'ID administrateur requis' }, { status: 400 });
    }

    const data: any = {};
    if (typeof isSuspended === 'boolean') {
      data.isSuspended = isSuspended;
      data.status = isSuspended ? 'SUSPENDED' : 'ACTIVE';
    }
    if (typeof isSuperAdmin === 'boolean') {
      data.isSuperAdmin = isSuperAdmin;
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data,
    });

    return NextResponse.json({
      success: true,
      message: 'Statut administrateur mis à jour avec succès.',
      admin: updated,
    });
  } catch (error) {
    console.error('API Error /admin/admins (PATCH):', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de l’administrateur' }, { status: 500 });
  }
}
