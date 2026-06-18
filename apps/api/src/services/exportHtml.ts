import type { QuoteShareSnapshot } from '../types.js';
import { groupBreakdown } from '../utils/breakdownGroups.js';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatExpires(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function renderShareHtml(snapshot: QuoteShareSnapshot): string {
  const agency = snapshot.agency;
  const phone = agency?.phone?.replace(/\D/g, '') ?? '';
  const expiresLabel = formatExpires(snapshot.expiresAt);

  const metaRows = [
    snapshot.meta.arrivalDisplay && { icon: '📅', text: snapshot.meta.arrivalDisplay },
    { icon: '👥', text: snapshot.meta.peopleLabel },
    snapshot.meta.stayLabel && { icon: '🏨', text: snapshot.meta.stayLabel },
    snapshot.meta.hotelLabel && { icon: '💎', text: snapshot.meta.hotelLabel },
    snapshot.meta.transportLine && { icon: '🚗', text: snapshot.meta.transportLine },
  ].filter(Boolean) as { icon: string; text: string }[];

  const timeline = snapshot.itineraryDays
    .map(
      (day) => `
      <li class="timeline-item">
        <span class="timeline-dot"></span>
        <div class="timeline-body">
          <div class="timeline-label">${esc(day.label)}</div>
          <div class="timeline-line">${esc(day.line)}</div>
        </div>
      </li>`,
    )
    .join('');

  const breakdown = groupBreakdown(snapshot.breakdown)
    .map(
      (item) => `
      <div class="cost-row">
        <span class="cost-label">${esc(item.label)}</span>
        <span class="cost-amount">¥${item.amount.toLocaleString()}</span>
      </div>`,
    )
    .join('');

  const brandHeader = agency
    ? `<div class="brand-badge">
        ${agency.logoUrl ? `<img class="brand-logo" src="${agency.logoUrl}" alt="" />` : ''}
        <span class="brand-name">${esc(agency.name)}</span>
      </div>`
    : `<div class="brand-badge"><span class="brand-name">专属方案</span></div>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${esc(snapshot.meta.title)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "PingFang SC", -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f4f6fb;
      color: #4d5260;
      padding: 24px;
    }
    .page { max-width: 430px; margin: 0 auto; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 16px;
    }
    .title {
      flex: 1;
      min-width: 0;
      font-size: 22px;
      font-weight: 700;
      color: #343b4d;
      line-height: 1.25;
    }
    .brand-badge {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 6px;
      max-width: 46%;
      text-align: right;
    }
    .brand-logo { width: 36px; height: 36px; object-fit: contain; border-radius: 8px; }
    .brand-name {
      font-size: 20px;
      font-weight: 700;
      color: #343b4d;
      line-height: 1.2;
      word-break: break-all;
    }
    .card {
      background: #fefefe; border: 1px solid #f0f1f5; border-radius: 12px;
      padding: 14px 16px; margin-bottom: 16px;
      box-shadow: 0 4px 16px rgba(52, 59, 77, 0.06);
    }
    .meta-row { display: flex; gap: 10px; padding: 6px 0; font-size: 14px; line-height: 1.5; }
    .meta-icon { width: 22px; text-align: center; flex-shrink: 0; }
    .section-title { font-size: 16px; font-weight: 700; color: #343b4d; margin-bottom: 12px; }
    .timeline { list-style: none; padding: 12px 16px; background: #fefefe; border: 1px solid #f0f1f5; border-radius: 12px; }
    .timeline-item { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
    .timeline-item:last-child { padding-bottom: 0; }
    .timeline-item:not(:last-child)::after {
      content: ''; position: absolute; left: 7px; top: 18px; bottom: 0; width: 2px; background: #d9defd;
    }
    .timeline-dot {
      width: 16px; height: 16px; border-radius: 50%; background: #5788f8; flex-shrink: 0; margin-top: 3px;
      box-shadow: 0 0 0 3px #f3f5fe;
    }
    .timeline-label { font-size: 12px; font-weight: 600; color: #3a76f9; margin-bottom: 4px; }
    .timeline-line { font-size: 14px; line-height: 1.5; word-break: break-word; }
    .cost-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f1f5; font-size: 14px; }
    .cost-row:last-of-type { border-bottom: none; }
    .cost-label { flex: 1; padding-right: 8px; }
    .cost-amount { font-weight: 600; color: #3f4451; white-space: nowrap; }
    .cost-total {
      display: flex; justify-content: space-between; padding: 12px 0 4px;
      margin-top: 4px; border-top: 2px solid #ecf5fd;
      font-size: 16px; font-weight: 700; color: #3a76f9;
    }
    .footer { text-align: center; margin-top: 20px; }
    .contact {
      display: flex; align-items: center; justify-content: center;
      padding: 12px; background: linear-gradient(135deg, #3a76f9, #5788f8);
      color: #fff; text-decoration: none; border-radius: 999px; font-weight: 600; margin-bottom: 12px;
      line-height: 1;
    }
    .legal { font-size: 12px; color: #9a9aad; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="page">
    <div class="page-header">
      <h1 class="title">${esc(snapshot.meta.title)}</h1>
      ${brandHeader}
    </div>
    <div class="card">
      ${metaRows.map((r) => `<div class="meta-row"><span class="meta-icon">${r.icon}</span><span>${esc(r.text)}</span></div>`).join('')}
    </div>
    <h2 class="section-title">行程安排</h2>
    <ol class="timeline">${timeline}</ol>
    <h2 class="section-title" style="margin-top:18px">费用明细</h2>
    <div class="card">
      ${breakdown}
      <div class="cost-total">
        <span>报价总计</span>
        <span>¥${snapshot.total.toLocaleString()}</span>
      </div>
    </div>
    <div class="footer">
      ${phone ? `<a class="contact" href="tel:${phone}">联系顾问 ${esc(agency!.phone)}</a>` : '<div class="contact">联系顾问</div>'}
      <p class="legal">报价有效期至 ${esc(expiresLabel)} · 价格仅供参考，以最终合同为准</p>
    </div>
  </div>
</body>
</html>`;
}
