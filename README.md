# RAG 知识库应用项目
## 📋 项目背景

在前面的课程中，我们已经：
- ✅ 学习了 RAG 的基础理论和技术背景
- ✅ 从 0 到 1 动手实现了一个 RAG 知识库

而本项目阶段的目标是：**将 RAG 知识库与 LangGraph 结合，应用到真实场景中**

我们将直接调用 **CNB 知识库 API**（基于 [CNB 知识库](https://docs.cnb.cool/zh/ai/knowledge-base.html)，只需上传 markdown 到指定 Git 仓库，即可自动构建知识库并提供 API 接口）

本项目还将使用 **LangGraph** 作为核心工作流引擎：
- **LangGraph**：用于构建复杂的 AI 工作流和状态管理
- **优势**：支持多步骤推理、条件分支、循环处理等复杂逻辑
- **应用**：非常适合实现 RAG 检索、多轮对话、深度研究等场景

---

## 🎯 项目任务

### 你将得到什么

**我会提供一个基础 Demo，包含：**
- ✅ 前端：基础的 Chat 对话 UI 界面（React）
- ✅ 后端：Python + LangGraph 工作流
- ✅ 集成：CNB 知识库 API 调用示例
- ✅ 功能：简单的一问一答对话

### 你需要做什么

**在 Demo 基础上，选择以下场景之一（或多个）进行开发：**

---

## 🚀 应用场景选择

### 场景 1：基于当前的 Demo 仓库增强对话功能 ⭐⭐
**要求：** 在 Demo 基础上增强对话功能

**核心功能：**
- 支持前端切换知识库（也就是不同的 Git 仓库），可以先查阅 [CNB 知识库 API 文档](https://docs.cnb.cool/zh/ai/knowledge-base.html) 了解如何使用 API 获取知识库列表和内容。
- 引用来源角标展示，点击角标可以跳转到对应的文档页面 （CNB知识库接口支持返回元数据包含文档标题、path、url 等）

---

### 场景 2：DeepResearch 网页对话 ⭐⭐⭐
**要求：** 在 Demo 基础上实现深度研究功能

**核心功能：**
- 多轮检索和推理（不是简单的一问一答）
- 结构化输出研究报告
- 实时流式输出
- 引用来源和溯源能力 （可选，加分项）

**与普通对话的区别：**
- 普通对话：问一次 → 检索一次 → 回答
- DeepResearch：问一次 → 拆解问题 → 多次检索 → 整合信息 → 生成报告

**资料：**
- [LangGraph DeepResearch 示例](https://academy.langchain.com/courses/deep-research-with-langgraph)

---

### 场景 3：企业微信 Bot / 客服号 ⭐⭐⭐⭐
**要求：** 接入企业微信，实现自动问答机器人

**核心功能：**
- 接入企业微信 API
- 处理用户消息回调
- 保持多轮对话的上下文
- 支持文本、图片等多种消息类型

---

### 场景 4：VuePress 文档插件 ⭐⭐⭐⭐
**要求：** 将 CNB 知识库嵌入到文档站点中（如 VuePress 等）

**核心功能：**
- 使用 CNB 知识库插件，扫描当前使用 VuePress 仓库搭建的文档站点，自动构建知识库
- 在 VuePress 文档页面中添加问答组件
- VuePress 插件请求业务后台（需要开发）进行 Chat，业务后台调用 CNB 知识库 API 进行问答， P.S. LLM 可使用本地 ollama

---

### 场景 5：语音对话知识库 ⭐⭐⭐⭐⭐
**要求：** 实现语音交互的知识库问答

**核心功能：**
- 可以使用语音对话方式与知识库进行问答

**技术方案参考：**
- 简单方案：Whisper (STT) + 本地 ollama LLM + TTS
- 高级方案：集成 VITA 等多模态模型

---

### 场景 6：其他创新应用 ⭐⭐⭐ ~ ⭐⭐⭐⭐⭐
**自由发挥，但需要包含知识库检索能力，并且具有创新性，例如：**
- 钉钉 Bot / 飞书 Bot
- Slack / Discord 集成
- VSCode 插件（在 IDE 中直接问答）
- 小程序
- 移动端 App
- ...（其他你能想到的场景）

---

## 🛠 技术栈

### 必须使用

- **前端**: Next.js
- **后端**: Python + LangGraph
- **知识库**: CNB API（只需调用 query 接口）
- **LLM**: 本地 ollama（或远程 API）
- **开发环境**: 
  - CNB 云原生开发环境 （一键启动模型、开发环境等）
  - Docker Compose


### 技术说明

**LangGraph 的作用：**
- 编排复杂的工作流（检索 → 判断 → 再检索 → 整合）
- 管理对话状态和上下文
- 实现条件分支和循环逻辑

**CNB 知识库 API：**
- 你只需在指定 Git 仓库上传 markdown 文档
- CNB 自动构建知识库并提供 API
- 调用 API 的 query 接口即可检索知识

**CNB 云原生环境 - 一键启动开发**

- 打开浏览器即可开发，无需本地配置
- 前后端项目、大模型服务，一键启动
- 配合 GPU 资源，可以直接使用 Ollama 运行开源大模型

---

## 🎁 加分项（可选）

如果你想获得更高分数，可以实现：

- ✨ **多知识库切换**：支持在多个知识库之间切换查询
- ✨ **对话历史管理**：保存和查看历史对话记录
- ✨ **用户认证系统**：登录、权限管理

---

## 📦 交付要求

### 1. 代码
- 完整的项目代码（基于 Demo 扩展）
- 代码规范，有必要的注释

### 2. 启动方式
- `docker-compose.yml` 配置文件
- 一键启动脚本
- 启动文档说明

### 3. 文档
- `README.md`：快速开始指南
- 架构设计说明
- API 使用文档
- 功能演示说明（配截图或视频）

### 4. 演示
- 可通过 CNB 云原生开发环境运行的在线 Demo 或演示视频 （showcase ： https://cnb.cool/examples/ecosystem/code-sandbox-in-cnb）
- 核心功能展示 （录制视频）
- 特色功能亮点说明 （文字说明）

---

## 📚 你会得到的资源

1. **Demo 源码仓库**（包含前后端基础代码）
2. **CNB 知识库 API 文档和调用示例**
3. **LangGraph 使用示例和最佳实践**
4. **常见问题解答**

---

## ⏰ 建议时间安排（4 周）

- **Week 1**：熟悉 Demo，理解 LangGraph 工作流，确定场景选择
- **Week 2-3**：核心功能开发
- **Week 4**：优化用户体验，完善细节

---

## 💡 常见问题

**Q: 我必须做 DeepResearch 吗？**  
A: 不是。5 个场景任选其一即可

**Q: 可以同时做多个场景吗？**  
A: 可以！建议先完成一个场景，再扩展其他场景。

**Q: LangGraph 是什么？为什么要用它？**  
A: LangGraph 是用于构建复杂 AI 工作流的框架，它可以帮你编排多步骤的推理和检索流程。是当前最流行的 AI 工作流框架之一。

**Q: CNB 知识库怎么用？**  
A: 你会得到一个 Git 仓库地址，上传 markdown 文件后，系统自动构建知识库。然后调用提供的 API 接口即可查询。

**Q: 必须用本地 ollama 吗？**  
A: 建议使用本地 ollama，因为 CNB 云原生开发环境带 GPU 资源，可以快速启动模型。

**Q: Docker Compose 不熟悉怎么办？**  
A: Demo 会提供完整的 `docker-compose.yml` 配置，你只需要按需修改即可。

---

## 🎓 学习目标

完成本项目后，你将掌握：

✅ 真实企业级项目中 RAG 的应用方式  
✅ LangGraph 工作流编排能力  
✅ 前后端分离架构设计  
✅ API 集成和调用最佳实践  
✅ 云原生应用开发
✅ 复杂 AI 应用的产品化思维  

---

## 🚀 开始你的项目吧！

**先让它跑起来，再让它跑得好！**

如有任何问题，随时在训练营群里提问。祝你项目顺利！🎉

## 📚 参考资料

- [CNB 知识库 API 文档](https://docs.cnb.cool/zh/ai/knowledge-base.html)
- [CNB 文档](https://docs.cnb.cool/zh/)
- [CNB 云原生开发](https://docs.cnb.cool/zh/workspaces/intro.html)
- [Next.js 官方文档](https://nextjs.org/docs)
- [LangGraph 官方文档](https://docs.langchain.com/oss/python/langgraph/overview)

## 本地开发

### 1. 前置要求

- Node.js 和 npm（或 yarn/pnpm）
- Python 3.11+
- CNB_TOKEN：后端 agent 需要 CNB TOKEN。
  - 进入 `backend/` 目录
  - 通过复制 `backend/.env.example` 文件创建一个名为 `.env` 的文件
  - 打开 `.env` 文件并添加你的 CNB TOKEN：`CNB_TOKEN="YOUR_CNB_TOKEN"`

### 2. 安装依赖

**后端：**
```bash
cd backend
pip install .
```

**前端：**
```bash
cd frontend
npm install
```

### 3. 运行开发服务器

**后端和前端：**
```bash
make dev
```

这将运行后端和前端开发服务器。打开浏览器并导航到前端开发服务器 URL（例如，http://localhost:5173/app）。

**或者，你可以分别运行后端和前端开发服务器：**

- **后端**：在 `backend/` 目录中打开一个终端并运行 `langgraph dev`。后端 API 将在 http://127.0.0.1:2024 可用。它还会打开一个浏览器窗口到 LangGraph UI。
- **前端**：在 `frontend/` 目录中打开一个终端并运行 `npm run dev`。前端将在 http://localhost:5173 可用。
