/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import OpenAI from 'openai';
import {
  CountTokensResponse,
  GenerateContentResponse,
  GenerateContentParameters,
  CountTokensParameters,
  EmbedContentResponse,
  EmbedContentParameters,
  Content,
  Part,
  GenerateContentResponseUsageMetadata,
  FinishReason,
  ContentListUnion,
  Candidate,
  FunctionCall,
  Tool,
} from '@google/genai';
import { ContentGenerator } from './contentGenerator.js';

// 扩展OpenAI类型以支持reasoning_content
interface ExtendedDelta extends OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta {
  reasoning_content?: string;
}

interface ExtendedChoice extends Omit<OpenAI.Chat.Completions.ChatCompletionChunk.Choice, 'delta'> {
  delta: ExtendedDelta;
}



/**
 * 通义千问/DeepSeek内容生成器，基于OpenAI兼容接口实现
 * 支持多种模型：qwen-plus, qwen-max-latest, qvq-max-latest, deepseek-r1, deepseek-v3
 * 支持文本、图像和视频识别功能
 * 这个类实现了ContentGenerator接口，使得这些模型可以与现有的Gemini CLI架构无缝集成
 */
export class QwenContentGenerator implements ContentGenerator {
  private client: OpenAI;
  private currentModel: string;

  constructor(apiKey: string, baseURL: string = 'https://dashscope.aliyuncs.com/compatible-mode/v1') {
    this.client = new OpenAI({
      apiKey,
      baseURL,
    });
    this.currentModel = 'qwen-plus'; // 默认模型
  }

  /**
   * 检查模型是否支持视觉功能
   */
  private supportsVision(model: string): boolean {
    return model.includes('qvq') || model.includes('qwen-max') || model.includes('deepseek');
  }

  /**
   * 检查模型是否支持推理内容（reasoning_content）
   */
  private supportsReasoning(model: string): boolean {
    return model.includes('qvq') || model.includes('deepseek-r1');
  }

  /**
   * 生成内容
   */
  async generateContent(request: GenerateContentParameters): Promise<GenerateContentResponse> {
    const contents = this.normalizeContents(request.contents);
    const messages = this.convertContentsToMessages(contents);
    const model = request.model || 'qwen-plus';
    this.currentModel = model;

    try {
      // 检查是否有工具调用
      const tools = this.convertGeminiToolsToOpenAI(request.config?.tools);

      const baseParams = {
        model,
        messages,
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxOutputTokens,
        stream: false as const,
      };

      const requestParams = tools && tools.length > 0
        ? { ...baseParams, tools, tool_choice: 'auto' as const }
        : baseParams;

      const completion = await this.client.chat.completions.create(requestParams);

      return this.convertOpenAIResponseToGemini(completion);
    } catch (error) {
      throw new Error(`通义千问API调用失败: ${error}`);
    }
  }

  /**
   * 生成流式内容
   */
  async generateContentStream(
    request: GenerateContentParameters
  ): Promise<AsyncGenerator<GenerateContentResponse>> {
    const contents = this.normalizeContents(request.contents);
    const messages = this.convertContentsToMessages(contents);
    const model = request.model || 'qwen-plus';
    this.currentModel = model;

    try {
      // 检查是否有工具调用
      const tools = this.convertGeminiToolsToOpenAI(request.config?.tools);

      const baseParams = {
        model,
        messages,
        temperature: request.config?.temperature,
        max_tokens: request.config?.maxOutputTokens,
        stream: true as const,
        stream_options: { include_usage: true },
      };

      const requestParams = tools && tools.length > 0
        ? { ...baseParams, tools, tool_choice: 'auto' as const }
        : baseParams;

      console.log('通义千问API请求参数:', JSON.stringify(requestParams, null, 2));

      const stream = await this.client.chat.completions.create(requestParams) as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      return this.convertOpenAIStreamToGemini(stream);
    } catch (error) {
      console.error('通义千问API调用详细错误:', error);
      throw new Error(`通义千问流式API调用失败: ${error}`);
    }
  }

  /**
   * 计算token数量（通义千问API可能不支持，返回估算值）
   */
  async countTokens(request: CountTokensParameters): Promise<CountTokensResponse> {
    // 通义千问API可能不直接支持token计数，这里提供一个简单的估算
    const contents = this.normalizeContents(request.contents);
    const text = this.extractTextFromContents(contents);
    const estimatedTokens = Math.ceil(text.length / 4); // 粗略估算：4个字符约等于1个token

    return {
      totalTokens: estimatedTokens,
    };
  }

