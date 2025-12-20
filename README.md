# 智能知识库问答系统

<div align="center">

**基于 LangGraph + CNB 知识库 API 的智能问答系统**

[![Python](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-19.0+-blue.svg)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/langgraph-0.2.6+-green.svg)](https://langchain-ai.github.io/langgraph/)

</div>

## 🎯 项目概述

智能知识库问答系统，支持多种对话模式和知识库源，能够进行深度研究和多轮检索推理。

**核心特性**
- ✨ **多知识库支持** - CNB 知识库和 Wikipedia 动态切换
- 🔍 **DeepResearch 模式** - 多轮迭代检索，生成综合研究报告
- 📚 **引用溯源** - 完整的来源引用和跳转功能
- 💬 **对话历史** - 会话管理和持久化
- 🚀 **一键部署** - Docker Compose 快速启动

---

## ✅ 核心功能

### 场景 1: 增强对话功能
- **知识库切换**: CNB 知识库 / Wikipedia 动态路由
- **引用来源**: 带编号的引用角标 `[1]` `[2]`，可点击跳转
- **对话模式**: RAG 模式 / GPT 模式 / DeepResearch 模式

### 场景 2: DeepResearch 深度研究
- **多轮检索**: 自动拆解问题，迭代式检索（最多 3 轮）
- **结构化报告**: 综合多轮检索结果的研究报告
- **实时进度**: 活动时间线显示每个研究步骤
- **多模型协作**: 不同阶段使用不同模型优化性能

---

## 🏗 技术栈

**前端**: React 19 + TypeScript + Vite + Tailwind CSS
**后端**: Python 3.11 + LangGraph + LangChain + FastAPI
**知识库**: CNB API + Wikipedia API
**模型**: Ollama (qwen2.5:7b, qwen2.5:3b)
**基础设施**: PostgreSQL + Redis + Docker Compose

---

## 🚀 快速开始

> 🎯 **开发者快速通道**: 克隆仓库后运行 `./setup-dev.sh` 一键配置开发环境！

### 方式一: Docker Compose (推荐)

```bash
# 1. 克隆仓库
git clone https://cnb.cool/stage1_basic/Andrew-project1.git
cd Andrew-project1

# 2. 设置环境变量
export LANGSMITH_API_KEY=your_langsmith_api_key
export CNB_TOKEN=your_cnb_token  # 可选

# 3. 启动服务
docker compose up
```

**访问应用**:
- 本地: http://localhost:8123/app/
- CNB: https://xxx-8123.cnb.run/app/

### 方式二: 本地开发

**前置要求**: Node.js 18+, Python 3.11+, Ollama

```bash
# 1. 安装 Ollama 和模型
brew install ollama
ollama serve
ollama pull qwen2.5:7b
ollama pull qwen2.5:3b

# 2. 配置环境变量
cd backend
cp .env.example .env
# 编辑 .env 文件，设置 LANGSMITH_API_KEY 等

# 3. 一键安装依赖 (推荐)
cd ..
./setup-dev.sh

# 或手动安装
python3 -m venv .venv && source .venv/bin/activate
cd backend && pip install . && cd ..
cd frontend && npm install --legacy-peer-deps && cd ..

# 4. 启动开发服务器
make dev

# 或分别启动
# 终端 1: cd backend && langgraph dev
# 终端 2: cd frontend && npm run dev
```

**访问应用**:
- 前端: http://localhost:5173/app
- 后端 API: http://localhost:2024
- LangGraph Studio: http://localhost:2024/studio

---

## 📖 使用指南

### 1. 选择知识库和模式
- 打开侧边栏
- 选择知识库: `CNB Knowledge Base` 或 `Wikipedia`
- 选择模式: `RAG Mode` (快速) / `GPT Mode` (最快) / `DeepResearch Mode` (深度)

### 2. 发起对话

**RAG 模式示例**:
- "What is LangGraph?"
- "How to use CNB knowledge base API?"

**DeepResearch 模式示例**:
- "What are the best practices for building RAG applications?"
- "Compare different approaches to implementing knowledge bases"

### 3. 查看引用来源
- 点击答案中的 `[1]` `[2]` 等角标跳转到原始文档
- 查看答案下方的完整来源列表

### 4. 管理对话历史
- **新建对话**: 点击侧边栏的 `New Chat` 按钮
- **切换对话**: 在对话列表中点击
- **删除对话**: 点击对话右侧的删除图标

---

## 💡 技术亮点

### LangGraph 工作流
```python
def route_to_workflow(state: AgentState) -> str:
    """根据模式路由到相应工作流"""
    if state.get("deep_research_mode"):
        return "deep_research"
    elif state.get("rag_enabled"):
        return "retrieve_knowledge"
    else:
        return "generate_answer"
```

### 知识库路由系统
```python
def route_knowledge_base_query(query: str, kb_type: str, repository: str):
    """统一的知识库查询接口"""
    if kb_type == "cnb":
        return cnb_retrieval.query_knowledge_base(...)
    elif kb_type == "wikipedia":
        return wikipedia_retrieval.search_wikipedia(...)
```

### 多模型协作
| 阶段 | 模型 | 用途 |
|------|------|------|
| Query 生成 | qwen2.5:3b | 快速生成搜索查询 |
| Reflection | qwen2.5:7b | 分析研究质量 |
| Report 生成 | qwen2.5:7b | 生成高质量报告 |

---

## 📊 性能指标

| 模式 | 响应时间 | 适用场景 |
|------|---------|---------|
| GPT Mode | 1-3 秒 | 通用问题 |
| RAG Mode | 3-5 秒 | 特定文档问答 |
| DeepResearch | 20-40 秒 | 复杂综合问题 |

---

## 🛠 开发相关

### 环境变量
```bash
# 必需
LANGSMITH_API_KEY=lsv2_pt_xxx

# 可选
CNB_TOKEN=your_cnb_token
OLLAMA_BASE_URL=http://localhost:11434
```

### 添加新知识库
1. 创建检索模块 `backend/src/agent/new_kb_retrieval.py`
2. 更新路由器 `backend/src/agent/kb_router.py`
3. 更新前端选项 `frontend/src/components/Sidebar.tsx`

### 运行测试
```bash
cd backend
pytest tests/
```

---

## 📁 项目结构

```
project-1-knowledge-base/
├── backend/
│   ├── src/agent/
│   │   ├── graph.py                  # 主工作流
│   │   ├── deep_research_graph.py    # DeepResearch 工作流
│   │   ├── kb_router.py              # 知识库路由
│   │   └── app.py                    # FastAPI 入口
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   └── components/
│   └── package.json
├── docker-compose.yml
├── setup-dev.sh                      # 🚀 一键开发环境设置
└── README.md
```

---

## 🎬 演示视频

📹 **视频演示**: [智能知识库问答系统完整演示](https://www.bilibili.com/video/BV17xqrBTE1r/?spm_id_from=333.1387.upload.video_card.click&vd_source=10b19242b93aea1bc527fd57b942b93a)

视频内容包含:
- ✅ 知识库切换演示 (CNB / Wikipedia)
- ✅ 引用来源功能展示
- ✅ DeepResearch 深度研究工作流
- ✅ 对话历史管理

---

## 📚 参考资料

- [LangGraph 官方文档](https://docs.langchain.com/oss/python/langgraph/overview)
- [CNB 知识库 API](https://docs.cnb.cool/zh/ai/knowledge-base.html)
- [DeepResearch 课程](https://academy.langchain.com/courses/deep-research-with-langgraph)

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star！**

Made with ❤️ by Andrew

</div>
