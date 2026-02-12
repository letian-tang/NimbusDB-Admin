import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import db from '../../../lib/db';
import { NimbusConnection } from '../../../types';

export async function POST(request: Request) {
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
    // mysql2 execute returns [rows, fields]
    // For general queries we use query() or execute()
    const [rows, fields] = await connection.query(sql);
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // 4. Format Output
    // Extract column names if available, otherwise empty
    const columns = fields ? fields.map(f => f.name) : [];
    
    // Handle non-select queries (OkPacket)
    // rows might be an array (SELECT) or an object (INSERT/UPDATE result)
    let resultRows = [];
    if (Array.isArray(rows)) {
        resultRows = rows;
    } else {
        // It's a result object (like { affectedRows: 1, ... })
        // We wrap it in an array to display in the table
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