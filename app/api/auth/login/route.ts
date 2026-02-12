import { NextResponse } from 'next/server';
import { validateUser, createSession } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    
    const user = validateUser(username, password);
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = createSession(user.id);

    return NextResponse.json({ 
      token,
      user
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
