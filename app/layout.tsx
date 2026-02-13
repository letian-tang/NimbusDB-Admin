import React from 'react';
import Script from 'next/script';
import './globals.css';

export const metadata = {
  title: 'NimbusDB Admin',
  description: 'NimbusDB 管理后台',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <Script id="aliyun-captcha-config" strategy="beforeInteractive">
          {`
            window.AliyunCaptchaConfig = {
              region: 'cn',
              prefix: '${process.env.NEXT_PUBLIC_ALIYUN_CAPTCHA_PREFIX || ''}',
            };
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>
        <Script
          src="https://o.alicdn.com/captcha-frontend/aliyunCaptcha/AliyunCaptcha.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
