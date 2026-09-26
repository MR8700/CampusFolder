const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMessaging() {
  console.log('--- Seeding CampusFolder Messaging, Calls & Conversations ---');

  // 1. Identify users
  const aminata = await prisma.user.findFirst({
    where: {
      OR: [
        { id: 'user-aminata' },
        { email: 'aminata@campusfolder.bf' },
        { email: 'aminata.sawadogo@campusfolder.bf' },
      ],
    },
    include: { profile: true },
  });

  const moussa = await prisma.user.findFirst({
    where: {
      OR: [
        { id: 'user-moussa' },
        { email: 'moussa@ujkz.bf' },
      ],
    },
    include: { profile: true },
  });

  const idriss = await prisma.user.findFirst({
    where: {
      OR: [
        { id: 'user-idriss' },
        { email: 'idriss@ujkz.bf' },
      ],
    },
    include: { profile: true },
  });

  if (!aminata) {
    console.error('Aminata user not found in database.');
    return;
  }

  const interlocutor = moussa || idriss;
  if (!interlocutor) {
    console.error('No secondary user found.');
    return;
  }

  // 2. Fetch Algorithmique resource
  const algoResource = await prisma.academicResource.findFirst({
    where: {
      OR: [
        { id: 'res-algo-l2' },
        { slug: 'l2-info-algorithmique-avancee-arbres' },
      ],
    },
    include: { accessPolicy: true, faculty: true },
  });

  // 3. Create or Update Direct Conversation 1: Aminata (Exact Wireframe from User)
  const wireframeConv = await prisma.conversation.upsert({
    where: { id: 'conv-wireframe-amina' },
    update: { updatedAt: new Date() },
    create: {
      id: 'conv-wireframe-amina',
      type: 'DIRECT',
      title: 'Amina',
      status: 'ACTIVE',
      createdById: aminata.id,
      participants: {
        create: [
          { userId: aminata.id, role: 'OWNER' },
          { userId: interlocutor.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: wireframeConv.id, userId: aminata.id } },
    update: {},
    create: { conversationId: wireframeConv.id, userId: aminata.id, role: 'OWNER' },
  });
  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId: wireframeConv.id, userId: interlocutor.id } },
    update: {},
    create: { conversationId: wireframeConv.id, userId: interlocutor.id, role: 'MEMBER' },
  });

  // Message 1: "Salut"
  const msg1 = await prisma.message.upsert({
    where: { id: 'msg-wireframe-01' },
    update: {},
    create: {
      id: 'msg-wireframe-01',
      conversationId: wireframeConv.id,
      senderId: aminata.id,
      type: 'TEXT',
      text: 'Salut',
      sentAt: new Date(Date.now() - 3600 * 1000 * 2),
      status: 'READ',
    },
  });

  // Message 2: "📚 Cours Algorithmique" with attachment [Ouvrir]
  const msg2 = await prisma.message.upsert({
    where: { id: 'msg-wireframe-02' },
    update: {},
    create: {
      id: 'msg-wireframe-02',
      conversationId: wireframeConv.id,
      senderId: aminata.id,
      type: 'RESOURCE',
      text: '📚 Cours Algorithmique',
      sentAt: new Date(Date.now() - 3600 * 1000 * 1.5),
      status: 'READ',
    },
  });

  await prisma.messageAttachment.upsert({
    where: { id: 'att-wireframe-01' },
    update: {},
    create: {
      id: 'att-wireframe-01',
      messageId: msg2.id,
      attachmentType: 'RESOURCE',
      url: algoResource ? `/ressources/${algoResource.slug}` : '/explorer',
      fileName: 'Cours_Algorithmique.pdf',
      thumbnailUrl: algoResource?.thumbnailUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80',
      resourceId: algoResource?.id || null,
      accessSnapshot: JSON.stringify({
        id: algoResource?.id || 'res-algo-l2',
        title: algoResource?.title || 'Cours Algorithmique Avancée & Arbres (L2)',
        slug: algoResource?.slug || 'l2-info-algorithmique-avancee-arbres',
        facultyName: algoResource?.faculty?.name || 'UFR Sciences Exactes (SEA)',
        isPaid: false,
        priceAmount: 0,
        currency: 'XOF',
        thumbnailUrl: algoResource?.thumbnailUrl || 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&auto=format&fit=crop&q=80',
        pageCount: 16,
      }),
    },
  });

  // Message 3: "📄 TD_Algorithmique.pdf" with attachment [Ouvrir]
  const msg3 = await prisma.message.upsert({
    where: { id: 'msg-wireframe-03' },
    update: {},
    create: {
      id: 'msg-wireframe-03',
      conversationId: wireframeConv.id,
      senderId: aminata.id,
      type: 'RESOURCE',
      text: '📄 TD_Algorithmique.pdf',
      sentAt: new Date(Date.now() - 3600 * 1000 * 1),
      status: 'READ',
    },
  });

  await prisma.messageAttachment.upsert({
    where: { id: 'att-wireframe-02' },
    update: {},
    create: {
      id: 'att-wireframe-02',
      messageId: msg3.id,
      attachmentType: 'RESOURCE',
      url: algoResource ? `/ressources/${algoResource.slug}` : '/explorer',
      fileName: 'TD_Algorithmique.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80',
      resourceId: algoResource?.id || null,
      accessSnapshot: JSON.stringify({
        id: algoResource?.id || 'res-algo-l2',
        title: 'TD Algorithmique & Corrigés Types',
        slug: algoResource?.slug || 'l2-info-algorithmique-avancee-arbres',
        facultyName: 'UFR Sciences Exactes (SEA)',
        isPaid: false,
        priceAmount: 0,
        currency: 'XOF',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=500&auto=format&fit=crop&q=80',
        pageCount: 8,
      }),
    },
  });

  // Message 4: Voice Note
  const msg4 = await prisma.message.upsert({
    where: { id: 'msg-wireframe-04' },
    update: {},
    create: {
      id: 'msg-wireframe-04',
      conversationId: wireframeConv.id,
      senderId: aminata.id,
      type: 'VOICE_NOTE',
      text: '🎙 Note vocale (28s)',
      sentAt: new Date(Date.now() - 3600 * 1000 * 0.4),
      status: 'READ',
    },
  });

  await prisma.voiceMessage.upsert({
    where: { messageId: msg4.id },
    update: {},
    create: {
      messageId: msg4.id,
      userId: aminata.id,
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      durationSeconds: 28,
      durationMs: 28000,
      waveformJson: JSON.stringify([25, 45, 80, 50, 30, 95, 65, 40, 75, 85, 35, 60, 90, 45, 30, 70, 85, 40, 25, 60]),
    },
  });

  // Message 5: YouTube Video Lecture
  await prisma.message.upsert({
    where: { id: 'msg-wireframe-05' },
    update: {},
    create: {
      id: 'msg-wireframe-05',
      conversationId: wireframeConv.id,
      senderId: aminata.id,
      type: 'TEXT',
      text: '🎥 Algorithmique & Structures de Données - Masterclass\nhttps://www.youtube.com/watch?v=kqtD5dpn9C8',
      sentAt: new Date(Date.now() - 3600 * 1000 * 0.1),
      status: 'READ',
    },
  });

  // 4. Create Group Conversation: Promo L3 SEG Ouaga
  const groupConv = await prisma.conversation.upsert({
    where: { id: 'conv-promo-seg' },
    update: { updatedAt: new Date() },
    create: {
      id: 'conv-promo-seg',
      type: 'ACADEMIC_GROUP',
      title: 'Groupe Promo L3 SEG • UJKZ Ouaga',
      description: 'Groupe officiel d’entraide académique pour la Licence 3 Sciences Économiques.',
      avatarUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=400&auto=format&fit=crop&q=80',
      createdById: aminata.id,
      participants: {
        create: [
          { userId: aminata.id, role: 'OWNER', canModerate: true },
          { userId: interlocutor.id, role: 'MEMBER' },
          ...(idriss ? [{ userId: idriss.id, role: 'MODERATOR' }] : []),
        ],
      },
    },
  });

  await prisma.message.upsert({
    where: { id: 'msg-group-01' },
    update: {},
    create: {
      id: 'msg-group-01',
      conversationId: groupConv.id,
      senderId: aminata.id,
      type: 'TEXT',
      text: 'Bienvenue à tous les camarades de L3 SEG dans notre espace d’échange officiel Campus Folder !',
      sentAt: new Date(Date.now() - 3600 * 1000 * 5),
      status: 'READ',
    },
  });

  // 5. Update user presences
  await prisma.userPresence.upsert({
    where: { userId: aminata.id },
    update: { status: 'ONLINE', lastSeenAt: new Date() },
    create: { userId: aminata.id, status: 'ONLINE', lastSeenAt: new Date() },
  });

  await prisma.userPresence.upsert({
    where: { userId: interlocutor.id },
    update: { status: 'ONLINE', lastSeenAt: new Date() },
    create: { userId: interlocutor.id, status: 'ONLINE', lastSeenAt: new Date() },
  });

  console.log('✅ Realtime messaging, wireframe chat with Amina, and group conversations seeded successfully!');
}

seedMessaging()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
