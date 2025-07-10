# Gemini CLI - 通义千问/DeepSeek 模型集成更新

## 📋 更新概述

本次更新为 Gemini CLI 添加了对通义千问（Qwen）和 DeepSeek 模型的完整支持，包括图像/视频识别、推理内容显示和工具调用功能。

## 🚀 新增功能

### 1. 支持的新模型

- **qwen-plus** - 基础通义千问模型
- **qwen-max-latest** - 通义千问最新版本
- **qvq-max-latest** - 通义千问视觉推理模型（支持图像/视频识别）
- **deepseek-r1** - DeepSeek推理模型（支持思考过程显示）
- **deepseek-v3** - DeepSeek v3模型

### 2. 图像/视频识别功能

- 支持 `inlineData` 格式（base64编码的图像/视频）
- 支持 `fileData` 格式（文件URI的图像/视频）
- 自动转换为OpenAI兼容的 `image_url` 和 `video_url` 格式
- 智能检测模型是否支持视觉功能

### 3. 推理内容（Reasoning Content）支持

- 支持 qvq-max-latest 和 deepseek-r1 模型的思考过程显示
- 清晰的思考过程和最终回复分隔
- 流式输出推理内容
- 优化的显示格式，避免重复前缀

### 4. 工具调用功能

- 完整的 MCP 工具调用支持
- 与现有功能完全兼容
- 支持所有新模型的工具调用

## 🔧 技术实现

### 环境变量更新

```bash
# 旧的环境变量名
DASHSCOPE_API_KEY=your_api_key

# 新的环境变量名
QWEN_API_KEY=your_api_key
```

### 模型能力检测

```typescript
// 检查模型是否支持视觉功能
private supportsVision(model: string): boolean {
  return model.includes('qvq') || model.includes('qwen-max') || model.includes('deepseek');
}

// 检查模型是否支持推理内容
private supportsReasoning(model: string): boolean {
  return model.includes('qvq') || model.includes('deepseek-r1');
}
```

### 多媒体内容处理

- 自动检测 Gemini 格式的图像/视频内容
- 转换为 OpenAI 兼容格式
- 支持多种 MIME 类型

## 📁 修改的文件

### 核心文件

1. **`.env`** - 更新API密钥名称
2. **`packages/core/src/core/qwenContentGenerator.ts`** - 主要功能实现
   - 添加图像/视频内容处理
   - 实现推理内容流式输出
   - 扩展工具调用支持

3. **`packages/core/src/core/contentGenerator.ts`** - 更新模型配置逻辑
4. **`packages/core/src/config/models.ts`** - 添加新模型定义
5. **`packages/core/src/core/tokenLimits.ts`** - 更新token限制

### 认证相关

6. **`packages/cli/src/config/auth.ts`** - 更新认证验证
7. **`packages/cli/src/ui/components/AuthDialog.tsx`** - 更新UI显示

## 🎯 使用方法

### 启动不同模型

```bash
# 基础通义千问模型
npm start -- --model qwen-plus

# 通义千问最新版本
npm start -- --model qwen-max-latest

# 视觉推理模型（支持图像/视频）
npm start -- --model qvq-max-latest

# DeepSeek推理模型（支持思考过程）
npm start -- --model deepseek-r1

# DeepSeek v3模型
npm start -- --model deepseek-v3
```

### 环境配置

1. 在 `.env` 文件中设置API密钥：
```bash
QWEN_API_KEY=sk-your-api-key-here
```

2. 启动CLI并选择"通义千问 API Key"认证方式

## 🔍 功能验证

### 基本对话
- ✅ 所有模型支持中文对话
- ✅ 流式响应正常工作
- ✅ 错误处理完善

### MCP工具调用
- ✅ 支持所有MCP服务器
- ✅ 工具调用确认流程正常
- ✅ 工具执行结果正确返回

### 推理内容显示
- ✅ qvq-max-latest 和 deepseek-r1 支持思考过程显示
- ✅ 清晰的格式分隔
- ✅ 流式输出思考过程

### 图像/视频识别
- ✅ 支持多种图像格式
- ✅ 支持视频内容分析
- ✅ 自动格式转换

## 🐛 已修复的问题

### 1. 思考过程输出格式问题
**问题**：思考过程输出混乱，每个片段都有重复的前缀
```
✦ [思考过程] 好的[思考过程] ，[思考过程] 用户[思考过程] 问...
```

**解决方案**：
- 只在第一个推理内容片段前添加 `[思考过程]` 标题
- 后续片段直接输出，不重复添加前缀
- 添加清晰的分隔符区分思考过程和最终回复

### 2. MCP工具调用兼容性
**问题**：新模型不支持MCP工具调用

**解决方案**：
- 完整实现工具调用的请求/响应转换
- 支持流式工具调用处理
- 保持与现有功能的完全兼容

### 3. 环境变量命名优化
**问题**：原有的 `DASHSCOPE_API_KEY` 命名不够直观

**解决方案**：
- 更新为更直观的 `QWEN_API_KEY`
- 更新所有相关的配置和文档
- 保持向后兼容性提示

## 🔄 兼容性

- ✅ 与现有Gemini模型完全兼容
- ✅ 保持所有原有功能不变
- ✅ MCP服务器无需修改
- ✅ 用户配置向后兼容

## 📊 性能优化

- 智能模型能力检测，避免不必要的处理
- 高效的内容格式转换
- 优化的流式响应处理
- 合理的token限制配置

## 🔧 开发者信息

### 新增的类型定义

```typescript
// 扩展OpenAI类型以支持reasoning_content
interface ExtendedDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string;
}

// 通义千问/DeepSeek模型类型
export const QWEN_MODELS = [
  'qwen-plus',
  'qwen-max-latest',
  'qvq-max-latest',
  'deepseek-r1',
  'deepseek-v3',
] as const;

export type QwenModel = typeof QWEN_MODELS[number];
```

### 核心方法

```typescript
// 多媒体内容转换
private convertPartsToOpenAIContent(parts: Part[]): any[]

// 推理内容流式处理
private async *convertOpenAIStreamToGemini(
  stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
): AsyncGenerator<GenerateContentResponse>

// 模型能力检测
private supportsVision(model: string): boolean
private supportsReasoning(model: string): boolean
```

## 🎉 总结

本次更新成功将通义千问和DeepSeek模型完整集成到Gemini CLI中，提供了：

1. **5个新模型**的完整支持
2. **图像/视频识别**功能
3. **推理内容显示**功能
4. **完整的MCP工具调用**支持
5. **优化的用户体验**

所有功能都经过测试验证，可以投入生产使用。用户现在可以享受更强大的AI模型能力，同时保持熟悉的Gemini CLI操作体验。

## 📝 更新日志

- **2025-01-10**: 初始版本发布
  - 添加通义千问/DeepSeek模型支持
  - 实现图像/视频识别功能
  - 添加推理内容显示
  - 修复思考过程输出格式问题
  - 完善MCP工具调用兼容性

## 🤝 贡献

如果您在使用过程中遇到问题或有改进建议，欢迎提交Issue或Pull Request。

---

**注意**：使用新模型需要有效的通义千问API密钥。请确保在 `.env` 文件中正确配置 `QWEN_API_KEY`。