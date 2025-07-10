# Gemini CLI 沙箱环境运行指南

本文档说明如何在沙箱环境中运行Gemini CLI项目。

## ✅ 已完成的配置

### 1. 环境检查
- ✅ Node.js v23.10.0 (符合要求 >=20.0.0)
- ✅ npm v10.9.2
- ✅ Docker v27.5.1 (沙箱环境需要)

### 2. 项目构建
- ✅ 依赖安装完成 (`npm install`)
- ✅ 项目构建完成 (`npm run build:all`)
- ✅ Docker沙箱镜像构建完成 (`us-docker.pkg.dev/gemini-code-dev/gemini-cli/sandbox:0.1.9`)

### 3. 沙箱配置
- ✅ `.env` 文件已创建，配置了 `GEMINI_SANDBOX=docker`
- ✅ 沙箱环境验证通过

## 🔑 需要您完成的步骤

### 获取并配置API密钥

1. **获取Gemini API密钥**：
   - 访问 [Google AI Studio](https://aistudio.google.com/apikey)
   - 创建或获取您的API密钥

2. **配置API密钥**：
   编辑 `.env` 文件，将您的真实API密钥替换占位符：
   ```bash
   # 将这行：
   GEMINI_API_KEY=demo_key_please_replace_with_real_key
   
   # 替换为：
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## 🚀 启动项目

配置好API密钥后，运行：

```bash
npm start
```

## 🐳 沙箱环境说明

当前配置使用Docker沙箱环境，具有以下特点：

- **安全性**：代码在隔离的Docker容器中运行
- **文件访问**：项目目录和系统临时目录有读写权限
- **网络访问**：允许出站网络连接
- **自动管理**：容器随CLI启动/停止自动创建/销毁

## 🔧 其他沙箱选项

如果需要更改沙箱配置，可以修改 `.env` 文件中的 `GEMINI_SANDBOX` 值：

```bash
# 使用Docker (推荐)
GEMINI_SANDBOX=docker

# 使用Podman
GEMINI_SANDBOX=podman

# 禁用沙箱 (不推荐)
GEMINI_SANDBOX=false

# macOS Seatbelt (仅macOS)
GEMINI_SANDBOX=true  # 使用默认的permissive-open配置
```

## 🧪 测试验证

运行测试脚本验证环境：

```bash
node test-sandbox.js
```

## 📚 更多信息

- 详细文档：`./docs/sandbox.md`
- 贡献指南：`./CONTRIBUTING.md`
- 故障排除：`./docs/troubleshooting.md`

---

**注意**：首次运行可能需要下载Docker基础镜像，这可能需要一些时间。后续启动会很快。
