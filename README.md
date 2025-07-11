# Gemini CLI 中国模型适配版

适配中国模型，如千问、deepseek

## 🚀 快速开始

### 本地安装和运行源码

1. **环境要求**: 确保安装了 [Node.js 20](https://nodejs.org/en/download) 或更高版本
2. **克隆仓库**:
   ```bash
   git clone https://github.com/ccw33/gemini-cli-chinese.git
   cd gemini-cli
   ```
3. **安装依赖**:
   ```bash
   npm ci
   ```
4. **构建项目**:
   ```bash
   npm run build
   ```
5. **配置环境变量** (根据使用的模型):
   ```bash
   # 使用Gemini模型
   export GEMINI_API_KEY="YOUR_GEMINI_API_KEY"

   # 使用通义千问模型
   export QWEN_API_KEY="YOUR_QWEN_API_KEY"

   # 使用Vertex AI
   export GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
   export GOOGLE_GENAI_USE_VERTEXAI=true
   ```

6. **运行CLI**:
   ```bash
   npm start
   ```
   或指定模型运行:
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

### 支持的AI模型

本CLI支持以下AI模型：

#### Gemini 模型
- **gemini-2.5-pro** - Google Gemini 2.5 Pro (默认)
- **gemini-2.5-flash** - Google Gemini 2.5 Flash (快速版本)

#### 通义千问模型
- **qwen-plus** - 基础通义千问模型
- **qwen-max-latest** - 通义千问最新版本
- **qvq-max-latest** - 通义千问视觉推理模型（支持图像/视频识别）

#### DeepSeek模型
- **deepseek-r1** - DeepSeek推理模型（支持思考过程显示）
- **deepseek-v3** - DeepSeek v3模型

### 配置GEMINI.md

`GEMINI.md` 文件是项目的上下文文件，用于为AI提供项目相关的背景信息和指导原则。

1. **创建GEMINI.md文件**: 在项目根目录创建 `GEMINI.md` 文件
2. **添加项目信息**: 包含项目架构、编码规范、测试指南等
3. **自定义文件名**: 可在 `.gemini/settings.json` 中配置:
   ```json
   {
     "contextFileName": "CUSTOM.md"
   }
   ```
   或配置多个文件:
   ```json
   {
     "contextFileName": ["GEMINI.md", "DOCS.md", "GUIDE.md"]
   }
   ```

### 配置MCP (Model Context Protocol)

MCP服务器允许CLI连接外部工具和数据源。

1. **创建配置文件**: 在项目根目录创建 `.gemini/settings.json`
2. **配置MCP服务器**:
   ```json
   {
     "mcpServers": {
       "pythonTools": {
         "command": "python",
         "args": ["-m", "my_mcp_server", "--port", "8080"],
         "cwd": "./mcp-servers/python",
         "env": {
           "API_KEY": "$EXTERNAL_API_KEY"
         },
         "timeout": 15000
       },
       "nodeServer": {
         "command": "node",
         "args": ["dist/server.js", "--verbose"],
         "cwd": "./mcp-servers/node",
         "trust": true
       },
       "dockerServer": {
         "command": "docker",
         "args": [
           "run", "-i", "--rm",
           "-e", "API_KEY",
           "-v", "${PWD}:/workspace",
           "my-mcp-server:latest"
         ],
         "env": {
           "API_KEY": "$EXTERNAL_SERVICE_TOKEN"
         }
       }
     }
   }
   ```

3. **MCP配置参数说明**:
   - `command`: 启动MCP服务器的命令
   - `args`: 命令参数
   - `env`: 环境变量（支持 `$VAR_NAME` 和 `${VAR_NAME}` 语法）
   - `cwd`: 工作目录
   - `timeout`: 请求超时时间（毫秒）
   - `trust`: 是否信任服务器（跳过工具调用确认）

---

[![Gemini CLI CI](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/google-gemini/gemini-cli/actions/workflows/ci.yml)

![Gemini CLI Screenshot](./docs/assets/gemini-screenshot.png)

This repository contains the Gemini CLI, a command-line AI workflow tool that connects to your
tools, understands your code and accelerates your workflows.

With the Gemini CLI you can:

- Query and edit large codebases in and beyond Gemini's 1M token context window.
- Generate new apps from PDFs or sketches, using Gemini's multimodal capabilities.
- Automate operational tasks, like querying pull requests or handling complex rebases.
- Use tools and MCP servers to connect new capabilities, including [media generation with Imagen,
  Veo or Lyria](https://github.com/GoogleCloudPlatform/vertex-ai-creative-studio/tree/main/experiments/mcp-genmedia)
- Ground your queries with the [Google Search](https://ai.google.dev/gemini-api/docs/grounding)
  tool, built in to Gemini.

## Quickstart

1. **Prerequisites:** Ensure you have [Node.js version 20](https://nodejs.org/en/download) or higher installed.
2. **Run the CLI:** Execute the following command in your terminal:

   ```bash
   npx https://github.com/google-gemini/gemini-cli
   ```

   Or install it with:

   ```bash
   npm install -g @google/gemini-cli
   gemini
   ```

3. **Pick a color theme**
4. **Authenticate:** When prompted, sign in with your personal Google account. This will grant you up to 60 model requests per minute and 1,000 model requests per day using Gemini.

You are now ready to use the Gemini CLI!

### Use a Gemini API key:

The Gemini API provides a free tier with [100 requests per day](https://ai.google.dev/gemini-api/docs/rate-limits#free-tier) using Gemini 2.5 Pro, control over which model you use, and access to higher rate limits (with a paid plan):

1. Generate a key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key.

   ```bash
   export GEMINI_API_KEY="YOUR_API_KEY"
   ```

3. (Optionally) Upgrade your Gemini API project to a paid plan on the API key page (will automatically unlock [Tier 1 rate limits](https://ai.google.dev/gemini-api/docs/rate-limits#tier-1))

### Use a Vertex AI API key:

The Vertex AI provides [free tier](https://cloud.google.com/vertex-ai/generative-ai/docs/start/express-mode/overview) using express mode for Gemini 2.5 Pro, control over which model you use, and access to higher rate limits with a billing account:

1. Generate a key from [Google Cloud](https://cloud.google.com/vertex-ai/generative-ai/docs/start/api-keys).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key and set GOOGLE_GENAI_USE_VERTEXAI to true

   ```bash
   export GOOGLE_API_KEY="YOUR_API_KEY"
   export GOOGLE_GENAI_USE_VERTEXAI=true
   ```

3. (Optionally) Add a billing account on your project to get access to [higher usage limits](https://cloud.google.com/vertex-ai/generative-ai/docs/quotas)

### Use 通义千问 API key:

通义千问 provides powerful Chinese language models with competitive pricing and performance:

1. Generate a key from [阿里云百炼平台](https://bailian.console.aliyun.com/).
2. Set it as an environment variable in your terminal. Replace `YOUR_API_KEY` with your generated key.

   ```bash
   export QWEN_API_KEY="YOUR_API_KEY"
   ```

3. The CLI will automatically detect the API key and offer 通义千问 as an authentication option.

For other authentication methods, including Google Workspace accounts, see the [authentication](./docs/cli/authentication.md) guide.

## Examples

Once the CLI is running, you can start interacting with Gemini from your shell.

You can start a project from a new directory:

```sh
cd new-project/
gemini
> Write me a Gemini Discord bot that answers questions using a FAQ.md file I will provide
```

Or work with an existing project:

```sh
git clone https://github.com/google-gemini/gemini-cli
cd gemini-cli
gemini
> Give me a summary of all of the changes that went in yesterday
```

### Next steps

- Learn how to [contribute to or build from the source](./CONTRIBUTING.md).
- Explore the available **[CLI Commands](./docs/cli/commands.md)**.
- If you encounter any issues, review the **[Troubleshooting guide](./docs/troubleshooting.md)**.
- For more comprehensive documentation, see the [full documentation](./docs/index.md).
- Take a look at some [popular tasks](#popular-tasks) for more inspiration.

### Troubleshooting

Head over to the [troubleshooting](docs/troubleshooting.md) guide if you're
having issues.

## Popular tasks

### Explore a new codebase

Start by `cd`ing into an existing or newly-cloned repository and running `gemini`.

```text
> Describe the main pieces of this system's architecture.
```

```text
> What security mechanisms are in place?
```

### Work with your existing code

```text
> Implement a first draft for GitHub issue #123.
```

```text
> Help me migrate this codebase to the latest version of Java. Start with a plan.
```

### Automate your workflows

Use MCP servers to integrate your local system tools with your enterprise collaboration suite.

```text
> Make me a slide deck showing the git history from the last 7 days, grouped by feature and team member.
```

```text
> Make a full-screen web app for a wall display to show our most interacted-with GitHub issues.
```

### Interact with your system

```text
> Convert all the images in this directory to png, and rename them to use dates from the exif data.
```

```text
> Organize my PDF invoices by month of expenditure.
```

### Uninstall

Head over to the [Uninstall](docs/Uninstall.md) guide for uninstallation instructions.

## Terms of Service and Privacy Notice

For details on the terms of service and privacy notice applicable to your use of Gemini CLI, see the [Terms of Service and Privacy Notice](./docs/tos-privacy.md).
