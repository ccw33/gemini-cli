/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-pro';
export const DEFAULT_GEMINI_FLASH_MODEL = 'gemini-2.5-flash';
export const DEFAULT_GEMINI_EMBEDDING_MODEL = 'gemini-embedding-001';

// 通义千问/DeepSeek模型
export const DEFAULT_QWEN_MODEL = 'qwen-plus';
export const QWEN_MODELS = [
  'qwen-plus',
  'qwen-max-latest',
  'qvq-max-latest',
  'deepseek-r1',
  'deepseek-v3',
] as const;

export type QwenModel = typeof QWEN_MODELS[number];
