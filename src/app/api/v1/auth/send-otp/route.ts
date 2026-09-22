import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateOtp } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Adresse email requise.' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase().trim() },
      include: { profile: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationOtp: otp,
        verificationOtpExpiresAt: otpExpiresAt,
      },
    });

    console.log(`[CAMPUS_FOLDER_AUTH] Nouveau code OTP pour ${email}: ${otp}`);

    // Dispatch real/audited academic email
    const studentName = user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Étudiant';
    await sendOtpEmail(user.email!, studentName, otp, user.id).catch((err) => {
      console.error('[EMAIL NOTIFICATION DISPATCH ERROR]', err);
    });

    return NextResponse.json({
      success: true,
      message: 'Un nouveau code de vérification vous a été envoyé.',
    });
  } catch (error) {
    console.error('API Error /auth/send-otp:', error);
    return NextResponse.json(
      { error: "Impossible d'envoyer le code de vérification." },
      { status: 500 }
    );
  }
}
