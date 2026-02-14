import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voki | 트레이딩 복기",
  description: "거래를 기록하고 리스크를 관리하는 복기 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
