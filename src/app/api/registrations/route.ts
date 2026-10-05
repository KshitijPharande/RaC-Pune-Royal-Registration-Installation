import { NextRequest, NextResponse } from 'next/server';
import {
  getAllRegistrations,
  saveRegistration,
  computeStats,
  getSortedByProtocol,
} from '@/lib/storage';
import { RegistrationInput } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const registrations = await getAllRegistrations();
    const stats = computeStats(registrations);
    const protocolGroups = getSortedByProtocol(registrations);

    return NextResponse.json({
      success: true,
      registrations,
      stats,
      protocolGroups,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve registrations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RegistrationInput;

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.phone || !body.phone.trim()) {
      return NextResponse.json(
        { success: false, error: 'Contact number is required' },
        { status: 400 }
      );
    }

    if (!['rotaractor', 'rotarian', 'guest'].includes(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid attendee category' },
        { status: 400 }
      );
    }

    const saved = await saveRegistration(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        registration: saved,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving registration:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while saving registration' },
      { status: 500 }
    );
  }
}
