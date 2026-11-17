import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Github, Terminal, Rocket, FileCode, CheckCircle2 } from 'lucide-react';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);
  const [githubUser, setGithubUser] = useState('your-github-username');
  const [repoName, setRepoName] = useState('portfolio');
  const [isUserSite, setIsUserSite] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(id);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const calculatedBase = isUserSite ? '/' : `/${repoName || 'portfolio'}/`;
  const remoteUrl = `https://github.com/${githubUser}/${repoName}.git`;
  const siteUrl = isUserSite
    ? `https://${githubUser}.github.io`
    : `https://${githubUser}.github.io/${repoName}/`;

  const gitCommands = `# 1. Initialize local Git repository (if not already done)
git init
git add .
git commit -m "feat: my engineering portfolio"

# 2. Rename branch to main
git branch -M main

# 3. Add your remote repository on GitHub
git remote add origin ${remoteUrl}

# 4. Push your code to GitHub
git push -u origin main`;

  const viteConfigSnippet = `// in vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '${calculatedBase}', // Set for GitHub Pages
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});`;

  const githubActionsWorkflow = `name: Deploy Portfolio to GitHub Pages

on:
  push:
    branches: ["main"]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build static site
        run: npm run build

      - name: Setup GitHub Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <Github className="w-5 h-5 text-white" />
            <div>
              <h3 className="font-semibold text-base text-white">How to Host Your Portfolio on GitHub Pages</h3>
              <p className="text-xs text-slate-400">Complete, step-by-step guide with free automated hosting & SSL</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Config Helper */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Step 0: Customize Your Repository Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Your GitHub Username:
                </label>
                <input
                  type="text"
                  value={githubUser}
                  onChange={(e) => setGithubUser(e.target.value.trim() || 'your-username')}
                  className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. johndoe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Repository Name:
                </label>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value.trim() || 'portfolio')}
                  className="w-full text-xs font-mono px-3 py-1.5 border border-slate-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. portfolio"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isUserSiteCheck"
                checked={isUserSite}
                onChange={(e) => setIsUserSite(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isUserSiteCheck" className="text-xs text-slate-600">
                This repository is named <code className="font-mono text-slate-800">{githubUser}.github.io</code> (primary personal domain)
              </label>
            </div>

            <div className="text-xs text-slate-600 pt-1 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <span>
                Your live website address will be:
              </span>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"
              >
                {siteUrl} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Step 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">1</span>
              <h4 className="text-sm font-semibold text-slate-900">Create a New Repository on GitHub</h4>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              Log into <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-0.5">github.com/new <ExternalLink className="w-3 h-3" /></a>, enter <strong>{repoName}</strong> as Repository Name, choose <strong>Public</strong>, and leave checkboxes (README, .gitignore) unchecked.
            </p>
          </div>

          {/* Step 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">2</span>
              <h4 className="text-sm font-semibold text-slate-900">Set Vite Base Path in <code className="text-xs font-mono bg-slate-100 px-1 py-0.5 rounded">vite.config.ts</code></h4>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              Because GitHub Pages hosts subfolder repositories under <code>https://{githubUser}.github.io/{repoName}/</code>, Vite needs <code>base: '{calculatedBase}'</code>.
            </p>
            <div className="pl-8">
              <div className="relative bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono border border-slate-800">
                <button
                  onClick={() => copyToClipboard(viteConfigSnippet, 'vite-config')}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copiedItem === 'vite-config' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedItem === 'vite-config' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="overflow-x-auto pr-16">{viteConfigSnippet}</pre>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">3</span>
              <h4 className="text-sm font-semibold text-slate-900">Push Your Code via Terminal</h4>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              Open your project terminal on your computer and execute these commands:
            </p>
            <div className="pl-8">
              <div className="relative bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono border border-slate-800">
                <button
                  onClick={() => copyToClipboard(gitCommands, 'git-commands')}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copiedItem === 'git-commands' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedItem === 'git-commands' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="overflow-x-auto pr-16">{gitCommands}</pre>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">4</span>
              <h4 className="text-sm font-semibold text-slate-900">Add Automated GitHub Actions Deployment</h4>
            </div>
            <p className="text-xs text-slate-600 pl-8 leading-relaxed">
              Create a file at <code className="font-mono text-slate-900 font-medium">.github/workflows/deploy.yml</code> in your repository. GitHub will automatically build and publish your website whenever you push code!
            </p>
            <div className="pl-8">
              <div className="relative bg-slate-900 text-slate-200 rounded-lg p-3 text-xs font-mono border border-slate-800">
                <button
                  onClick={() => copyToClipboard(githubActionsWorkflow, 'workflow-yaml')}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  {copiedItem === 'workflow-yaml' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedItem === 'workflow-yaml' ? 'Copied' : 'Copy'}</span>
                </button>
                <pre className="overflow-x-auto max-h-56 pr-16">{githubActionsWorkflow}</pre>
              </div>
            </div>
          </div>

          {/* Step 5 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs flex items-center justify-center font-bold">5</span>
              <h4 className="text-sm font-semibold text-slate-900">Enable Pages in Repository Settings</h4>
            </div>
            <div className="pl-8 text-xs text-slate-600 space-y-1.5">
              <p>On your GitHub repo page:</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>Click <strong>Settings</strong> tab at the top.</li>
                <li>In the left menu, click <strong>Pages</strong>.</li>
                <li>Under <strong>Build and deployment &rarr; Source</strong>, select <strong>GitHub Actions</strong>.</li>
              </ol>
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-900 mt-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>That's all! Within 60 seconds, your site is live worldwide with free SSL at <strong className="font-mono">{siteUrl}</strong></span>
              </div>
            </div>
          </div>

          {/* Step 6: Adding Images */}
          <div className="space-y-2 border-t border-slate-200 pt-4">
            <h4 className="text-sm font-semibold text-slate-900">How to Add Your Actual Photos</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              When you have your real photos, CAD renders, or CFD screenshots ready:
            </p>
            <ul className="text-xs text-slate-600 list-disc pl-5 space-y-1">
              <li>Save them inside the <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">public/images/</code> folder in your project.</li>
              <li>Reference them directly in code or data as <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">./images/my-aircraft.jpg</code>.</li>
              <li>Or use the in-app photo previewer to test how they look before committing!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">Free, fast, permanent hosting on GitHub Pages</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
