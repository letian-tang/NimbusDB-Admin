import React from 'react';
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
    <html lang="zh-CN">
      <head>
      </head>
      <body>{children}</body>
    </html>
  );
}