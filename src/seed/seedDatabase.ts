import dbConnect from '@/lib/dbConnect';
import { Region } from '@/models/Region';
import { School } from '@/models/School';
import { Location } from '@/models/Location';
import { Device } from '@/models/Device';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function seedDatabase() {
  try {
    await dbConnect();
    console.log('Connected to database');

    // Clear existing data
    await Promise.all([
      Region.deleteMany({}),
      School.deleteMany({}),
      Location.deleteMany({}),
      Device.deleteMany({}),
      User.deleteMany({})
    ]);

    // Create regions
    const regions = await Region.insertMany([
      { name: 'North Region', code: 'NR', description: 'Northern district schools' },
      { name: 'South Region', code: 'SR', description: 'Southern district schools' },
      { name: 'East Region', code: 'ER', description: 'Eastern district schools' },
      { name: 'West Region', code: 'WR', description: 'Western district schools' },
    ]);

    // Create schools
    const schools = await School.insertMany([
      { name: 'Lincoln High School', code: 'LHS', regionId: regions[0]._id },
      { name: 'Washington Middle School', code: 'WMS', regionId: regions[0]._id },
      { name: 'Jefferson Elementary', code: 'JES', regionId: regions[1]._id },
      { name: 'Roosevelt High School', code: 'RHS', regionId: regions[2]._id },
      { name: 'Kennedy Middle School', code: 'KMS', regionId: regions[3]._id },
    ]);

    // Create locations
    const locations = await Location.insertMany([
      { name: 'Computer Lab A', code: 'CLA', schoolId: schools[0]._id },
      { name: 'Computer Lab B', code: 'CLB', schoolId: schools[0]._id },
      { name: 'Science Lab', code: 'SL', schoolId: schools[1]._id },
      { name: 'Media Center', code: 'MC', schoolId: schools[2]._id },
      { name: 'Engineering Lab', code: 'EL', schoolId: schools[3]._id },
    ]);

    // Create devices
    const devices = [];
    for (let i = 0; i < locations.length; i++) {
      for (let j = 1; j <= 5; j++) {
        devices.push({
          name: `Desktop PC #${j}`,
          code: `PC${String(i * 5 + j).padStart(3, '0')}`,
          type: 'desktop',
          schoolId: locations[i].schoolId,
          locationId: locations[i]._id,
          status: j <= 4 ? 'active' : 'maintenance'
        });
      }
    }
    await Device.insertMany(devices);

    // Create users
    const hashedPassword = await bcrypt.hash('password123', 10);
    await User.insertMany([
      {
        name: 'Admin User',
        email: 'admin@school.edu',
        passwordHash: hashedPassword,
        role: 'admin'
      },
      {
        name: 'Engineer User',
        email: 'engineer@school.edu',
        passwordHash: hashedPassword,
        role: 'engineer'
      },
      {
        name: 'Faculty User',
        email: 'faculty@school.edu',
        passwordHash: hashedPassword,
        role: 'faculty',
        affiliatedSchool: schools[0]._id
      }
    ]);

    console.log('Database seeded successfully!');
    console.log(`Created ${regions.length} regions`);
    console.log(`Created ${schools.length} schools`);
    console.log(`Created ${locations.length} locations`);
    console.log(`Created ${devices.length} devices`);
    console.log('Created 3 users (admin@school.edu, engineer@school.edu, faculty@school.edu)');
    console.log('Default password for all users: password123');

  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}
