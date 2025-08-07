import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ufobeep.com' },
    update: {},
    create: {
      email: 'admin@ufobeep.com',
      username: 'admin',
      password: adminPassword,
      isAnonymous: false,
      isAdmin: true,
    },
  });

  console.log('Created admin user:', admin.email);

  // Create test registered user
  const userPassword = await bcrypt.hash('testuser123', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: userPassword,
      isAnonymous: false,
      lastLatitude: 40.7128,
      lastLongitude: -74.0060,
      lastLocationUpdate: new Date(),
    },
  });

  console.log('Created test user:', testUser.email);

  // Create sample sightings
  const sightings = [
    {
      title: 'Bright Light Formation Over Manhattan',
      description: 'Witnessed three bright lights moving in perfect triangular formation. Silent movement, lasted approximately 10 minutes before disappearing.',
      latitude: 40.7589,
      longitude: -73.9851,
      location: 'Manhattan, New York, USA',
      sightingDate: new Date('2024-01-15T22:30:00Z'),
      duration: 600,
      witnesses: 3,
      weather: 'Clear sky',
      visibility: 'Excellent',
      userId: testUser.id,
    },
    {
      title: 'Metallic Disc Near Central Park',
      description: 'Silver, disc-shaped object hovering motionless for about 5 minutes. No sound, then accelerated rapidly eastward.',
      latitude: 40.7812,
      longitude: -73.9665,
      location: 'Central Park, New York, USA',
      sightingDate: new Date('2024-01-20T14:15:00Z'),
      duration: 300,
      witnesses: 1,
      weather: 'Partly cloudy',
      visibility: 'Good',
      userId: null, // Anonymous submission
    },
    {
      title: 'Orange Orbs Over Brooklyn Bridge',
      description: 'Multiple orange glowing orbs appeared over the East River near Brooklyn Bridge. They pulsed rhythmically before fading away.',
      latitude: 40.7061,
      longitude: -73.9969,
      location: 'Brooklyn Bridge, New York, USA',
      sightingDate: new Date('2024-02-01T20:45:00Z'),
      duration: 480,
      witnesses: 7,
      weather: 'Clear',
      visibility: 'Excellent',
      userId: testUser.id,
      isVerified: true,
    },
  ];

  for (const sightingData of sightings) {
    await prisma.sighting.create({
      data: sightingData,
    });
  }

  console.log('Created sample sightings');

  // Create some chat messages
  const firstSighting = await prisma.sighting.findFirst();
  if (firstSighting) {
    await prisma.chatMessage.createMany({
      data: [
        {
          message: 'I saw this too! Was driving on FDR Drive when I noticed it.',
          sightingId: firstSighting.id,
          userId: testUser.id,
        },
        {
          message: 'Anyone get photos? This sounds incredible.',
          sightingId: firstSighting.id,
          anonymousName: 'UFO_Watcher',
          ipAddress: '192.168.1.100',
        },
        {
          message: 'My friend in Queens saw similar lights around the same time!',
          sightingId: firstSighting.id,
          anonymousName: 'NightSky',
          ipAddress: '10.0.0.50',
        },
      ],
    });
  }

  console.log('Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });