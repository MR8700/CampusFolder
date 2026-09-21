import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPurchaseConfirmationEmail, sendSaleNotificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resourceId, paymentMethod, payerPhone } = body;

    if (!resourceId || !paymentMethod) {
      return NextResponse.json({ error: 'Ressource et mode de paiement requis' }, { status: 400 });
    }

    // Current buyer: Aminata Sanogo
    const buyer = await prisma.user.findFirst({
      where: { email: 'aminata@campusfolder.bf' },
      include: { wallet: true, profile: true },
    });

    if (!buyer) {
      return NextResponse.json({ error: 'Acheteur non identifié' }, { status: 401 });
    }

    const resource = await prisma.academicResource.findUnique({
      where: { id: resourceId },
      include: {
        accessPolicy: true,
        author: {
          include: { wallet: true, profile: true },
        },
      },
    });

    if (!resource) {
      return NextResponse.json({ error: 'Ressource introuvable' }, { status: 404 });
    }

    const price = resource.accessPolicy?.priceAmount || 0;

    // If payment method is CAMPUS_WALLET, check balance
    if (paymentMethod === 'CAMPUS_WALLET') {
      if (!buyer.wallet || buyer.wallet.availableBalance < price) {
        return NextResponse.json(
          { error: 'Solde portefeuille insuffisant pour effectuer cet achat.' },
          { status: 400 }
        );
      }
    }

    const orderNumber = `CF-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    // Execute atomic transaction for order, revenue distribution, ledger, and entitlement
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const order = await tx.order.create({
        data: {
          orderNumber,
          buyerId: buyer.id,
          resourceId: resource.id,
          grossAmount: price,
          currency: 'XOF',
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      // 2. Create Payment Record
      await tx.payment.create({
        data: {
          orderId: order.id,
          method: paymentMethod,
          amount: price,
          payerPhone: payerPhone || buyer.phoneNumber,
          operatorTransactionId: `TXN-${Date.now()}`,
          status: 'SUCCESS',
        },
      });

      // 3. Calculate 85% / 15% split
      const platformShare = Math.round(price * 0.15);
      const authorShare = price - platformShare;

      // 4. Record Revenue Distribution
      await tx.revenueDistribution.create({
        data: {
          orderId: order.id,
          contributorId: resource.authorId,
          grossAmount: price,
          platformAmount: platformShare,
          contributorAmount: authorShare,
          isSettled: true,
          settledAt: new Date(),
        },
      });

      // 5. Credit Author Wallet & Ledger
      let authorWallet = resource.author.wallet;
      if (!authorWallet) {
        authorWallet = await tx.wallet.create({
          data: {
            userId: resource.authorId,
            availableBalance: 0,
            currency: 'XOF',
          },
        });
      }

      const newAuthorBal = authorWallet.availableBalance + authorShare;
      await tx.wallet.update({
        where: { id: authorWallet.id },
        data: { availableBalance: newAuthorBal },
      });

      await tx.ledgerEntry.create({
        data: {
          walletId: authorWallet.id,
          entryType: 'SALE_REVENUE',
          direction: 'CREDIT',
          amount: authorShare,
          balanceAfter: newAuthorBal,
          referenceId: order.id,
          description: `Vente ${resource.title} (Brut ${price} F, Commission 15% -${platformShare} F) • Acheteur #${buyer.id.substring(0, 5)}`,
        },
      });

      // 6. Debit Buyer Wallet if CAMPUS_WALLET
      if (paymentMethod === 'CAMPUS_WALLET' && buyer.wallet) {
        const newBuyerBal = buyer.wallet.availableBalance - price;
        await tx.wallet.update({
          where: { id: buyer.wallet.id },
          data: { availableBalance: newBuyerBal },
        });

        await tx.ledgerEntry.create({
          data: {
            walletId: buyer.wallet.id,
            entryType: 'ORDER_PURCHASE',
            direction: 'DEBIT',
            amount: price,
            balanceAfter: newBuyerBal,
            referenceId: order.id,
            description: `Achat document : ${resource.title}`,
          },
        });
      }

      // 7. Grant Entitlement & Download Token
      const downloadToken = `CF-${Math.floor(1000 + Math.random() * 9000)}-UJKZ-SSL`;
      const entitlement = await tx.entitlement.create({
        data: {
          userId: buyer.id,
          resourceId: resource.id,
          orderId: order.id,
          downloadToken,
          tokenExpiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
          downloadCount: 1,
        },
      });

      // 8. Update Resource stats
      await tx.academicResource.update({
        where: { id: resource.id },
        data: {
          downloadsCount: { increment: 1 },
        },
      });

      return {
        order,
        entitlement,
        downloadToken,
        authorShare,
        newAuthorBal,
        newBuyerBalance: buyer.wallet ? buyer.wallet.availableBalance - (paymentMethod === 'CAMPUS_WALLET' ? price : 0) : 0,
      };
    });

    // 1. Dispatch Email Receipt to Buyer ("s'il accepte")
    if (buyer.email) {
      sendPurchaseConfirmationEmail({
        userId: buyer.id,
        to: buyer.email,
        studentName: buyer.profile ? `${buyer.profile.firstName} ${buyer.profile.lastName}` : 'Étudiant',
        resourceTitle: resource.title,
        amount: price,
        orderNumber,
        downloadToken: result.downloadToken,
      }).catch((err) => console.error('[EMAIL ERROR - BUYER RECEIPT]', err));
    }

    // 2. Dispatch Sale & Wallet Credit Notification to Author ("s'il accepte")
    if (resource.author?.email) {
      sendSaleNotificationEmail({
        authorId: resource.authorId,
        to: resource.author.email,
        authorName: resource.author.profile
          ? `${resource.author.profile.firstName} ${resource.author.profile.lastName}`
          : 'Auteur',
        resourceTitle: resource.title,
        grossAmount: price,
        authorNetShare: result.authorShare,
        buyerDisplayName: buyer.profile?.displayName || 'Camarade amphi',
        newBalance: result.newAuthorBal,
      }).catch((err) => console.error('[EMAIL ERROR - AUTHOR SALE]', err));
    }

    return NextResponse.json({
      success: true,
      message: 'Paiement confirmé et document débloqué',
      order: result.order,
      downloadToken: result.downloadToken,
      newBalance: result.newBuyerBalance,
    });
  } catch (error) {
    console.error('API Error /orders/checkout:', error);
    return NextResponse.json({ error: 'Échec de la transaction' }, { status: 500 });
  }
}
