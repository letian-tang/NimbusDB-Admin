import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import db from '../../../lib/db';
import { NimbusConnection } from '../../../types';
import { isAuthenticated } from '../../../lib/auth';

export async function POST(request: Request) {
  if (!isAuthenticated(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let connection: mysql.Connection | null = null;
  
  try {
    const body = await request.json();
    const { connectionId, sql } = body;

    if (!connectionId || !sql) {
      return NextResponse.json({ error: 'Missing connectionId or sql' }, { status: 400 });
    }

    // 1. Get connection details from SQLite
    const stmt = db.prepare('SELECT * FROM connections WHERE id = ?');
    const config = stmt.get(connectionId) as NimbusConnection;

    if (!config) {
      return NextResponse.json({ error: 'Connection config not found' }, { status: 404 });
    }

    // 2. Connect to actual NimbusDB (MySQL protocol)
    const startTime = performance.now();
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.username,
      password: config.password,
      database: 'information_schema', // Default DB to connect to
      connectTimeout: 5000 // 5s timeout
    });

    // 3. Execute Query
    const [rows, fields] = await connection.query(sql);
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // 4. Format Output
    const columns = fields ? fields.map(f => f.name) : [];
    
    let resultRows = [];
    if (Array.isArray(rows)) {
        resultRows = rows;
    } else {
        resultRows = [rows];
        if (columns.length === 0) {
            columns.push('Result');
        }
    }

    return NextResponse.json({
      columns,
      rows: resultRows,
      duration
    });

  } catch (error: any) {
    console.error("SQL Execution Error:", error);
    return NextResponse.json({ 
      error: error.message || 'Unknown error occurred',
      details: error.code 
    }, { status: 500 });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // ignore close errors
      }
    }
  }
}
