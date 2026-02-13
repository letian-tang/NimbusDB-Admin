import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth.ts';
import db, { createUser, updateUser, deleteUser } from '../../../../lib/db';

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

// Update User (Username or Password)
export async function PUT(request: Request) {
  const currentUser = isAuthenticated(request);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, username, password } = await request.json();
    if (!id || !username) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

    try {
      updateUser(id, username, password || undefined);
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

// Delete User
export async function DELETE(request: Request) {
  const currentUser = isAuthenticated(request);
  if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get('id') || '0');

    if (!id) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    // Optional: Prevent deleting self? 
    // Allowing it will just cause logout on next action which is fine.
    
    // Check if it's the last user? (Ideally should prevent locking out system, but let's keep it simple)
    
    deleteUser(id);
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