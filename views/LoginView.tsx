import React, { useState, useEffect, useRef } from 'react';
import { nimbusService } from '../services/nimbusService';
import { Lock, User, AlertCircle } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

// 声明全局方法
declare global {
  interface Window {
    initAliyunCaptcha: (config: {
      SceneId: string;
      mode: string;
      element: string;
      button: string;
      success: (captchaVerifyParam: string) => void;
      fail: (error: any) => void;
      getInstance: (instance: any) => void;
      slideStyle?: {
        width: number;
        height: number;
      };
      language?: string;
    }) => void;
  }
}

const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const captchaInstanceRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // 使用 ref 存储最新的用户名密码，避免闭包问题
  const usernameRef = useRef('');
  const passwordRef = useRef('');

  // 同步更新 ref
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  useEffect(() => {
    passwordRef.current = password;
  }, [password]);

  // 执行登录
  const performLogin = async (captchaVerifyParam: string) => {
    setLoading(true);
    setError('');

    // 使用 ref 中的最新值
    const currentUser = usernameRef.current;
    const currentPass = passwordRef.current;

    try {
      await nimbusService.login(currentUser, currentPass, captchaVerifyParam);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名或密码');
      // 重新初始化验证码
      isInitializedRef.current = false;
      setTimeout(initCaptcha, 100);
    } finally {
      setLoading(false);
    }
  };

  // 初始化验证码
  const initCaptcha = () => {
    if (!window.initAliyunCaptcha || isInitializedRef.current) {
      return;
    }

    const sceneId = process.env.NEXT_PUBLIC_ALIYUN_CAPTCHA_SCENE_ID;
    if (!sceneId || sceneId === 'your_scene_id_here') {
      console.warn('验证码 SceneId 未配置，跳过验证码初始化');
      return;
    }

    try {
      window.initAliyunCaptcha({
        SceneId: sceneId,
        mode: 'popup',
        element: '#captcha-element',
        button: '#captcha-button',
        success: (captchaVerifyParam: string) => {
          // 验证成功，执行登录（使用 ref 获取最新值）
          performLogin(captchaVerifyParam);
        },
        fail: (error: any) => {
          console.error('验证码验证失败', error);
          setError('验证码验证失败，请重试');
          setLoading(false);
        },
        getInstance: (instance: any) => {
          captchaInstanceRef.current = instance;
        },
        slideStyle: {
          width: 360,
          height: 40,
        },
        language: 'cn',
      });

      isInitializedRef.current = true;
    } catch (err) {
      console.warn('验证码初始化失败', err);
    }
  };

  // 初始化验证码（脚本已在 layout.tsx 中全局加载）
  useEffect(() => {
    // 等待脚本加载完成
    const checkAndInit = () => {
      if (window.initAliyunCaptcha) {
        initCaptcha();
      } else {
        // 脚本还未加载，稍后重试
        setTimeout(checkAndInit, 100);
      }
    };
    checkAndInit();
  }, []);

  // 点击登录按钮
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sceneId = process.env.NEXT_PUBLIC_ALIYUN_CAPTCHA_SCENE_ID;

    // 如果验证码未配置，直接登录
    if (!sceneId || sceneId === 'your_scene_id_here') {
      if (!username || !password) {
        setError('请输入用户名和密码');
        return;
      }
      setLoading(true);
      try {
        await nimbusService.login(username, password);
        onLoginSuccess();
      } catch (err: any) {
        setError(err.message || '登录失败，请检查用户名或密码');
      } finally {
        setLoading(false);
      }
      return;
    }

    // 验证码已配置，点击按钮会触发验证码弹窗
    // 验证成功后在 success 回调中执行登录
  };

  // 验证码触发前的验证（通过事件捕获）
  const handleButtonClick = (e: React.MouseEvent) => {
    if (!username || !password) {
      e.preventDefault();
      e.stopPropagation();
      setError('请输入用户名和密码');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 overflow-hidden overscroll-none">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md overflow-hidden">
        <div className="bg-white p-8 text-center border-b border-gray-100">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4 shadow-lg shadow-blue-200">
            <span className="text-3xl font-bold text-white">舟</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">NimbusDB Admin</h1>
          <p className="text-gray-500 text-sm font-medium">舟谱NimbusDB管理后台</p>
        </div>

        <div className="p-8 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800"
                  placeholder="用户名"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 block">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-800"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* 验证码容器（隐藏） */}
            <div id="captcha-element" className="hidden"></div>

            {/* 登录按钮（同时也是验证码触发按钮） */}
            <button
              type="submit"
              id="captcha-button"
              disabled={loading}
              onClickCapture={handleButtonClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-400">
            @舟谱数据
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
