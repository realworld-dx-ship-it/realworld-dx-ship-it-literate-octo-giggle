import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Copy,
  Check,
  Terminal,
  FolderOpen,
  Globe,
  Rocket,
  Shield,
  MessageCircle,
} from 'lucide-react';

interface UserInfo {
  githubUsername: string;
  repositoryName: string;
  domain: string;
  lineUrl: string;
}

interface DeploymentGuideProps {
  userInfo: UserInfo;
  completedSteps: number[];
  expandedStep: number | null;
  copiedIndex: number | null;
  onToggleStep: (stepIndex: number) => void;
  onExpandStep: (stepIndex: number | null) => void;
  onCopy: (text: string, index: number) => void;
}

interface CodeBlockProps {
  code: string;
  index: number;
  copiedIndex: number | null;
  onCopy: (text: string, index: number) => void;
}

function CodeBlock({ code, index, copiedIndex, onCopy }: CodeBlockProps) {
  return (
    <div className="relative group">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => onCopy(code, index)}
        className="absolute top-2 right-2 p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Copy code"
      >
        {copiedIndex === index ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

export default function DeploymentGuide({
  userInfo,
  completedSteps,
  expandedStep,
  copiedIndex,
  onToggleStep,
  onExpandStep,
  onCopy,
}: DeploymentGuideProps) {
  const ghUser = userInfo.githubUsername || '<your-username>';
  const repoName = userInfo.repositoryName || '<your-repo>';
  const domain = userInfo.domain || '<your-domain.com>';
  const lineUrl = userInfo.lineUrl || 'https://line.me/R/ti/p/@your-id';

  const steps = [
    {
      title: 'プロジェクトの初期セットアップ',
      icon: <FolderOpen className="w-5 h-5" />,
      description:
        'Vite + React + TypeScript + Tailwind CSS のプロジェクトを作成し、基本的な構成を整えます。',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            まず、Vite を使って React + TypeScript プロジェクトを作成します。
          </p>
          <CodeBlock
            code={`npm create vite@latest ${repoName} -- --template react-ts
cd ${repoName}
npm install`}
            index={0}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
          <p className="text-slate-600">Tailwind CSS をインストールして設定します。</p>
          <CodeBlock
            code={`npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p`}
            index={1}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
          <p className="text-slate-600">
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">src/index.css</code>{' '}
            の先頭に Tailwind ディレクティブを追加します。
          </p>
          <CodeBlock
            code={`@tailwind base;
@tailwind components;
@tailwind utilities;`}
            index={2}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
        </div>
      ),
    },
    {
      title: 'GitHubリポジトリの作成とプッシュ',
      icon: <Terminal className="w-5 h-5" />,
      description:
        'ソースコードをGitHubにプッシュして、バージョン管理とデプロイの準備をします。',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            GitHub で新しいリポジトリ{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">{repoName}</code>{' '}
            を作成し、ローカルのコードをプッシュします。
          </p>
          <CodeBlock
            code={`git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/${ghUser}/${repoName}.git
git push -u origin main`}
            index={3}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <strong>注意:</strong> リポジトリは <strong>Public</strong>{' '}
            に設定するか、GitHub Pro 以上のプランで <strong>Private</strong>{' '}
            リポジトリの GitHub Pages を有効にしてください。
          </div>
        </div>
      ),
    },
    {
      title: 'ホスティングの設定（GitHub Pages / Vercel）',
      icon: <Globe className="w-5 h-5" />,
      description:
        'GitHub Pages または Vercel を使って静的サイトをデプロイします。',
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">
              オプション A: GitHub Pages
            </h4>
            <p className="text-slate-600 mb-3">
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">vite.config.ts</code>{' '}
              にベースパスを設定します。
            </p>
            <CodeBlock
              code={`// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/${repoName}/',
})`}
              index={4}
              copiedIndex={copiedIndex}
              onCopy={onCopy}
            />
            <p className="text-slate-600 mt-3 mb-3">
              GitHub Actions でデプロイを自動化するワークフローを作成します。
            </p>
            <CodeBlock
              code={`# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4`}
              index={5}
              copiedIndex={copiedIndex}
              onCopy={onCopy}
            />
          </div>
          <div className="border-t border-slate-200 pt-6">
            <h4 className="font-semibold text-slate-800 mb-2">
              オプション B: Vercel
            </h4>
            <p className="text-slate-600 mb-3">
              Vercel CLI を使ってデプロイします。
            </p>
            <CodeBlock
              code={`npm i -g vercel
vercel`}
              index={6}
              copiedIndex={copiedIndex}
              onCopy={onCopy}
            />
            <p className="text-slate-600 mt-3">
              プロンプトに従って設定を完了すると、自動的にデプロイされます。
              カスタムドメインを設定する場合は、Vercel のダッシュボードで{' '}
              <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">{domain}</code>{' '}
              を追加してください。
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'カスタムドメインの設定',
      icon: <Shield className="w-5 h-5" />,
      description:
        '独自ドメインを設定して、SSL証明書を有効にします。',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            DNS プロバイダーで以下のレコードを設定します。
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="border border-slate-200 px-4 py-2 text-left font-semibold">
                    タイプ
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-left font-semibold">
                    ホスト
                  </th>
                  <th className="border border-slate-200 px-4 py-2 text-left font-semibold">
                    値
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 px-4 py-2">CNAME</td>
                  <td className="border border-slate-200 px-4 py-2">
                    <code className="bg-slate-100 px-1 rounded">{domain}</code>
                  </td>
                  <td className="border border-slate-200 px-4 py-2">
                    <code className="bg-slate-100 px-1 rounded">
                      {ghUser}.github.io
                    </code>
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-200 px-4 py-2">TXT</td>
                  <td className="border border-slate-200 px-4 py-2">
                    <code className="bg-slate-100 px-1 rounded">_dnslink.{domain}</code>
                  </td>
                  <td className="border border-slate-200 px-4 py-2">
                    <code className="bg-slate-100 px-1 rounded">
                      dnslink=/ipfs/...
                    </code>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-slate-600 mt-2">
            GitHub Pages の場合、リポジトリの Settings → Pages → Custom domain に{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">{domain}</code>{' '}
            を入力し、「Enforce HTTPS」にチェックを入れてください。
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <strong>ヒント:</strong> DNS の反映には最大48時間かかることがあります。
            SSL 証明書は GitHub が自動的に Let&apos;s Encrypt で発行します。
          </div>
        </div>
      ),
    },
    {
      title: 'LPページの実装',
      icon: <Rocket className="w-5 h-5" />,
      description:
        'ランディングページのコンポーネントを作成し、レスポンシブデザインを実装します。',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            LP のメインコンポーネントを作成します。以下はヒーローセクションの例です。
          </p>
          <CodeBlock
            code={`// src/components/Hero.tsx
export default function Hero() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 text-white">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          あなたのサービス名
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto">
          サービスの魅力を伝えるキャッチコピーをここに入れます。
        </p>
        <a
          href="${lineUrl}"
          className="inline-block bg-[#06C755] hover:bg-[#05b54d] text-white font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          LINEで友だち追加
        </a>
      </div>
    </section>
  );
}`}
            index={7}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
          <p className="text-slate-600">
            OGP（Open Graph Protocol）メタタグを{' '}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm">index.html</code>{' '}
            に設定します。
          </p>
          <CodeBlock
            code={`<!-- index.html の <head> 内に追加 -->
<meta property="og:title" content="あなたのサービス名" />
<meta property="og:description" content="サービスの説明文" />
<meta property="og:image" content="https://${domain}/og-image.png" />
<meta property="og:url" content="https://${domain}" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />`}
            index={8}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
        </div>
      ),
    },
    {
      title: 'LINE連携とCTA設置',
      icon: <MessageCircle className="w-5 h-5" />,
      description:
        'LINE公式アカウントへの誘導ボタンとトラッキングを設定します。',
      content: (
        <div className="space-y-4">
          <p className="text-slate-600">
            LINE 友だち追加ボタンをフローティングで表示するコンポーネントを作成します。
          </p>
          <CodeBlock
            code={`// src/components/LineFloatingButton.tsx
export default function LineFloatingButton() {
  return (
    <a
      href="${lineUrl}"
      className="fixed bottom-6 right-6 z-50 bg-[#06C755] hover:bg-[#05b54d] text-white rounded-full p-4 shadow-xl transition-transform hover:scale-110"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LINEで友だち追加"
    >
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
    </a>
  );
}`}
            index={9}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
          <p className="text-slate-600">
            Google Tag Manager 経由で LINE ボタンのクリックを計測する場合は、
            以下のデータレイヤーイベントを追加します。
          </p>
          <CodeBlock
            code={`// クリックイベントの送信例
const handleLineClick = () => {
  window.dataLayer?.push({
    event: 'line_friend_add',
    click_url: '${lineUrl}',
  });
};`}
            index={10}
            copiedIndex={copiedIndex}
            onCopy={onCopy}
          />
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            <strong>完了!</strong>{' '}
            すべてのステップを完了すると、LPが公開され、LINEへの誘導が機能します。
            デプロイ後に{' '}
            <code className="bg-green-100 px-1 rounded">https://{domain}</code>{' '}
            にアクセスして動作を確認してください。
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isExpanded = expandedStep === index;
        const isCompleted = completedSteps.includes(index);

        return (
          <Card
            key={index}
            className={`overflow-hidden transition-all duration-200 ${
              isCompleted ? 'border-green-200 bg-green-50/30' : 'bg-white'
            }`}
          >
            <div className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                {/* Step completion toggle */}
                <button
                  onClick={() => onToggleStep(index)}
                  className="mt-0.5 flex-shrink-0 transition-colors"
                  aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300 hover:text-slate-400" />
                  )}
                </button>

                {/* Step content */}
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => onExpandStep(isExpanded ? null : index)}
                    className="w-full text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isCompleted
                            ? 'bg-green-100 text-green-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {step.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-lg font-semibold ${
                            isCompleted ? 'text-green-700' : 'text-slate-900'
                          }`}
                        >
                          <span className="text-slate-400 mr-2">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {step.title}
                        </h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {step.description}
                        </p>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Expandable content */}
                  {isExpanded && (
                    <div className="mt-6 pt-4 border-t border-slate-100">
                      {step.content}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
