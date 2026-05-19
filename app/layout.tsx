export const metadata = {
  title: 'Real World 経理ボット',
  description: '領収書OCR & 経理集計サービス',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
