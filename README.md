# 弈 · 五子棋

一个零依赖的响应式五子棋小游戏，静态资源位于 [`public/`](./public/) 目录。

## 功能

- 15×15 标准棋盘与横、竖、斜线五子连珠判定
- 双人对弈与简单人机对弈模式
- 悔棋、重新开局、胜负计分与和棋提示
- 最后一步标记、获胜连线高亮、落子音效
- 适配桌面端和移动端，并提供键盘可操作的棋盘格
- 本地注册、登录、退出与登录状态保持
- 棋盘透视倾斜、立体棋子与落子 3D 动效

> 当前版本是纯前端演示，账号数据保存在浏览器 `localStorage` 中，不适合存放真实敏感信息或用于生产环境。

## 使用 Wrangler 部署

本项目使用 **Cloudflare Workers Static Assets**，不是 Cloudflare Pages。仓库中的
[`wrangler.toml`](./wrangler.toml) 已配置：

```toml
[assets]
directory = "./public"
```

因此可以直接使用用户要求的命令部署：

```bash
npx wrangler login
npx wrangler deploy
```

也可以执行：

```bash
npm run deploy
```

不要使用 `npx wrangler pages deploy`，也不要配置 `pages_build_output_dir`。
Cloudflare 控制台如果设置了自定义部署命令，请填写 `npx wrangler deploy`。
构建命令可以留空，因为 `public/` 已经是完整的静态资源目录。

如果使用 API Token，Token 需要拥有目标账号的 Workers Scripts 编辑权限，
通常应包含 **Workers Scripts: Edit** 和 **Workers KV Storage: Edit**（仅静态资源部署
至少需要 Workers 部署相关权限），并且账号范围必须包含当前账号。
