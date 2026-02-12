import { NextResponse } from 'next/server';
import db from '../../../lib/db';
import { NimbusConnection } from '../../../types';

// GET: List all connections
export async function GET() {
  try {
    const stmt = db.prepare('SELECT * FROM connections ORDER BY created_at DESC');
    const connections = stmt.all();
    return NextResponse.json(connections);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Create or Update a connection
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, host, port, username, password, created_at } = body as NimbusConnection;

    if (!id || !name || !host || !port || !username) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO connections (id, name, host, port, username, password, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, name, host, port, username, password || '', created_at || Date.now());

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a connection
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const stmt = db.prepare('DELETE FROM connections WHERE id = ?');
    stmt.run(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}