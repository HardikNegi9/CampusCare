import { NextResponse } from 'next/server';
import { seedDatabase } from '@/seed/seedDatabase';

export async function POST() {
  try {
    // Only allow seeding in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'Seeding is only allowed in development' },
        { status: 403 }
      );
    }

    await seedDatabase();
    
    return NextResponse.json({
      message: 'Database seeded successfully',
      note: 'Demo users created: admin@school.edu, engineer@school.edu, faculty@school.edu (password: password123)'
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