  /**
   * 将ContentListUnion标准化为Content数组
   */
  private normalizeContents(contents: ContentListUnion): Content[] {
    if (typeof contents === 'string') {
      return [{
        role: 'user',
        parts: [{ text: contents }]
      }];
    }

    if (Array.isArray(contents)) {
      // 如果是Content数组，直接返回
      if (contents.length > 0 && typeof contents[0] === 'object' && 'role' in contents[0]) {
        return contents as Content[];
      }
      // 如果是Part数组，转换为单个Content
      return [{
        role: 'user',
        parts: contents as Part[]
      }];
    }

    // 如果是单个Content对象
    if (typeof contents === 'object' && 'role' in contents) {
      return [contents as Content];
    }

    // 如果是单个Part对象
    return [{
      role: 'user',
      parts: [contents as Part]
    }];
  }

  /**
   * 嵌入内容（通义千问可能不支持，抛出错误）
   */
  async embedContent(_request: EmbedContentParameters): Promise<EmbedContentResponse> {
    throw new Error('通义千问暂不支持嵌入功能');
  }

  /**
   * 将Gemini工具格式转换为OpenAI工具格式
   */
  private convertGeminiToolsToOpenAI(tools?: any[]): any[] | undefined {
    if (!tools || tools.length === 0) {
      return undefined;
    }

    return tools.map(tool => {
      // 如果工具有functionDeclarations，转换它们
      if (tool.functionDeclarations) {
        return tool.functionDeclarations.map((func: any) => ({
          type: 'function',
          function: {
            name: func.name,
            description: func.description,
            parameters: func.parameters || { type: 'object', properties: {} }
          }
        }));
      }

      // 如果是直接的函数声明
      if (tool.name && tool.description) {
        return {
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters || { type: 'object', properties: {} }
          }
        };
      }

      return tool;
    }).flat();
  }

  /**
   * 将Gemini格式的内容转换为OpenAI格式的消息
   */
  private convertContentsToMessages(contents: Content[]): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    for (const content of contents) {
      if (content.role === 'user') {
        // 检查是否包含多媒体内容
        const hasMultimedia = content.parts?.some(part =>
          (typeof part === 'object' && ('inlineData' in part || 'fileData' in part))
        );

        if (hasMultimedia && this.supportsVision(this.currentModel)) {
          // 使用多媒体内容格式
          messages.push({
            role: 'user',
            content: this.convertPartsToOpenAIContent(content.parts || []),
          });
        } else {
          // 使用纯文本格式
          messages.push({
            role: 'user',
            content: this.extractTextFromParts(content.parts),
          });
        }
      } else if (content.role === 'model') {
        // 检查是否有工具调用
        const functionCalls = this.extractFunctionCallsFromParts(content.parts);

        if (functionCalls.length > 0) {
          // 模型调用了工具
          const toolCalls = functionCalls
            .filter((fc): fc is FunctionCall & { name: string } => !!fc.name)
            .map((fc, index) => ({
              id: fc.id || `call_${Date.now()}_${index}`,
              type: 'function' as const,
              function: {
                name: fc.name,
                arguments: JSON.stringify(fc.args || {}),
              },
            }));

          messages.push({
            role: 'assistant',
            content: this.extractTextFromParts(content.parts) || null,
            tool_calls: toolCalls,
          });
        } else {
          // 普通的模型响应
          messages.push({
            role: 'assistant',
            content: this.extractTextFromParts(content.parts),
          });
        }
      } else if (content.role === 'function') {
        // 工具调用的结果
        const functionName = this.extractFunctionNameFromParts(content.parts);
        const functionResult = this.extractTextFromParts(content.parts);

        messages.push({
          role: 'tool',
          content: functionResult,
          tool_call_id: functionName || `call_${Date.now()}`,
        });
      } else if (content.role === 'system') {
        messages.push({
          role: 'system',
          content: this.extractTextFromParts(content.parts),
        });
      } else {
        // 默认作为用户消息处理
        messages.push({
          role: 'user',
          content: this.extractTextFromParts(content.parts),
        });
      }
    }

    return messages;
  }

  /**
   * 从Parts中提取文本内容
   */
  private extractTextFromParts(parts: Part[] | undefined): string {
    if (!parts) return '';

    return parts
      .map(part => {
        if (typeof part === 'string') {
          return part;
        }
        if (part.text) {
          return part.text;
        }
        // 对于其他类型的part（如图片、文件等），暂时忽略或返回占位符
        if (part.inlineData) {
          return '[图片内容]';
        }
        if (part.fileData) {
          return '[文件内容]';
        }
        return '';
      })
      .join('');
  }

  /**
   * 将Gemini的Part转换为OpenAI的消息内容
   */
  private convertPartsToOpenAIContent(parts: Part[]): any[] {
    const content: any[] = [];

    for (const part of parts) {
      if (typeof part === 'object') {
        if ('text' in part && part.text) {
          content.push({ type: 'text', text: part.text });
        } else if ('inlineData' in part && part.inlineData) {
          // 处理内联数据（图像/视频）
          const { mimeType, data } = part.inlineData;
          if (mimeType && mimeType.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${data}` }
            });
          } else if (mimeType && mimeType.startsWith('video/')) {
            content.push({
              type: 'video_url',
              video_url: { url: `data:${mimeType};base64,${data}` }
            });
          }
        } else if ('fileData' in part && part.fileData) {
          // 处理文件数据
          const { mimeType, fileUri } = part.fileData;
          if (mimeType && mimeType.startsWith('image/')) {
            content.push({
              type: 'image_url',
              image_url: { url: fileUri }
            });
          } else if (mimeType && mimeType.startsWith('video/')) {
            content.push({
              type: 'video_url',
              video_url: { url: fileUri }
            });
          }
        }
      } else if (typeof part === 'string') {
        content.push({ type: 'text', text: part });
      }
    }

    return content.length > 0 ? content : [{ type: 'text', text: '' }];
  }

  /**
   * 从内容中提取所有文本用于token计算
   */
  private extractTextFromContents(contents: Content[]): string {
    return contents
      .map(content => this.extractTextFromParts(content.parts))
      .join(' ');
  }

  /**
   * 从Parts中提取函数调用
   */
  private extractFunctionCallsFromParts(parts: Part[] | undefined): FunctionCall[] {
    if (!parts) return [];

    const functionCalls: FunctionCall[] = [];
    for (const part of parts) {
      if (typeof part === 'object' && 'functionCall' in part && part.functionCall) {
        functionCalls.push(part.functionCall as FunctionCall);
      }
    }
    return functionCalls;
  }

  /**
   * 从Parts中提取函数名称（用于工具调用结果）
   */
  private extractFunctionNameFromParts(parts: Part[] | undefined): string | undefined {
    if (!parts) return undefined;

    for (const part of parts) {
      if (typeof part === 'object' && 'functionResponse' in part && part.functionResponse) {
        return (part.functionResponse as any).name;
      }
    }
    return undefined;
  }

  /**
   * 将OpenAI响应转换为Gemini格式
   */
  private convertOpenAIResponseToGemini(response: OpenAI.Chat.Completions.ChatCompletion): GenerateContentResponse {
    const choice = response.choices[0];
    const message = choice.message;

    // 处理工具调用
    const functionCalls: FunctionCall[] = [];
    if (message.tool_calls && message.tool_calls.length > 0) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'function') {
          functionCalls.push({
            name: toolCall.function.name,
            args: JSON.parse(toolCall.function.arguments || '{}'),
            id: toolCall.id,
          });
        }
      }
    }

    const parts: Part[] = [];
    if (message.content) {
      parts.push({ text: message.content });
    }

    const candidate: Candidate = {
      content: {
        role: 'model',
        parts,
      },
      finishReason: this.convertFinishReason(choice.finish_reason),
      index: choice.index || 0,
    };

    const usageMetadata: GenerateContentResponseUsageMetadata = {
      promptTokenCount: response.usage?.prompt_tokens || 0,
      candidatesTokenCount: response.usage?.completion_tokens || 0,
      totalTokenCount: response.usage?.total_tokens || 0,
    };

    return {
      candidates: [candidate],
      usageMetadata,
      text: undefined,
      data: undefined,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
      executableCode: undefined,
      codeExecutionResult: undefined,
    };
  }

  /**
   * 将OpenAI流式响应转换为Gemini格式的异步生成器
   */
  private async *convertOpenAIStreamToGemini(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>
  ): AsyncGenerator<GenerateContentResponse> {
    let accumulatedText = '';
    let accumulatedReasoning = '';
    let finalUsage: any; // 使用any类型避免OpenAI类型问题
    let accumulatedToolCalls: any[] = [];
    let isAnswering = false;

    for await (const chunk of stream) {
      const choice = chunk.choices[0];
      const extendedChoice = choice as ExtendedChoice;

      // 处理推理内容（reasoning_content）- 仅对支持推理的模型
      if (extendedChoice?.delta?.reasoning_content && this.supportsReasoning(this.currentModel)) {
        const reasoningChunk = extendedChoice.delta.reasoning_content;
        accumulatedReasoning += reasoningChunk;

        // 如果这是第一个推理内容片段，添加标题
        if (accumulatedReasoning === reasoningChunk) {
          const headerCandidate: Candidate = {
            content: {
              role: 'model',
              parts: [{ text: '[思考过程] ' }],
            },
            finishReason: undefined,
            index: choice.index || 0,
          };

          yield {
            candidates: [headerCandidate],
            text: undefined,
            data: undefined,
            functionCalls: undefined,
            executableCode: undefined,
            codeExecutionResult: undefined,
          };
        }

        const candidate: Candidate = {
          content: {
            role: 'model',
            parts: [{ text: reasoningChunk }],
          },
          finishReason: undefined,
          index: choice.index || 0,
        };

        yield {
          candidates: [candidate],
          text: undefined,
          data: undefined,
          functionCalls: undefined,
          executableCode: undefined,
          codeExecutionResult: undefined,
        };
      }

      // 处理正式回复内容
      if (choice?.delta?.content) {
        if (!isAnswering && accumulatedReasoning && this.supportsReasoning(this.currentModel)) {
          // 如果之前有推理内容，现在开始正式回复，添加分隔符
          const separatorCandidate: Candidate = {
            content: {
              role: 'model',
              parts: [{ text: '\n\n[完整回复]\n\n' }],
            },
            finishReason: undefined,
            index: choice.index || 0,
          };

          yield {
            candidates: [separatorCandidate],
            text: undefined,
            data: undefined,
            functionCalls: undefined,
            executableCode: undefined,
            codeExecutionResult: undefined,
          };

          isAnswering = true;
        }

        accumulatedText += choice.delta.content;

        const candidate: Candidate = {
          content: {
            role: 'model',
            parts: [{ text: choice.delta.content }],
          },
          finishReason: choice.finish_reason ? this.convertFinishReason(choice.finish_reason) : undefined,
          index: choice.index || 0,
        };

        yield {
          candidates: [candidate],
          text: undefined,
          data: undefined,
          functionCalls: undefined,
          executableCode: undefined,
          codeExecutionResult: undefined,
        };
      }

      // 处理工具调用
      if (choice?.delta?.tool_calls) {
        for (const toolCallDelta of choice.delta.tool_calls) {
          if (toolCallDelta.index !== undefined) {
            // 确保数组有足够的空间
            while (accumulatedToolCalls.length <= toolCallDelta.index) {
              accumulatedToolCalls.push({});
            }

            const existingCall = accumulatedToolCalls[toolCallDelta.index];

            if (toolCallDelta.id) {
              existingCall.id = toolCallDelta.id;
            }
            if (toolCallDelta.type) {
              existingCall.type = toolCallDelta.type;
            }
            if (toolCallDelta.function) {
              if (!existingCall.function) {
                existingCall.function = {};
              }
              if (toolCallDelta.function.name) {
                existingCall.function.name = toolCallDelta.function.name;
              }
              if (toolCallDelta.function.arguments) {
                existingCall.function.arguments = (existingCall.function.arguments || '') + toolCallDelta.function.arguments;
              }
            }
          }
        }
      }

      // 如果这是最后一个chunk并且有工具调用，发送它们
      if (choice?.finish_reason && accumulatedToolCalls.length > 0) {
        const functionCalls: FunctionCall[] = accumulatedToolCalls
          .filter(call => call.type === 'function' && call.function?.name)
          .map(call => ({
            name: call.function.name,
            args: JSON.parse(call.function.arguments || '{}'),
            id: call.id,
          }));

        if (functionCalls.length > 0) {
          yield {
            candidates: [],
            text: undefined,
            data: undefined,
            functionCalls,
            executableCode: undefined,
            codeExecutionResult: undefined,
          };
        }
      }

      // 保存最终的使用统计信息
      if (chunk.usage) {
        finalUsage = chunk.usage;
      }
    }

    // 发送最终的使用统计信息
    if (finalUsage) {
      const usageMetadata: GenerateContentResponseUsageMetadata = {
        promptTokenCount: finalUsage.prompt_tokens || 0,
        candidatesTokenCount: finalUsage.completion_tokens || 0,
        totalTokenCount: finalUsage.total_tokens || 0,
      };

      yield {
        candidates: [],
        usageMetadata,
        text: undefined,
        data: undefined,
        functionCalls: undefined,
        executableCode: undefined,
        codeExecutionResult: undefined,
      };
    }
  }

  /**
   * 转换完成原因
   */
  private convertFinishReason(reason: string | null): FinishReason | undefined {
    switch (reason) {
      case 'stop':
        return FinishReason.STOP;
      case 'length':
        return FinishReason.MAX_TOKENS;
      case 'content_filter':
        return FinishReason.SAFETY;
      default:
        return FinishReason.OTHER;
    }
  }
}
