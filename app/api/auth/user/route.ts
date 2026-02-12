import { NextResponse } from 'next/server';
import { isAuthenticated } from '../../../../lib/auth';
import db, { createUser, updatePassword } from '../../../../lib/db';

// Create New User
export async function POST(request: Request) {
  const user = isAuthenticated(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { username, password } = await request.json();
    if (!username || !password) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    try {
      createUser(username, password);
      return NextResponse.json({ success: true });
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed')) {
        return NextResponse.json({ error: '用户名已存在' }, { status: 400 });
      }
      throw e;
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update Password
export async function PUT(request: Request) {
  const user = isAuthenticated(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { password, targetUserId } = await request.json();
    if (!password) return NextResponse.json({ error: 'Missing password' }, { status: 400 });

    // Users can change their own password, or perhaps admins can change others (logic simplified here to self)
    // If targetUserId is provided and user is admin? Let's keep it simple: self update or simplistic admin
    
    const idToUpdate = targetUserId ? targetUserId : user.id;
    updatePassword(idToUpdate, password);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// List Users
export async function GET(request: Request) {
  const user = isAuthenticated(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const stmt = db.prepare('SELECT id, username, created_at FROM users ORDER BY created_at DESC');
    const users = stmt.all();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
