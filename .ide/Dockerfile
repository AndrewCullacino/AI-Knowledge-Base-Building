# 使用 Python 3.11 作为基础镜像
FROM python:3.11-bullseye

# 安装 Node.js 20 和 npm
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y nodejs

# 安装 code-server 和 vscode 常用插件
RUN curl -fsSL https://code-server.dev/install.sh | sh \
  && code-server --install-extension cnbcool.cnb-welcome \
  && code-server --install-extension redhat.vscode-yaml \
  && code-server --install-extension dbaeumer.vscode-eslint \
  && code-server --install-extension waderyan.gitblame \
  && code-server --install-extension mhutchie.git-graph \
  && code-server --install-extension donjayamanne.githistory \
  && code-server --install-extension tencent-cloud.coding-copilot \
  && code-server --install-extension ms-python.python \
  && echo done

# 安装系统依赖（git, wget, unzip, openssh-server, make, zsh 等）
RUN apt-get update && apt-get install -y \
  git \
  wget \
  unzip \
  openssh-server \
  make \
  build-essential \
  zsh \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# 升级 pip 和安装常用 Python 工具
RUN pip install --no-cache-dir --upgrade pip setuptools wheel

# 安装 Oh My Zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# 启用 Oh My Zsh 插件（git 插件提供 gaa, gcan!, ggpush, ggpull 等别名）
RUN sed -i 's/plugins=(git)/plugins=(git z extract colored-man-pages command-not-found)/g' /root/.zshrc

# 配置 git alias（常用快捷命令）
RUN git config --global alias.co checkout \
  && git config --global alias.br branch \
  && git config --global alias.ci commit \
  && git config --global alias.st status \
  && git config --global alias.unstage 'reset HEAD --' \
  && git config --global alias.last 'log -1 HEAD' \
  && git config --global alias.lg "log --color --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# 设置 zsh 为默认 shell
ENV SHELL /bin/zsh

# 指定字符集支持命令行输入中文
ENV LANG C.UTF-8
ENV LANGUAGE C.UTF-8
ENV LC_ALL C.UTF-8
