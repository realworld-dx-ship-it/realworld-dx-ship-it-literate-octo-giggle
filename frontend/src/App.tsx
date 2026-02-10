import React, { useState } from 'react';
import DeploymentGuide from './components/DeploymentGuide';
import { Card } from './components/ui/card';
import { Button } from './components/ui/button';
import { BookOpen, Settings, Github, Globe, MessageCircle, Code } from 'lucide-react';

interface UserInfo {
  githubUsername: string;
  repositoryName: string;
  domain: string;
  lineUrl: string;
}

export default function App() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    githubUsername: '',
    repositoryName: '',
    domain: '',
    lineUrl: '',
  });

  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleStep = (stepIndex: number) => {
    setCompletedSteps((prev) =>
      prev.includes(stepIndex)
        ? prev.filter((id) => id !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const handleExpandStep = (stepIndex: number | null) => {
    setExpandedStep(stepIndex);
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const progress = Math.round((completedSteps.length / 6) * 100);

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-900 text-white mb-4 shadow-lg">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            LINE LP Deployment Guide
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            LPの制作から公開、LINE連携までをスムーズに行うためのインタラクティブガイドです。
            以下の情報を入力すると、手順内のコマンドやコードが自動で書き換わります。
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="p-6 md:p-8 bg-white shadow-xl border-slate-200">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
            <Settings className="w-6 h-6 text-slate-500" />
            <h2 className="text-xl font-bold text-slate-900">プロジェクト設定</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="githubUsername" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Github className="w-4 h-4" /> GitHub ユーザー名
              </label>
              <input
                type="text"
                id="githubUsername"
                name="githubUsername"
                value={userInfo.githubUsername}
                onChange={handleInputChange}
                placeholder="例: johndoe"
                className="w-full px-4 py-2 rounded-md border border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="repositoryName" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Code className="w-4 h-4" /> リポジトリ名
              </label>
              <input
                type="text"
                id="repositoryName"
                name="repositoryName"
                value={userInfo.repositoryName}
                onChange={handleInputChange}
                placeholder="例: line-lp-project"
                className="w-full px-4 py-2 rounded-md border border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="domain" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <Globe className="w-4 h-4" /> 公開予定ドメイン
              </label>
              <input
                type="text"
                id="domain"
                name="domain"
                value={userInfo.domain}
                onChange={handleInputChange}
                placeholder="例: lp.example.com"
                className="w-full px-4 py-2 rounded-md border border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lineUrl" className="text-sm font-medium text-slate-700 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" /> LINE 公式アカウントURL
              </label>
              <input
                type="text"
                id="lineUrl"
                name="lineUrl"
                value={userInfo.lineUrl}
                onChange={handleInputChange}
                placeholder="例: https://line.me/R/ti/p/@your-id"
                className="w-full px-4 py-2 rounded-md border border-slate-300 focus:border-slate-500 focus:ring-1 focus:ring-slate-500 outline-none transition"
              />
            </div>
          </div>
        </Card>

        {/* Progress Bar */}
        <div className="bg-white rounded-full h-4 w-full shadow-inner overflow-hidden border border-slate-200">
          <div
            className="h-full bg-slate-900 transition-all duration-500 ease-out flex items-center justify-end pr-2 text-[10px] text-white font-bold"
            style={{ width: `${Math.max(progress, 5)}%` }}
          >
            {progress}%
          </div>
        </div>

        {/* Guide Component */}
        <DeploymentGuide
          userInfo={userInfo}
          completedSteps={completedSteps}
          expandedStep={expandedStep}
          copiedIndex={copiedIndex}
          onToggleStep={handleToggleStep}
          onExpandStep={handleExpandStep}
          onCopy={handleCopy}
        />

        <div className="text-center text-slate-500 text-sm py-8">
          <p>Guide generated for modern React + Vite + Tailwind workflows.</p>
        </div>
      </div>
    </div>
  );
}
