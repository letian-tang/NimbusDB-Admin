import React from 'react';

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
        {/* Keeping Tailwind CDN for consistent styling with previous version */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}