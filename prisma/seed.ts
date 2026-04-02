import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  // 1. Delete all data in correct order
  console.log('🗑️ Cleaning existing data...');
  await db.notification.deleteMany();
  await db.userBadge.deleteMany();
  await db.chatMessage.deleteMany();
  await db.chatRoomUser.deleteMany();
  await db.chatRoom.deleteMany();
  await db.comment.deleteMany();
  await db.sighting.deleteMany();
  await db.report.deleteMany();
  await db.pet.deleteMany();
  await db.badge.deleteMany();
  await db.user.deleteMany();

  // 2. Create badges
  console.log('🏅 Creating badges...');
  const badge_first_report = await db.badge.create({
    data: {
      name: 'first_report',
      description: 'Publicaste tu primer reporte',
      icon: '📢',
      category: 'social',
    },
  });

  const badge_first_sighting = await db.badge.create({
    data: {
      name: 'first_sighting',
      description: 'Reportaste tu primer avistamiento',
      icon: '👁️',
      category: 'community',
    },
  });

  const badge_reunion = await db.badge.create({
    data: {
      name: 'reunion',
      description: 'Ayudaste a reunir una mascota con su familia',
      icon: '🎉',
      category: 'rescue',
    },
  });

  const badge_active_finder = await db.badge.create({
    data: {
      name: 'active_finder',
      description: '5+ avistamientos reportados',
      icon: '🔍',
      category: 'community',
    },
  });

  const badge_community_hero = await db.badge.create({
    data: {
      name: 'community_hero',
      description: '10+ reportes de ayuda',
      icon: '🦸',
      category: 'special',
    },
  });

  const badge_shelter_ally = await db.badge.create({
    data: {
      name: 'shelter_ally',
      description: 'Miembro de un refugio verificado',
      icon: '🏠',
      category: 'special',
    },
  });

  const badge_chat_helper = await db.badge.create({
    data: {
      name: 'chat_helper',
      description: 'Participaste en 5+ conversaciones de ayuda',
      icon: '💬',
      category: 'social',
    },
  });

  const badge_week_streak = await db.badge.create({
    data: {
      name: 'week_streak',
      description: '7 días consecutivos de actividad',
      icon: '🔥',
      category: 'social',
    },
  });

  // 3. Create users with hashed passwords
  console.log('👥 Creating users...');
  const adminHash = await bcrypt.hash('admin123', 12);
  const refugioHash = await bcrypt.hash('refugio123', 12);
  const mariaHash = await bcrypt.hash('maria123', 12);
  const carlosHash = await bcrypt.hash('carlos123', 12);

  const user1 = await db.user.create({
    data: {
      name: 'Admin PawsFound',
      email: 'admin@pawsfound.com',
      password: adminHash,
      role: 'ADMIN',
      city: 'La Paz',
      phone: '+591 70000001',
      bio: 'Administrador de la plataforma PawsFound',
      locale: 'es',
      pushEnabled: true,
      locationSharing: false,
      profileVisible: true,
    },
  });

  const user2 = await db.user.create({
    data: {
      name: 'Refugio Patitas',
      email: 'refugio@patitas.com',
      password: refugioHash,
      role: 'SHELTER',
      city: 'Santa Cruz',
      phone: '+591 70000002',
      bio: 'Refugio de animales en Santa Cruz. Rescatamos y damos en adopción.',
      locale: 'es',
      pushEnabled: true,
      locationSharing: true,
      profileVisible: true,
    },
  });

  const user3 = await db.user.create({
    data: {
      name: 'María García',
      email: 'maria@example.com',
      password: mariaHash,
      role: 'USER',
      city: 'La Paz',
      phone: '+591 70012345',
      bio: 'Amante de los animales. Tengo 2 perros y 1 gato.',
      locale: 'es',
      pushEnabled: true,
      locationSharing: false,
      profileVisible: true,
    },
  });

  const user4 = await db.user.create({
    data: {
      name: 'Carlos Mendoza',
      email: 'carlos@example.com',
      password: carlosHash,
      role: 'USER',
      city: 'Cochabamba',
      phone: '+591 71098765',
      bio: 'Voluntario en rescate animal.',
      locale: 'es',
      pushEnabled: true,
      locationSharing: true,
      profileVisible: true,
    },
  });

  // 4. Create pets
  console.log('🐾 Creating pets...');
  await db.pet.create({
    data: {
      name: 'Firulais',
      species: 'dog',
      breed: 'Golden Retriever',
      color: 'Dorado',
      uniqueMarks: 'Collar rojo con placas, mancha blanca en el pecho',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
      ownerId: user3.id,
    },
  });

  await db.pet.create({
    data: {
      name: 'Michi',
      species: 'cat',
      breed: 'Siamés',
      color: 'Crema y chocolate',
      uniqueMarks: 'Ojos azules, sin cola',
      photoUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop',
      ownerId: user3.id,
    },
  });

  await db.pet.create({
    data: {
      name: 'Rex',
      species: 'dog',
      breed: 'Pastor Alemán',
      color: 'Negro y marrón',
      uniqueMarks: 'Cicatriz en la oreja izquierda',
      photoUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=300&fit=crop',
      ownerId: user4.id,
    },
  });

  await db.pet.create({
    data: {
      name: 'Luna',
      species: 'cat',
      breed: 'Persa',
      color: 'Blanco',
      uniqueMarks: 'Pelo largo, ojos verdes',
      photoUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop',
      ownerId: user2.id,
    },
  });

  await db.pet.create({
    data: {
      name: 'Toby',
      species: 'dog',
      breed: 'Bulldog Francés',
      color: 'Atigrado',
      uniqueMarks: 'Parche negro en el ojo derecho',
      photoUrl: 'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=400&h=300&fit=crop',
      ownerId: user4.id,
    },
  });

  // 5. Create reports
  console.log('📋 Creating reports...');
  const report1 = await db.report.create({
    data: {
      type: 'lost',
      petName: 'Firulais',
      species: 'dog',
      breed: 'Golden Retriever',
      color: 'Dorado',
      uniqueMarks: 'Collar rojo con placas, mancha blanca en el pecho',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&h=300&fit=crop',
      lat: -16.4955,
      lng: -68.1336,
      address: 'Av. Mariscal Santa Cruz, La Paz',
      status: 'active',
      reporterId: user3.id,
    },
  });

  const report2 = await db.report.create({
    data: {
      type: 'lost',
      petName: 'Michi',
      species: 'cat',
      breed: 'Siamés',
      color: 'Crema y chocolate',
      uniqueMarks: 'Ojos azules, sin cola',
      photoUrl: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop',
      lat: -16.5030,
      lng: -68.1220,
      address: 'Calle Sucre, La Paz',
      status: 'active',
      reporterId: user3.id,
    },
  });

  await db.report.create({
    data: {
      type: 'lost',
      petName: 'Rex',
      species: 'dog',
      breed: 'Pastor Alemán',
      color: 'Negro y marrón',
      uniqueMarks: 'Cicatriz en la oreja izquierda',
      photoUrl: 'https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=400&h=300&fit=crop',
      lat: -17.3895,
      lng: -66.1568,
      address: 'Av. Monseñor Rivero, Cochabamba',
      status: 'active',
      reporterId: user4.id,
    },
  });

  await db.report.create({
    data: {
      type: 'sighted',
      petName: 'Desconocido',
      species: 'dog',
      breed: 'Mestizo',
      color: 'Blanco con manchas negras',
      uniqueMarks: 'Collar azul, muy delgado',
      photoUrl: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
      lat: -16.4980,
      lng: -68.1400,
      address: 'Plaza Murillo, La Paz',
      status: 'active',
      reporterId: user2.id,
    },
  });

  const report5 = await db.report.create({
    data: {
      type: 'lost',
      petName: 'Luna',
      species: 'cat',
      breed: 'Persa',
      color: 'Blanco',
      uniqueMarks: 'Pelo largo, ojos verdes',
      photoUrl: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=400&h=300&fit=crop',
      lat: -17.7833,
      lng: -63.1821,
      address: 'Calle Warnes, Santa Cruz',
      status: 'active',
      reporterId: user2.id,
    },
  });

  await db.report.create({
    data: {
      type: 'sighted',
      petName: 'Desconocido',
      species: 'cat',
      breed: 'Mestizo',
      color: 'Naranja',
      uniqueMarks: 'Sin collar, muy amigable',
      photoUrl: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=400&h=300&fit=crop',
      lat: -16.5010,
      lng: -68.1300,
      address: 'Mercado Lanza, La Paz',
      status: 'active',
      reporterId: user4.id,
    },
  });

  await db.report.create({
    data: {
      type: 'lost',
      petName: 'Toby',
      species: 'dog',
      breed: 'Bulldog Francés',
      color: 'Atigrado',
      uniqueMarks: 'Parche negro en el ojo derecho',
      photoUrl: 'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=400&h=300&fit=crop',
      lat: -16.4900,
      lng: -68.1450,
      address: 'Zona Miraflores, La Paz',
      status: 'found',
      reporterId: user4.id,
    },
  });

  await db.report.create({
    data: {
      type: 'sighted',
      petName: 'Desconocido',
      species: 'dog',
      breed: 'Labrador',
      color: 'Chocolate',
      uniqueMarks: 'Collar rojo, muy juguetón',
      photoUrl: 'https://images.unsplash.com/photo-1579213838058-4a08e1868b9b?w=400&h=300&fit=crop',
      lat: -17.3950,
      lng: -66.1600,
      address: 'Parque de la Família, Cochabamba',
      status: 'active',
      reporterId: user4.id,
    },
  });

  // 6. Create sightings
  console.log('👁️ Creating sightings...');
  const sighting1 = await db.sighting.create({
    data: {
      reportId: report1.id,
      description: 'Lo vi en el parque, parecía asustado pero amigable.',
      lat: -16.4970,
      lng: -68.1350,
      address: 'Parque Urbano Central, La Paz',
      reporterId: user2.id,
    },
  });

  await db.sighting.create({
    data: {
      reportId: report1.id,
      description: 'Una familia lo está alimentando cerca de la iglesia.',
      lat: -16.4940,
      lng: -68.1310,
      address: 'Iglesia San Francisco, La Paz',
      reporterId: user4.id,
    },
  });

  const sighting3 = await db.sighting.create({
    data: {
      reportId: report5.id,
      description: 'La vi durmiendo en una ventana del segundo piso.',
      lat: -17.7840,
      lng: -63.1800,
      address: 'Av. Equipetrol, Santa Cruz',
      reporterId: user4.id,
    },
  });

  // 7. Create comments
  console.log('💬 Creating comments...');
  await db.comment.create({
    data: {
      content: '¡Ayuda por favor! Lo vi cerca del mercado Rodriguez ayer también. Estoy atento.',
      authorId: user4.id,
      reportId: report1.id,
    },
  });

  await db.comment.create({
    data: {
      content: 'Compartí este reporte en mis redes. Mucha suerte María, espero que lo encuentres pronto.',
      authorId: user2.id,
      reportId: report1.id,
    },
  });

  await db.comment.create({
    data: {
      content: 'Hay un grupo de voluntarios buscando en la zona. Los contactaré.',
      authorId: user1.id,
      reportId: report1.id,
    },
  });

  await db.comment.create({
    data: {
      content: 'Vi un gato siamés similar en la zona de Sopocachi, publicaré foto si lo veo de nuevo.',
      authorId: user4.id,
      reportId: report2.id,
    },
  });

  await db.comment.create({
    data: {
      content: 'Michi tiene una cicatriz pequeña en la nariz. Revisa bien las fotos. ¡Gracias por el apoyo!',
      authorId: user3.id,
      reportId: report2.id,
    },
  });

  await db.comment.create({
    data: {
      content: 'Confirmo el avistamiento. Lo vi caminando hacia el norte por la avenida principal.',
      authorId: user4.id,
      sightingId: sighting1.id,
    },
  });

  // 8. Create chat rooms
  console.log('🏠 Creating chat rooms...');
  const room1 = await db.chatRoom.create({
    data: {
      name: 'Firulais perdido',
      participants: {
        create: [
          { userId: user3.id },
          { userId: user4.id },
        ],
      },
    },
  });

  const room2 = await db.chatRoom.create({
    data: {
      name: 'Ayuda con gato encontrado',
      participants: {
        create: [
          { userId: user3.id },
          { userId: user2.id },
        ],
      },
    },
  });

  // 9. Create chat messages
  console.log('📝 Creating chat messages...');

  // Room 1: Maria & Carlos about Firulais
  await db.chatMessage.create({
    data: {
      content: 'Hola Carlos, vi que reportaste un avistaje de Firulais. ¿Dónde exactamente lo viste?',
      roomId: room1.id,
      senderId: user3.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: '¡Hola María! Lo vi en el Parque Urbano Central, cerca de la fuente. Estaba con una familia que lo alimentaba.',
      roomId: room1.id,
      senderId: user4.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: '¡Qué alivio! ¿Pudiste ver si tenía el collar rojo con las placas?',
      roomId: room1.id,
      senderId: user3.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: 'Sí, tiene el collar rojo. Le tomé una foto, te la envío.',
      roomId: room1.id,
      senderId: user4.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: '¡Ese es Firulais! Estoy yendo para allá ahora mismo. ¿Aún está?',
      roomId: room1.id,
      senderId: user3.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: 'Sí, la familia dijo que se quedarán con él hasta que llegues. Te paso su número.',
      roomId: room1.id,
      senderId: user4.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: '¡Eres un ángel Carlos! Mil gracias por la ayuda 💛',
      roomId: room1.id,
      senderId: user3.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: 'De nada María, me alegra mucho poder ayudar. ¡Que se reúnan pronto!',
      roomId: room1.id,
      senderId: user4.id,
    },
  });

  // Room 2: Maria & Refugio about cat
  await db.chatMessage.create({
    data: {
      content: 'Hola, soy del Refugio Patitas. Vimos tu reporte sobre el gato siamés perdido en La Paz.',
      roomId: room2.id,
      senderId: user2.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: '¡Hola! Sí, Michi lleva una semana perdida. ¿Tienen información?',
      roomId: room2.id,
      senderId: user3.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: 'Un rescatista nos trajo un gato siamés sin cola ayer. Podría ser Michi. ¿Tienes fotos?',
      roomId: room2.id,
      senderId: user2.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: '¡Por favor! Te mando fotos ahora. Michi tiene ojos azules muy característicos.',
      roomId: room2.id,
      senderId: user3.id,
    },
  });

  await db.chatMessage.create({
    data: {
      content: 'Confirmado, es Michi. Tiene los ojos azules y sin cola. Ven a recogerlo cuando gustes.',
      roomId: room2.id,
      senderId: user2.id,
    },
  });

  // 10. Create notifications
  console.log('🔔 Creating notifications...');
  await db.notification.create({
    data: {
      userId: user3.id,
      title: 'Nuevo avistaje de Firulais',
      body: 'Carlos reportó un avistaje de Firulais en el Parque Urbano Central.',
      type: 'sighting',
      read: false,
      data: JSON.stringify({ reportId: report1.id }),
    },
  });

  await db.notification.create({
    data: {
      userId: user3.id,
      title: 'Nuevo comentario',
      body: 'Refugio Patitas comentó en tu reporte de Firulais.',
      type: 'comment',
      read: true,
      data: JSON.stringify({ reportId: report1.id }),
    },
  });

  await db.notification.create({
    data: {
      userId: user3.id,
      title: 'Posible coincidencia',
      body: 'El Refugio Patitas encontró un gato que podría ser Michi.',
      type: 'report',
      read: false,
      data: JSON.stringify({ reportId: report2.id }),
    },
  });

  await db.notification.create({
    data: {
      userId: user4.id,
      title: 'Nuevo reporte en tu zona',
      body: 'Se reportó una mascota perdida cerca de ti en Cochabamba.',
      type: 'report',
      read: false,
    },
  });

  await db.notification.create({
    data: {
      userId: user4.id,
      title: '¡Insignia obtenida!',
      body: 'Obtuviste la insignia "Primer Avistaje" por reportar tu primer avistamiento.',
      type: 'badge',
      read: true,
      data: JSON.stringify({ badgeName: 'first_sighting' }),
    },
  });

  // 11. Assign badges to users
  console.log('🏅 Assigning badges...');
  await db.userBadge.create({
    data: { userId: user3.id, badgeId: badge_first_report.id },
  });

  await db.userBadge.create({
    data: { userId: user4.id, badgeId: badge_first_sighting.id },
  });

  await db.userBadge.create({
    data: { userId: user4.id, badgeId: badge_chat_helper.id },
  });

  await db.userBadge.create({
    data: { userId: user2.id, badgeId: badge_shelter_ally.id },
  });

  await db.userBadge.create({
    data: { userId: user2.id, badgeId: badge_community_hero.id },
  });

  await db.userBadge.create({
    data: { userId: user1.id, badgeId: badge_week_streak.id },
  });

  console.log('');
  console.log('🌱 Seed data created successfully!');
  console.log(`- 8 badges`);
  console.log(`- 4 users (1 admin, 1 shelter, 2 regular)`);
  console.log(`- 5 pets`);
  console.log(`- 8 reports`);
  console.log(`- 3 sightings`);
  console.log(`- 6 comments`);
  console.log(`- 2 chat rooms with 13 messages`);
  console.log(`- 5 notifications`);
  console.log(`- 6 user badges assigned`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
