# 定制游核价系统

基于 Figma 原型 UI 风格的定制旅游核价 H5 应用（第一期）。

## 结构

```
apps/web   Vue3 + Vite 移动端 H5
apps/api   Express API（北京模板 + 计价 + 分享链接）
prototypes UI 风格参考原型（Figma）
docs/      设计规格
```

## 启动

```bash
# 终端 1 - API（默认 3180）
cd apps/api && npm run dev

# 终端 2 - 前端（默认 10010）
cd apps/web && npm run dev
```

- 前端：http://localhost:10010
- API：http://localhost:3180（由前端 `/api` 代理，浏览器一般只访问 10010）

> 本项目前端使用 **10010**，API 使用 **3180**。  
> 若端口被占用，启动会直接报错（不会静默换端口）。可先执行 `lsof -iTCP:10010 -sTCP:LISTEN` 查看占用进程。

管理员账号保存在 `apps/api/data/app.db`（SQLite）。首次启动会自动创建默认管理员 `admin`，登录后可在右上角 **修改密码**。

核价维度与计价规则对齐 **《定制游核价系统.docx》**（11 个维度 + 公式）。  
运行时配置保存在 `apps/api/data/config.json`，管理员可在后台维护，保存后业务员端即时生效。

管理员入口：http://localhost:10010/admin/login → **维度与价格维护**

## 第一期已实现

- [x] 登录（账号密码）
- [x] 业务员核价向导（11 维度 + 景点排程）
- [x] 实时计价（北京模板）
- [x] 生成分享链接（7 天有效）
- [x] 客户 H5 报价页（行程 + 明细 + 联系顾问）
- [x] UI 沿用 prototypes 设计 Token

## 待迭代

- 管理员后台（维度/规则/公式维护）
- 长图 / PDF 导出
- PostgreSQL + Redis 持久化
- uni-app 小程序
