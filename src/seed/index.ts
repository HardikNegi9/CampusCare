import { config } from 'dotenv';
import dbConnect from '@/lib/dbConnect';
import { User } from '@/models/User';
import { Region } from '@/models/Region';
import { School } from '@/models/School';
import { Location } from '@/models/Location';
import { Device } from '@/models/Device';
import bcrypt from 'bcryptjs';

// Load environment variables first
config();

// Also set the MONGODB_URI directly if not found
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb+srv://hardiknegi:N52igj1KKOePBpjY@testing.zxrwdd7.mongodb.net/?retryWrites=true&w=majority&appName=Testing';
}

async function seedDatabase() {
  await dbConnect();

  console.log('Starting database seed...');

  try {
    // Clear existing data
    await User.deleteMany({});
    await Device.deleteMany({});
    await Location.deleteMany({});
    await School.deleteMany({});
    await Region.deleteMany({});

    // Create regions
    const northRegion = await Region.create({
      name: 'North Region',
      code: 'NORTH',
      description: 'Northern campus region'
    });

    const southRegion = await Region.create({
      name: 'South Region',
      code: 'SOUTH',
      description: 'Southern campus region'
    });

    console.log('Regions created');

    // Create schools
    const engineeringSchool = await School.create({
      name: 'School of Engineering',
      address: '123 Engineering Blvd',
      region: northRegion._id
    });

    const scienceSchool = await School.create({
      name: 'School of Science',
      address: '456 Science Ave',
      region: northRegion._id
    });

    const artsSchool = await School.create({
      name: 'School of Arts',
      address: '789 Arts Way',
      region: southRegion._id
    });

    console.log('Schools created');

    // Create locations
    const compLabLocation = await Location.create({
      name: 'Computer Lab A',
      floor: 2,
      building: 'Engineering Building',
      school: engineeringSchool._id
    });

    const physicsLabLocation = await Location.create({
      name: 'Physics Lab 1',
      floor: 3,
      building: 'Science Building',
      school: scienceSchool._id
    });

    const artStudioLocation = await Location.create({
      name: 'Art Studio B',
      floor: 1,
      building: 'Arts Building',
      school: artsSchool._id
    });

    console.log('Locations created');

    // Create devices
    for (let i = 1; i <= 3; i++) {
      await Device.create({
        name: `CCTV-${i.toString().padStart(2, '0')}`,
        deviceType: 'cctv',
        location: compLabLocation._id,
        status: 'active',
        school: engineeringSchool._id
      });
    }

    for (let i = 1; i <= 2; i++) {
      await Device.create({
        name: `Printer-${i.toString().padStart(2, '0')}`,
        deviceType: 'printer',
        location: physicsLabLocation._id,
        status: 'active',
        school: scienceSchool._id
      });
    }

    for (let i = 1; i <= 2; i++) {
      await Device.create({
        name: `Computer-${i.toString().padStart(2, '0')}`,
        deviceType: 'Computer',
        location: artStudioLocation._id,
        status: i === 1 ? 'active' : 'inactive',
        school: artsSchool._id
      });
    }

    console.log('Devices created');

    // Create users with hashed passwords
    const adminPassword = await bcrypt.hash('admin123', 12);
    const engineerPassword = await bcrypt.hash('engineer123', 12);
    const facultyPassword = await bcrypt.hash('faculty123', 12);

    await User.create({
      name: 'System Administrator',
      email: 'admin@school.edu',
      passwordHash: adminPassword,
      role: 'admin',
      affiliatedSchool: engineeringSchool._id
    });

    await User.create({
      name: 'John Engineer',
      email: 'engineer@school.edu',
      passwordHash: engineerPassword,
      role: 'engineer'
    });

    await User.create({
      name: 'Jane Faculty',
      email: 'faculty@school.edu',
      passwordHash: facultyPassword,
      role: 'faculty',
      affiliatedSchool: scienceSchool._id
    });

    console.log('Users created');

    console.log('✅ Database seeded successfully!');
    console.log('\nTest accounts created:');
    console.log('- admin@school.edu / admin123 (Administrator)');
    console.log('- engineer@school.edu / engineer123 (Engineer)');
    console.log('- faculty@school.edu / faculty123 (Faculty)');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
