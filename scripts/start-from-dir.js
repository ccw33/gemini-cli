#!/usr/bin/env node

/**
 * 从指定目录启动 Gemini CLI 的脚本
 * 用法: npm run start:from -- /path/to/project [其他参数]
 * 示例: npm run start:from -- /Users/john/my-project --model qwen-plus
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// 获取命令行参数
const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('错误: 请指定目标目录');
  console.error('用法: npm run start:from -- /path/to/project [其他参数]');
  console.error('示例: npm run start:from -- /Users/john/my-project --model qwen-plus');
  process.exit(1);
}

const targetDir = args[0];
const geminiArgs = args.slice(1);

// 检查目标目录是否存在
if (!existsSync(targetDir)) {
  console.error(`错误: 目录不存在: ${targetDir}`);
  process.exit(1);
}

// 检查 bundle 是否存在
const bundlePath = resolve(projectRoot, 'bundle/gemini.js');
if (!existsSync(bundlePath)) {
  console.error('错误: 找不到构建后的 bundle，请先运行 npm run build');
  process.exit(1);
}

console.log(`🚀 从目录启动 Gemini CLI: ${targetDir}`);
console.log(`📦 使用 bundle: ${bundlePath}`);
if (geminiArgs.length > 0) {
  console.log(`⚙️  参数: ${geminiArgs.join(' ')}`);
}

// 切换到目标目录并启动 Gemini CLI
const child = spawn('node', [bundlePath, ...geminiArgs], {
  cwd: targetDir,
  stdio: 'inherit',
  env: process.env
});

child.on('exit', (code) => {
  process.exit(code);
});

child.on('error', (error) => {
  console.error('启动失败:', error);
  process.exit(1);
});
