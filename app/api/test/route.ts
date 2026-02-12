import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// 这是一个后端接口示例
// 访问地址: http://localhost:3000/api/test

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { host, user, password, port, sql } = body;

    // 在服务端创建真实的数据库连接
    // 这里的代码运行在 Node.js 环境中，浏览器无法看到
    const connection = await mysql.createConnection({
      host: host,
      user: user,
      password: password,
      port: port,
      database: 'information_schema' // 默认连接库
    });

    const [rows] = await connection.execute('SELECT 1 as val');
    
    await connection.end();

    return NextResponse.json({ success: true, message: "连接成功", data: rows });
    
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}