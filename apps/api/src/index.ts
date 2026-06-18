import cors from 'cors';
import express, { type Request } from 'express';
import { requireAdmin } from './middleware/auth.js';
import { calculateQuote, getDefaultSelections } from './services/calculator.js';
import { getDimensions, getAgencies, loadConfig, resetConfig, saveConfig } from './store/configStore.js';
import { createShare, getShare } from './store/shareStore.js';
import { findUserByUsername, updateUserPassword, verifyUserPassword } from './store/userStore.js';
import { generateImageFromSnapshot, generatePdfFromSnapshot } from './services/pdfExport.js';
import type { QuoteSelections, QuoteSharePayload, SystemConfig } from './types.js';

const app = express();
const PORT = Number(process.env.API_PORT ?? 3180);

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body ?? {};
  const user = findUserByUsername(String(username ?? '').trim());
  if (!user || !verifyUserPassword(user, String(password ?? ''))) {
    res.status(401).json({ message: '用户名或密码错误' });
    return;
  }
  const token = Buffer.from(`${user.id}:${Date.now()}`).toString('base64');
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role, name: user.name },
  });
});

app.post('/auth/change-password', requireAdmin, (req, res) => {
  const adminUser = (req as Request & { adminUser: { id: string; password: string } }).adminUser;
  const currentPassword = String(req.body?.currentPassword ?? '');
  const newPassword = String(req.body?.newPassword ?? '').trim();

  if (!verifyUserPassword(adminUser, currentPassword)) {
    res.status(400).json({ message: '当前密码不正确' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ message: '新密码至少 6 位' });
    return;
  }
  if (newPassword === currentPassword) {
    res.status(400).json({ message: '新密码不能与当前密码相同' });
    return;
  }

  updateUserPassword(adminUser.id, newPassword);
  res.json({ message: '密码已更新' });
});

app.get('/quote/dimensions', (_req, res) => {
  res.json({ dimensions: getDimensions() });
});

app.get('/quote/agencies', (_req, res) => {
  res.json({ agencies: getAgencies() });
});

app.get('/quote/defaults', (_req, res) => {
  res.json({ selections: getDefaultSelections() });
});

app.post('/quote/calculate', (req, res) => {
  try {
    const selections = req.body?.selections as QuoteSelections;
    const arrivalDate = req.body?.arrivalDate as string | undefined;
    const result = calculateQuote(selections, { arrivalDate });
    res.json(result);
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : '计算失败' });
  }
});

/** 管理员维护 docx 维度与价格（文档未要求登录，本地开发直接可用） */
app.get('/admin/config', (_req, res) => {
  res.json(loadConfig());
});

app.put('/admin/config', (req, res) => {
  try {
    const body = req.body as SystemConfig;
    if (!body?.dimensions?.length) {
      res.status(400).json({ message: 'dimensions 不能为空' });
      return;
    }
    saveConfig(body);
    res.json(loadConfig());
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : '保存失败' });
  }
});

app.post('/admin/config/reset', (_req, res) => {
  res.json(resetConfig());
});

/** 生成客户分享链接（7 天有效快照） */
app.post('/quote/export/link', (req, res) => {
  try {
    const body = req.body as QuoteSharePayload;
    if (!body?.meta || !Array.isArray(body.itineraryDays) || !Array.isArray(body.breakdown)) {
      res.status(400).json({ message: '方案数据不完整' });
      return;
    }
    if (typeof body.total !== 'number') {
      res.status(400).json({ message: '缺少方案总价' });
      return;
    }
    if (!body.meta.arrivalDate?.trim()) {
      res.status(400).json({ message: '请填写抵达日期' });
      return;
    }
    const snapshot = createShare(body);
    res.json({ id: snapshot.id, expiresAt: snapshot.expiresAt });
  } catch (e) {
    res.status(400).json({ message: e instanceof Error ? e.message : '生成失败' });
  }
});

/** 客户侧读取分享快照（公开，7 天 TTL） */
app.get('/share/:id', (req, res) => {
  const snapshot = getShare(req.params.id);
  if (!snapshot) {
    res.status(404).json({ message: '链接不存在或已过期' });
    return;
  }
  res.json(snapshot);
});

/** 生成 PDF（基于已创建的分享快照） */
app.post('/quote/export/pdf', async (req, res) => {
  try {
    const id = req.body?.id as string;
    if (!id) {
      res.status(400).json({ message: '缺少分享 ID' });
      return;
    }
    const snapshot = getShare(id);
    if (!snapshot) {
      res.status(404).json({ message: '链接不存在或已过期' });
      return;
    }
    const pdf = await generatePdfFromSnapshot(snapshot);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${id}.pdf"`);
    res.send(pdf);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : 'PDF 生成失败' });
  }
});

/** 生成长图 PNG（基于已创建的分享快照） */
app.post('/quote/export/image', async (req, res) => {
  try {
    const id = req.body?.id as string;
    if (!id) {
      res.status(400).json({ message: '缺少分享 ID' });
      return;
    }
    const snapshot = getShare(id);
    if (!snapshot) {
      res.status(404).json({ message: '链接不存在或已过期' });
      return;
    }
    const png = await generateImageFromSnapshot(snapshot);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="quote-${id}.png"`);
    res.send(png);
  } catch (e) {
    res.status(500).json({ message: e instanceof Error ? e.message : '长图生成失败' });
  }
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
