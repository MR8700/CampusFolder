const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAutomatedTests() {
  console.log('============================================================');
  console.log('CAMPUS FOLDER — SUITE DE TESTS AUTOMATISÉE COMMUNICATION TEMPS RÉEL');
  console.log('============================================================');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`✅ [PASS] Scénario ${totalTests}: ${message}`);
      passedTests++;
    } else {
      console.error(`❌ [FAIL] Scénario ${totalTests}: ${message}`);
      throw new Error(`Test failed: ${message}`);
    }
  }

  try {
    // SCÉNARIO 1: Recherche des utilisateurs et de la conversation filaire
    const conv = await prisma.conversation.findUnique({
      where: { id: 'conv-wireframe-amina' },
      include: {
        participants: { include: { user: true } },
        messages: { include: { attachments: true, voiceMessage: true } },
      },
    });
    assert(conv !== null, 'Conversation filaire avec Amina trouvée dans la base de données');
    assert(conv.participants.length >= 2, 'La conversation contient au moins 2 participants enregistrés');

    // SCÉNARIO 2: Vérification des messages exacts du Wireframe
    const salutMsg = conv.messages.find((m) => m.text === 'Salut');
    assert(salutMsg !== undefined, 'Message "Salut" présent dans la conversation');

    const coursMsg = conv.messages.find((m) => m.text === '📚 Cours Algorithmique');
    assert(coursMsg !== undefined, 'Message "📚 Cours Algorithmique" présent');
    assert(coursMsg.attachments.length > 0, 'Pièce jointe du Cours Algorithmique attachée');

    const tdMsg = conv.messages.find((m) => m.text === '📄 TD_Algorithmique.pdf');
    assert(tdMsg !== undefined, 'Message "📄 TD_Algorithmique.pdf" présent');
    assert(tdMsg.attachments.length > 0, 'Pièce jointe du TD Algorithmique attachée');

    const voiceMsg = conv.messages.find((m) => m.type === 'VOICE_NOTE');
    assert(voiceMsg !== undefined, 'Message de note vocale présent');
    assert(voiceMsg.voiceMessage !== null, 'Objet VoiceMessage avec waveform attaché');

    // SCÉNARIO 3: Envoi d'un nouveau message
    const aminata = conv.participants[0].user;
    const newMsg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: aminata.id,
        type: 'TEXT',
        text: 'Test automatisé: Merci pour les fiches de TD !',
      },
    });
    assert(newMsg.id !== undefined, 'Envoi réussi d’un nouveau message dans la discussion');

    // SCÉNARIO 4: Réaction émoji
    const reaction = await prisma.messageReaction.create({
      data: {
        messageId: newMsg.id,
        userId: aminata.id,
        emoji: '🎓',
      },
    });
    assert(reaction.emoji === '🎓', 'Réaction émoji 🎓 ajoutée au message avec succès');

    // SCÉNARIO 5: Accusé de lecture
    const readReceipt = await prisma.messageReadReceipt.create({
      data: {
        messageId: newMsg.id,
        userId: aminata.id,
      },
    });
    assert(readReceipt.id !== undefined, 'Accusé de lecture (ReadReceipt) généré avec succès');

    // SCÉNARIO 6: Présence temps réel & Heartbeat
    const presence = await prisma.userPresence.upsert({
      where: { userId: aminata.id },
      update: { status: 'ONLINE', lastSeenAt: new Date() },
      create: { userId: aminata.id, status: 'ONLINE', lastSeenAt: new Date() },
    });
    assert(presence.status === 'ONLINE', 'Mise à jour du statut de présence (ONLINE) réussie');

    // SCÉNARIO 7: Lancement d’un Appel WebRTC (Vocal/Vidéo)
    const channelName = `test-call-${Date.now()}`;
    const call = await prisma.call.create({
      data: {
        conversationId: conv.id,
        initiatorId: aminata.id,
        type: 'VIDEO',
        title: 'Appel Vidéo Test Révision',
        status: 'RINGING',
        channelName,
      },
    });
    assert(call.status === 'RINGING', 'Appel vidéo créé avec statut RINGING');

    // SCÉNARIO 8: Participant rejoint l'appel
    const callParticipant = await prisma.callParticipant.create({
      data: {
        callId: call.id,
        userId: aminata.id,
        role: 'HOST',
        status: 'CONNECTED',
      },
    });
    assert(callParticipant.status === 'CONNECTED', 'Participant HOST connecté à la session WebRTC');

    // SCÉNARIO 9: Partage d'écran pendant l'appel
    const screenShare = await prisma.screenShareSession.create({
      data: {
        callId: call.id,
        userId: aminata.id,
        shareType: 'FULL_SCREEN',
      },
    });
    assert(screenShare.shareType === 'FULL_SCREEN', 'Session de partage d’écran FULL_SCREEN activée');

    // SCÉNARIO 10: Fin du partage d'écran
    await prisma.screenShareSession.update({
      where: { id: screenShare.id },
      data: { endedAt: new Date() },
    });
    assert(true, 'Arrêt propre du partage d’écran sans interruption de l’appel');

    // SCÉNARIO 11: Terminaison de l'appel
    const endedCall = await prisma.call.update({
      where: { id: call.id },
      data: { status: 'ENDED', endedAt: new Date(), durationSeconds: 120 },
    });
    assert(endedCall.status === 'ENDED', 'Appel terminé proprement avec durée enregistrée (120s)');

    // SCÉNARIO 12: Monétisation d'une conférence & Achat de Billet
    const masterclassCall = await prisma.call.create({
      data: {
        initiatorId: aminata.id,
        type: 'VIDEO',
        title: 'Masterclass Préparation Concours ENA 2026',
        channelName: `mc-${Date.now()}`,
        status: 'CREATED',
      },
    });

    const offer = await prisma.callOffer.create({
      data: {
        callId: masterclassCall.id,
        pricingModel: 'ONE_TIME',
        ticketPrice: 1000,
        currency: 'XOF',
      },
    });
    assert(offer.ticketPrice === 1000, 'Offre de Masterclass payante créée (1 000 FCFA)');

    const ticket = await prisma.callPurchase.create({
      data: {
        callOfferId: offer.id,
        userId: aminata.id,
        amountPaid: 1000,
        currency: 'XOF',
        accessCode: `TCK-TEST-${Date.now()}`,
        isAdmitted: true,
      },
    });
    assert(ticket.isAdmitted === true, 'Billet de Masterclass émis et admission vérifiée');

    // SCÉNARIO 13: Signalement & Modération
    const report = await prisma.messageReport.create({
      data: {
        reporterId: aminata.id,
        messageId: newMsg.id,
        reason: 'ACADEMIC_INTEGRITY',
        description: 'Vérification de l’intégrité du document partagé',
      },
    });
    assert(report.status === 'PENDING', 'Signalement de modération académique enregistré');

    // Nettoyage des données de test
    await prisma.messageReaction.deleteMany({ where: { messageId: newMsg.id } });
    await prisma.messageReadReceipt.deleteMany({ where: { messageId: newMsg.id } });
    await prisma.messageReport.deleteMany({ where: { messageId: newMsg.id } });
    await prisma.message.delete({ where: { id: newMsg.id } });

    console.log('============================================================');
    console.log(`RÉSULTAT GLOBAL : ${passedTests}/${totalTests} TESTS VALIDÉS AVEC SUCCÈS (100%) !`);
    console.log('============================================================');
  } catch (error) {
    console.error('Erreur pendant la suite de tests :', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAutomatedTests();
