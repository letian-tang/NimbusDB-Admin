import { NextResponse } from 'next/server';
import { validateUser, createSession } from '../../../../lib/db';
import crypto from 'crypto';

// 阿里云 API 签名
function generateSignature(params: Record<string, string>, accessKeySecret: string): string {
  // 1. 排序参数
  const sortedQueryString = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  // 2. 构建签名字符串
  const stringToSign = `POST&${encodeURIComponent('/')}&${encodeURIComponent(sortedQueryString)}`;

  // 3. 计算签名 (使用 HMAC-SHA1)
  const signature = crypto
    .createHmac('sha1', `${accessKeySecret}&`)
    .update(stringToSign)
    .digest('base64');

  return signature;
}

// 阿里云验证码验证
async function verifyCaptcha(captchaVerifyParam: string): Promise<boolean> {
  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const sceneId = process.env.NEXT_PUBLIC_ALIYUN_CAPTCHA_SCENE_ID;

  // 如果没有配置验证码，跳过验证（开发环境）
  if (!accessKeyId || !accessKeySecret || !sceneId || sceneId === 'your_scene_id_here') {
    console.warn('阿里云验证码未配置，跳过验证');
    return true;
  }

  try {
    // 构建公共请求参数
    const timestamp = new Date().toISOString().replace(/\.\d{3}/, '');
    const params: Record<string, string> = {
      AccessKeyId: accessKeyId,
      Action: 'VerifyIntelligentCaptcha',
      Version: '2023-03-05',
      Format: 'JSON',
      RegionId: 'cn-hangzhou',
      Timestamp: timestamp,
      SignatureMethod: 'HMAC-SHA1',
      SignatureVersion: '1.0',
      SignatureNonce: crypto.randomUUID(),
      CaptchaVerifyParam: captchaVerifyParam,
      SceneId: sceneId,
    };

    // 计算签名
    const signature = generateSignature(params, accessKeySecret);
    params.Signature = signature;

    // 构建请求体
    const requestBody = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    // 发送请求
    const response = await fetch('https://captcha.cn-shanghai.aliyuncs.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    const result = await response.json();
    console.log('阿里云验证码验证结果:', result);

    // 检查验证结果
    if (result.Code && result.Code !== 'Success') {
      console.error('阿里云验证码验证失败:', result.Message);
      return false;
    }

    // 验证成功 - 检查 VerifyResult
    return result.Result?.VerifyResult === true;
  } catch (error) {
    console.error('验证码验证异常:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const { username, password, captchaVerifyParam } = await request.json();

    console.log('登录请求:', { username, hasCaptcha: !!captchaVerifyParam });

    // 验证验证码
    if (captchaVerifyParam) {
      const captchaValid = await verifyCaptcha(captchaVerifyParam);
      console.log('验证码验证结果:', captchaValid);
      if (!captchaValid) {
        return NextResponse.json({ error: '验证码验证失败，请重试' }, { status: 400 });
      }
    } else {
      // 如果没有传验证码参数，检查是否配置了验证码
      const sceneId = process.env.NEXT_PUBLIC_ALIYUN_CAPTCHA_SCENE_ID;
      if (sceneId && sceneId !== 'your_scene_id_here') {
        return NextResponse.json({ error: '请完成验证码验证' }, { status: 400 });
      }
    }

    const user = validateUser(username, password);
    console.log('用户验证结果:', user ? '成功' : '失败');
    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    const token = createSession(user.id);

    return NextResponse.json({
      token,
      user
    });
  } catch (error: any) {
    console.error('登录错误:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
