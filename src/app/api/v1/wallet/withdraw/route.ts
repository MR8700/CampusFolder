import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWithdrawalReceiptEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { amount, method, destinationPhone } = body;

    const withdrawAmount = Number(amount);
    if (!withdrawAmount || withdrawAmount < 500) {
      return NextResponse.json({ error: 'Montant de retrait minimum : 500 FCFA' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email: 'moussa@ujkz.bf' },
      include: { wallet: true, profile: true },
    });

    if (!user || !user.wallet) {
      return NextResponse.json({ error: 'Portefeuille introuvable' }, { status: 404 });
    }

    if (user.wallet.availableBalance < withdrawAmount) {
      return NextResponse.json({ error: 'Solde insuffisant pour ce retrait' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const newBal = user.wallet!.availableBalance - withdrawAmount;

      await tx.wallet.update({
        where: { id: user.wallet!.id },
        data: { availableBalance: newBal },
      });

      const withdrawal = await tx.withdrawal.create({
        data: {
          walletId: user.wallet!.id,
          amount: withdrawAmount,
          method: method || 'ORANGE_MONEY',
          destinationPhone: destinationPhone || '+226 70 12 34 12',
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      const ledger = await tx.ledgerEntry.create({
        data: {
          walletId: user.wallet!.id,
          entryType: 'WITHDRAWAL',
          direction: 'DEBIT',
          amount: withdrawAmount,
          balanceAfter: newBal,
          referenceId: withdrawal.id,
          description: `Retrait ${method || 'Orange Money'} vers ${destinationPhone || '+226 70 ** ** 12'}`,
        },
      });

      return { newBal, withdrawal, ledger };
    });

    // Dispatch withdrawal receipt email ("s'il accepte")
    if (user.email) {
      sendWithdrawalReceiptEmail({
        userId: user.id,
        to: user.email,
        studentName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Étudiant',
        amount: withdrawAmount,
        operator: method || 'Orange Money Burkina',
        phone: destinationPhone || '+226 70 12 34 12',
        withdrawalRef: updated.withdrawal.id,
      }).catch((err) => console.error('[EMAIL ERROR - WITHDRAWAL RECEIPT]', err));
    }

    return NextResponse.json({
      success: true,
      message: `Retrait de ${withdrawAmount} FCFA effectué vers ${method}`,
      newBalance: updated.newBal,
      withdrawal: updated.withdrawal,
    });
  } catch (error) {
    console.error('API Error /wallet/withdraw:', error);
    return NextResponse.json({ error: 'Erreur lors du retrait' }, { status: 500 });
  }
}
