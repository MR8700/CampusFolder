import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validatePassword, validateIne, hashPassword, generateOtp } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
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
      countryCode = 'BF',
    } = body;

    // 1. Mandatory Fields Validation
    if (!ine || !firstName || !lastName || !email || !phoneNumber || !password) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires (INE, Nom, Prénom, Email, Téléphone, Mot de passe) doivent être renseignés.' },
        { status: 400 }
      );
    }

    // 2. Validate INE
    const ineValidation = validateIne(ine);
    if (!ineValidation.isValid) {
      return NextResponse.json({ error: ineValidation.message }, { status: 400 });
    }

    const existingIne = await prisma.user.findUnique({
      where: { ine: ine.trim().toUpperCase() },
    });
    if (existingIne) {
      return NextResponse.json(
        { error: 'Cet Identifiant National Étudiant (INE) est déjà associé à un compte.' },
        { status: 409 }
      );
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
        { error: 'Cette adresse email est déjà utilisée.' },
        { status: 409 }
      );
    }

    // 4. Validate Phone Number
    const existingPhone = await prisma.user.findUnique({
      where: { phoneNumber: phoneNumber.trim() },
    });
    if (existingPhone) {
      return NextResponse.json(
        { error: 'Ce numéro de téléphone est déjà enregistré.' },
        { status: 409 }
      );
    }

    // 5. Strict Password Validation (8+ chars, no repetition, maj, min, num, special, 0 space)
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
        ine: ine.trim().toUpperCase(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber.trim(),
        passwordHash,
        status: 'PENDING_VERIFICATION',
        emailVerified: false,
        verificationOtp: otp,
        verificationOtpExpiresAt: otpExpiresAt,
        points: 0, // Règle stricte Campus Folder : Tout nouveau sur la plateforme a 0 pts
        profile: {
          create: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            displayName: `${firstName.trim()} ${lastName.trim().charAt(0)}.`,
            avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(firstName)}`,
            countryCode,
            region: region || 'Centre',
            city: region === 'Hauts-Bassins' ? 'Bobo-Dioulasso' : 'Ouagadougou',
            address: address || 'Campus principal',
            filiere: filiere || 'Linguistique Générale',
            institutionId: institutionId || undefined,
            facultyId: facultyId || undefined,
            academicLevelId: academicLevelId || undefined,
          },
        },
        wallet: {
          create: {
            availableBalance: 0,
            pendingBalance: 0,
            currency: 'XOF',
            cfPayId: `CF-PAY-${ine.trim().toUpperCase().substring(0, 8)}`,
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

    console.log(`[CAMPUS_FOLDER_AUTH] Code OTP de vérification généré pour ${email}: ${otp}`);

    // Dispatch real/audited academic email notification
    await sendOtpEmail(user.email || email, `${firstName} ${lastName}`, otp, user.id).catch((err) => {
      console.error('[EMAIL NOTIFICATION DISPATCH ERROR]', err);
    });

    return NextResponse.json({
      success: true,
      message: `Code de vérification envoyé à ${email}.`,
      userId: user.id,
      email: user.email,
      otpPreview: otp, // For local test and demonstration
    });
  } catch (error: any) {
    console.error('API Error /auth/register:', error);
    return NextResponse.json(
      { error: "Erreur lors de l'enregistrement du compte étudiant." },
      { status: 500 }
    );
  }
}
