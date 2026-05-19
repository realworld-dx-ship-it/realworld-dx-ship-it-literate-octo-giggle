export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Real World 経理ボット</h1>
      <p>LINE の友だち追加から領収書を送信してください。</p>
      <ul>
        <li>写真を送る → OCR で自動抽出</li>
        <li>「集計」→ 今月の部門別サマリー</li>
        <li>「未処理」→ 税理士未共有の件数</li>
        <li>「ヘルプ」→ コマンド一覧</li>
      </ul>
    </main>
  );
}
