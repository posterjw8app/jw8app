# 弈 · 五子棋

一个零依赖的响应式五子棋小游戏，静态资源位于 `public/` 目录。

## 功能

- 15×15 标准棋盘与横、竖、斜线五子连珠判定
- 双人对弈与简单人机对弈模式
- 悔棋、重新开局、胜负计分与和棋提示
- 最后一步标记、获胜连线高亮、落子音效
- 适配桌面端和移动端，并提供键盘可操作的棋盘格
- 本地注册、登录、退出与登录状态保持

> 当前版本是纯前端演示，账号数据保存在浏览器 `localStorage` 中，不适合存放真实敏感信息或用于生产环境。

## 部署到 Cloudflare Pages

项目本身就是静态站点，源文件位于 [`public/`](./public/) 目录。部署时由
[`build.js`](./build.js) 将资源复制到 `dist/`，仓库中的 [`wrangler.toml`](./wrangler.toml)
已将 `dist/` 配置为 Pages 的静态输出目录。

### 命令行部署

```bash
npx wrangler login
npx wrangler pages project create jw8app
npm run deploy
```

### Cloudflare Dashboard 部署

- **Build command**：`npm run build`
- **Build output directory**：`dist`
- **Root directory**：`/`
- **Deploy command**：留空（Pages 会自动发布构建产物）

Cloudflare 会先执行 `npm run build`，再发布生成的 `dist/` 目录。也可以直接执行
`npm run deploy` 在本地完成构建和部署。

### 重要：删除错误的 Deploy command

如果日志中出现 `Executing user deploy command: npm run deploy`，说明
Cloudflare Pages 项目的 **Deploy command** 被填写了。Git 集成部署时不要填写该命令，
否则会在 Cloudflare 的构建环境里再次调用 Wrangler API。请在项目设置中删除该命令，
保存后重新部署：

1. 进入 **Workers & Pages → 你的 Pages 项目 → Settings → Builds & deployments**。
2. 将 **Deploy command** 清空（不要填写 `npx wrangler deploy`）。
3. 保留 **Build command** 为 `npm run build`，**Build output directory** 为 `dist`。
4. 重新触发部署。

`npx wrangler deploy` 是 **Workers** 命令，会寻找 Worker 入口文件或 Workers
Assets，因此会报 `Missing entry-point to Worker script or to assets directory`。

### Wrangler 命令行部署（可选）

如果不使用 Pages Git 集成，而是从本地或 CI 执行 `npm run deploy`，则
`CLOUDFLARE_API_TOKEN` 必须拥有目标账号的 **Cloudflare Pages: Edit** 权限，
并且 Token 的账号范围必须包含当前账号。日志中的
`Authentication error [code: 10000]` 表示 Token 权限或账号范围不正确，不是项目构建错误。
创建或更新 Token 后，在本地执行：

```bash
npm run deploy
```