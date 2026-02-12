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
    const { connectionId, sql, database } = body;

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
      database: database || 'information_schema', // Allow context switching, default to info_schema
      connectTimeout: 5000,
      multipleStatements: true // Allow "USE x; SELECT..."
    });

    // 3. Execute User Query
    // mysql2 execute/query returns [rows, fields]
    // If SELECT, rows is array of objects.
    // If USE/UPDATE/INSERT, rows is ResultSetHeader (object), fields is undefined.
    const [rows, fields] = await connection.query(sql);
    
    // 4. Capture current database context (in case user ran 'USE ...')
    const [dbRows] = await connection.query('SELECT DATABASE() as db');
    const currentDatabase = (dbRows as any)[0]?.db || null;

    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);

    // 5. Format Output
    let columns: string[] = [];
    let resultRows = [];
    let affectedRows: number | undefined = undefined;

    if (Array.isArray(rows)) {
        // It's a SELECT result
        resultRows = rows;
        if (fields) {
            columns = fields.map(f => f.name);
        } else if (resultRows.length > 0) {
            columns = Object.keys(resultRows[0]);
        }
    } else {
        // It's a ResultHeader (OK Packet)
        // e.g. { fieldCount: 0, affectedRows: 0, insertId: 0, info: '', serverStatus: 2, warningStatus: 0 }
        affectedRows = (rows as any).affectedRows;
        resultRows = []; // No data rows
        columns = []; 
    }

    return NextResponse.json({
      columns,
      rows: resultRows,
      affectedRows,
      duration,
      currentDatabase
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