import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePassword, validateIne, hashPassword, generateOtp } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      accountType = 'STUDENT', // 'STUDENT' | 'GENERAL'
      ine,
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      institutionId,
      facultyId,
      academicLevelId,
      filiere,
      region,
      address,
      avatarUrl,
      profession,
      countryCode = 'BF',
    } = body;

    // 1. Mandatory Fields Validation for all accounts
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires (Nom, Prénom, Email, Téléphone, Mot de passe) doivent être renseignés.' },
        { status: 400 }
      );
    }

    // 2. Validate INE strictly if STUDENT account
    let cleanedIne: string | undefined = undefined;
    if (accountType === 'STUDENT') {
      if (!ine || !ine.trim()) {
        return NextResponse.json(
          { error: "L'Identifiant National de l'Étudiant (INE) est obligatoire pour les étudiants burkinabés." },
          { status: 400 }
        );
      }

      const ineValidation = validateIne(ine);
      if (!ineValidation.isValid) {
        return NextResponse.json({ error: ineValidation.message }, { status: 400 });
      }

      cleanedIne = ine.trim().toUpperCase();

      const existingIne = await prisma.user.findUnique({
        where: { ine: cleanedIne },
      });
      if (existingIne) {
        return NextResponse.json(
          { error: 'Cet Identifiant National Étudiant (INE) est déjà associé à un compte.' },
          { status: 409 }
        );
      }
    }

    // 3. Validate Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Veuillez saisir une adresse email valide.' }, { status: 400 });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: 'Cette adresse email est déjà associée à un compte existant.' },
        { status: 409 }
      );
    }

    // 4. Validate Phone Number
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'Ce numéro de téléphone est déjà enregistré sur la plateforme.' },
        { status: 409 }
      );
    }

    // 5. Strict Password Validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: 'Le mot de passe ne respecte pas les critères de sécurité exigés.',
          details: passwordValidation.feedback,
        },
        { status: 400 }
      );
    }

    // 6. Generate Verification OTP (6 digits, valid 10 minutes)
    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const passwordHash = hashPassword(password);

    // 7. Atomic User & Profile & Wallet creation
    const user = await prisma.user.create({
      data: {
        ine: cleanedIne,
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        passwordHash,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        verificationOtp: otp,
        verificationOtpExpiresAt: otpExpiresAt,
        points: 0,
        profile: {
          create: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            displayName: `${firstName.trim()} ${lastName.trim().charAt(0)}.`,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firstName)}`,
            countryCode,
            region: region || 'Centre',
            city: region === 'Hauts-Bassins' ? 'Bobo-Dioulasso' : 'Ouagadougou',
            address: address || (accountType === 'STUDENT' ? 'Campus Universitaire' : 'Ouagadougou'),
            filiere: filiere || (accountType === 'STUDENT' ? 'Études Supérieures' : undefined),
            bio: profession ? `Activité : ${profession}` : (accountType === 'STUDENT' ? 'Étudiant Burkinabé' : 'Membre de la communauté'),
            institutionId: accountType === 'STUDENT' ? (institutionId || undefined) : undefined,
            facultyId: accountType === 'STUDENT' ? (facultyId || undefined) : undefined,
            academicLevelId: accountType === 'STUDENT' ? (academicLevelId || undefined) : undefined,
          },
        },
        wallet: {
          create: {
            availableBalance: 0,
            pendingBalance: 0,
            currency: 'XOF',
            cfPayId: `CF-PAY-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`,
          },
        },
      },
      include: {
        profile: {
          include: {
            institution: true,
            faculty: true,
            academicLevel: true,
          },
        },
        wallet: true,
      },
    });

    // 8. Assign role (STUDENT or CONTRIBUTOR/GENERAL)
    const roleCode = accountType === 'STUDENT' ? 'STUDENT' : 'CONTRIBUTOR';
    const role = await prisma.role.findUnique({ where: { code: roleCode } });
    if (role) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id,
        },
      }).catch(() => {});
    }

    // 9. Dispatch real email notification with OTP
    await sendOtpEmail(user.email || email, `${firstName} ${lastName}`, otp, user.id).catch((err) => {
      console.error('[EMAIL NOTIFICATION DISPATCH ERROR]', err);
    });

    return NextResponse.json({
      success: true,
      message: `Compte créé avec succès. Un code de vérification à 6 chiffres a été envoyé à votre adresse ${email}.`,
      user: {
        id: user.id,
        ine: user.ine,
        email: user.email,
        phoneNumber: user.phoneNumber,
        accountType,
        profile: user.profile,
      },
    });
  } catch (error: any) {
    console.error('API Error /auth/register:', error);
    return NextResponse.json(
      { error: error.message || "Une erreur inattendue est survenue lors de l'inscription." },
      { status: 500 }
    );
  }
}
