const mainApp = document.querySelector(".main");
import Storage from "./API.js";
import { formatDMY, daysUntil } from "./dateUtils.js";

class DashboardUi {
  setApp() {
    const rows = Storage.getMergedStock();
    const plans = Storage.getMergedPlans();
    const runs = Storage.getMergedProductionRuns();
    const categoriesCount = Storage.getCategories().length;

    // Calculate totals
    const totalMaterials = rows.length;
    const totalQuantity = rows.reduce((acc, r) => acc + (r.quantity || 0), 0);
    const pendingPlansCount = plans.filter(p => p.status !== 'complete').length;
    const pendingRunsCount = runs.filter(r => r.status === 'pending').length;

    // Get Warnings (Expired & Expiring soon, Insufficient production stock)
    const expiryWarnings = this.getExpiryWarnings(rows);
    const productionWarnings = this.getProductionWarnings(runs);

    // Get items recorded today
    const today = new Date();
    const todayDateString = today.toDateString();
    const recordedToday = rows.filter(r => {
      if (!r.stock_updated_at) return false;
      const updatedDate = new Date(r.stock_updated_at);
      return updatedDate.toDateString() === todayDateString;
    });
    const recordedTodayHtml = this.getRecordedTodayHtml(recordedToday);

    // Get upcoming entries (top 3)
    const upcomingPlans = this.getUpcomingPlans(plans);
    const upcomingRuns = this.getUpcomingRuns(runs);

    // Get type breakdown HTML
    const breakdownHtml = this.typeBreakdownModern(rows, totalQuantity);

    mainApp.innerHTML = `
    <div class="dashboardUi" style="background: transparent; padding: 0;">
      <div class="dashboardUi__header" style="margin-bottom: 1.5rem;">
        <h1 style="font-size: 1.8rem; font-weight: 700; color: #0f172a;">ภาพรวมระบบ</h1>
        <p style="font-size: 0.9rem; color: #64748b; margin-top: 0.25rem;">รายงานสถานะการจัดการคลังวัตถุดิบ แผนรับเข้า และแผนการผลิตบรรจุภัณฑ์</p>
      </div>

      <!-- KPI Metrics Grid -->
      <div class="dashboard-kpi-grid">
        <div class="dashboard-kpi-card">
          <div class="dashboard-kpi-icon dashboard-kpi-icon--blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div class="dashboard-kpi-info">
            <span class="dashboard-kpi-value">${totalMaterials.toLocaleString()}</span>
            <span class="dashboard-kpi-label">รายการวัสดุทั้งหมด</span>
          </div>
        </div>

        <div class="dashboard-kpi-card">
          <div class="dashboard-kpi-icon dashboard-kpi-icon--green">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
          </div>
          <div class="dashboard-kpi-info">
            <span class="dashboard-kpi-value">${totalQuantity.toLocaleString()}</span>
            <span class="dashboard-kpi-label">ยอดคงเหลือรวม (PC)</span>
          </div>
        </div>

        <div class="dashboard-kpi-card">
          <div class="dashboard-kpi-icon dashboard-kpi-icon--purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
          </div>
          <div class="dashboard-kpi-info">
            <span class="dashboard-kpi-value">${pendingPlansCount.toLocaleString()}</span>
            <span class="dashboard-kpi-label">แผนรับเข้าที่รอรับ</span>
          </div>
        </div>

        <div class="dashboard-kpi-card">
          <div class="dashboard-kpi-icon dashboard-kpi-icon--orange">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;"><path d="M2 22V12l8 4V8l8 4V4h4v18H2z"></path></svg>
          </div>
          <div class="dashboard-kpi-info">
            <span class="dashboard-kpi-value">${pendingRunsCount.toLocaleString()}</span>
            <span class="dashboard-kpi-label">แผนการผลิตที่ค้าง</span>
          </div>
        </div>
      </div>

      <div class="dashboard-quick-actions dashboard-section-spacing">
        <a href="./index.html" class="dashboard-action-btn">
          <span class="dashboard-action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; margin: 0 auto 2px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </span>
          <span class="dashboard-action-btn-text">บันทึกยอดนับจริง</span>
        </a>
        <a href="./planning.html" class="dashboard-action-btn">
          <span class="dashboard-action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; margin: 0 auto 2px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </span>
          <span class="dashboard-action-btn-text">สร้างแผนรับเข้า</span>
        </a>
        <a href="./production.html" class="dashboard-action-btn">
          <span class="dashboard-action-btn-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; margin: 0 auto 2px;"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </span>
          <span class="dashboard-action-btn-text">วางแผนการผลิต</span>
        </a>
      </div>

      <!-- Main Dashboard Grid Layout -->
      <div class="dashboard-grid">
        <!-- Left Column: Tasks / Alerts / Warnings / Schedules -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          
          <!-- Alerts Card -->
          <div class="dashboard-card">
            <h3>
              <span class="dashboard-card-title-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                การแจ้งเตือนที่สำคัญ
              </span>
              ${(expiryWarnings.count + productionWarnings.count) > 0 ? `<span class="dashboard-badge-red">${expiryWarnings.count + productionWarnings.count} เรื่อง</span>` : `<span class="dashboard-badge-blue" style="background:#d1fae5; color:#065f46;">ปกติ</span>`}
            </h3>
            <div class="dashboard-warning-list">
              ${expiryWarnings.html}
              ${productionWarnings.html}
              ${(expiryWarnings.count === 0 && productionWarnings.count === 0) ? `
                <div style="text-align: center; padding: 2rem 0; color: #64748b;">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block; margin: 0 auto 0.5rem;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  <p style="font-size: 0.9rem;">คลังวัตถุดิบของคุณปกติดี ไม่พบวันหมดอายุหรือสต็อกขาดแคลน</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Recorded Today Card -->
          <div class="dashboard-card">
            <h3>
              <span class="dashboard-card-title-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                รายการที่บันทึกยอดวันนี้
              </span>
              <span class="dashboard-badge-blue" style="background:#e0f2fe; color:#0369a1;">${recordedToday.length} รายการ</span>
            </h3>
            <div class="dashboard-list">
              ${recordedTodayHtml}
            </div>
          </div>

          <!-- Upcoming Receiving Deliveries -->
          <div class="dashboard-card">
            <h3>
              <span class="dashboard-card-title-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                แผนรับเข้าบรรจุภัณฑ์เร็ว ๆ นี้
              </span>
              <a href="./planning.html" style="font-size: 0.8rem; color: var(--color-primary-color); font-weight: 500;">ดูทั้งหมด &rsaquo;</a>
            </h3>
            <div class="dashboard-list">
              ${upcomingPlans}
            </div>
          </div>

          <!-- Upcoming Production Runs -->
          <div class="dashboard-card">
            <h3>
              <span class="dashboard-card-title-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px;"><path d="M2 22V12l8 4V8l8 4V4h4v18H2z"></path></svg>
                แผนการผลิตเร็ว ๆ นี้
              </span>
              <a href="./production.html" style="font-size: 0.8rem; color: var(--color-primary-color); font-weight: 500;">ดูทั้งหมด &rsaquo;</a>
            </h3>
            <div class="dashboard-list">
              ${upcomingRuns}
            </div>
          </div>

        </div>

        <!-- Right Column: Breakdown & Statistics -->
        <div style="display: flex; flex-direction: column; gap: 1.5rem;">
          <!-- Stock Breakdown by Type -->
          <div class="dashboard-card" style="height: 100%;">
            <h3>
              <span class="dashboard-card-title-text">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:6px;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                สัดส่วนยอดคงเหลือแยกตามประเภท
              </span>
              <span class="dashboard-badge-blue">${categoriesCount} หมวดหมู่</span>
            </h3>
            <div style="display: flex; flex-direction: column; gap: 0.85rem;">
              ${breakdownHtml}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }

  // Get Expiry Warnings html and count
  getExpiryWarnings(rows) {
    let count = 0;
    let html = '';

    const warnings = [];
    rows.forEach(r => {
      if (r.recorded && r.best_before) {
        const remaining = daysUntil(r.best_before);
        if (remaining !== null) {
          if (remaining < 0) {
            warnings.push({ row: r, type: 'expired', days: remaining });
          } else if (remaining <= 14) {
            warnings.push({ row: r, type: 'soon', days: remaining });
          }
        }
      }
    });

    // Sort: expired first, then closest to expire
    warnings.sort((a, b) => a.days - b.days);

    // Limit to top 5 warnings on dashboard to prevent clutter
    const displayed = warnings.slice(0, 5);
    displayed.forEach(w => {
      count++;
      if (w.type === 'expired') {
        html += `
          <div class="dashboard-warning-item">
            <div class="dashboard-warning-info">
              <span class="dashboard-warning-name">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                ${w.row.material_name} (รหัส ${w.row.material})
              </span>
              <span class="dashboard-warning-meta">หมดอายุเมื่อ: ${formatDMY(w.row.best_before)}</span>
            </div>
            <span class="dashboard-badge-red">หมดอายุแล้ว ${Math.abs(w.days)} วัน</span>
          </div>
        `;
      } else {
        html += `
          <div class="dashboard-warning-item dashboard-warning-item--soon">
            <div class="dashboard-warning-info">
              <span class="dashboard-warning-name">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                ${w.row.material_name} (รหัส ${w.row.material})
              </span>
              <span class="dashboard-warning-meta">วันหมดอายุ: ${formatDMY(w.row.best_before)}</span>
            </div>
            <span class="dashboard-badge-yellow">เหลืออีก ${w.days} วัน</span>
          </div>
        `;
      }
    });

    if (warnings.length > 5) {
      html += `
        <div style="text-align: center; font-size: 0.8rem; color: #64748b; padding-top: 0.25rem;">
          และรายการใกล้หมดอายุอีก ${warnings.length - 5} รายการ (โปรดเช็คในเมนู Stock)
        </div>
      `;
    }

    return { count: warnings.length, html };
  }

  // Get Insufficient production warnings
  getProductionWarnings(runs) {
    let count = 0;
    let html = '';

    const pendingShort = runs.filter(r => r.status === 'pending' && !r.allSufficient);
    pendingShort.forEach(run => {
      count++;
      const missingItemsNames = run.items
        .filter(i => !i.sufficient)
        .map(i => i.material_name)
        .join(', ');

      html += `
        <div class="dashboard-warning-item dashboard-warning-item--insufficient">
          <div class="dashboard-warning-info">
            <span class="dashboard-warning-name">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d946ef" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M2 22V12l8 4V8l8 4V4h4v18H2z"></path></svg>
              แผนผลิต: ${run.product_name} (วันที่ ${formatDMY(run.run_date)})
            </span>
            <span class="dashboard-warning-meta">วัสดุที่สต็อกไม่พอ: ${missingItemsNames}</span>
          </div>
          <span class="dashboard-badge-red" style="background:#fdf4ff; color:#d946ef; border:1px solid #f5d0fe;">สต็อกไม่เพียงพอ</span>
        </div>
      `;
    });

    return { count, html };
  }

  // Get upcoming receiving plans (Top 3)
  getUpcomingPlans(plans) {
    const active = plans.filter(p => p.status !== 'complete');
    
    // Sort by date / time ascending
    active.sort((a, b) => {
      const dateCmp = (a.plan_date || "").localeCompare(b.plan_date || "");
      if (dateCmp !== 0) return dateCmp;
      return (a.plan_time || "").localeCompare(b.plan_time || "");
    });

    const top = active.slice(0, 3);
    if (top.length === 0) {
      return `<p style="font-size: 0.85rem; color: #64748b; text-align: center; padding: 1rem 0;">ไม่มีแผนรับเข้าที่รอดำเนินการ</p>`;
    }

    return top.map(p => {
      const planned = p.planned_pallets || 0;
      const received = p.received_pallets || 0;
      const pct = planned > 0 ? Math.min(100, Math.round((received / planned) * 100)) : 0;
      const statusLabel = p.status === 'partial' ? 'รับบางส่วน' : 'รอรับ';
      const fillClass = p.status === 'partial' ? 'partial' : 'pending';

      return `
        <div class="dashboard-list-item">
          <div class="dashboard-list-item-main">
            <span class="dashboard-list-item-title">${p.material_name}</span>
            <span class="dashboard-list-item-subtitle">รหัส ${p.material} · วันเข้า: ${formatDMY(p.plan_date)} · เวลา ${p.plan_time ? p.plan_time.slice(0, 5) + ' น.' : 'ไม่ระบุ'}</span>
          </div>
          <div class="dashboard-progress-container">
            <span class="dashboard-progress-text">${received}/${planned} พาเลท (${statusLabel})</span>
            <div class="dashboard-progress-bar">
              <div class="dashboard-progress-fill dashboard-progress-fill--${fillClass}" style="width: ${pct}%;"></div>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Get upcoming production runs (Top 3)
  getUpcomingRuns(runs) {
    const pending = runs.filter(r => r.status === 'pending');
    
    // Sort by date ascending
    pending.sort((a, b) => (a.run_date || "").localeCompare(b.run_date || ""));

    const top = pending.slice(0, 3);
    if (top.length === 0) {
      return `<p style="font-size: 0.85rem; color: #64748b; text-align: center; padding: 1rem 0;">ไม่มีแผนการผลิตที่รอดำเนินการ</p>`;
    }

    return top.map(r => {
      const itemsCount = r.items ? r.items.length : 0;
      const statusClass = r.allSufficient ? 'ok' : 'short';
      const statusText = r.allSufficient ? 'สต็อกครบ' : 'สต็อกไม่พอ';

      return `
        <div class="dashboard-list-item">
          <div class="dashboard-list-item-main">
            <span class="dashboard-list-item-title">${r.product_name}</span>
            <span class="dashboard-list-item-subtitle">วันที่จัดส่ง/ผลิต: ${formatDMY(r.run_date)} · ใช้วัสดุ ${itemsCount} รายการ</span>
          </div>
          <span class="dashboard-sufficient-badge dashboard-sufficient-badge--${statusClass}">${statusText}</span>
        </div>
      `;
    }).join("");
  }

  // Get recorded today HTML list
  getRecordedTodayHtml(recordedToday) {
    if (recordedToday.length === 0) {
      return `<p style="font-size: 0.85rem; color: #64748b; text-align: center; padding: 1.5rem 0;">ยังไม่มีการบันทึกยอดจริงในวันนี้</p>`;
    }

    return recordedToday.map(r => {
      const timeStr = new Date(r.stock_updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' น.';
      const pallets = r.pallet_count || 0;
      const layers = r.layer_count || 0;
      const total = r.quantity || 0;

      return `
        <div class="dashboard-list-item">
          <div class="dashboard-list-item-main">
            <span class="dashboard-list-item-title">${r.material_name}</span>
            <span class="dashboard-list-item-subtitle">รหัส ${r.material} · บันทึกเมื่อเวลา ${timeStr}</span>
          </div>
          <div style="text-align: right;">
            <span style="font-weight: 700; color: #1a9a58; font-size: 0.95rem;">${total.toLocaleString()}</span> <span style="font-size: 0.75rem; color: #64748b;">PC</span>
            <div style="font-size: 0.72rem; color: #64748b; margin-top: 0.15rem;">(${pallets} พาเลท · ${layers} ชั้น)</div>
          </div>
        </div>
      `;
    }).join("");
  }

  // Modern Type breakdown with percentage fill bars
  typeBreakdownModern(rows, totalQty) {
    const byType = {};
    rows.forEach(r => {
      const type = r.type || "ไม่ระบุประเภท";
      if (!byType[type]) byType[type] = { qty: 0, count: 0 };
      byType[type].qty += r.quantity || 0;
      byType[type].count += 1;
    });

    const sortedTypes = Object.keys(byType).sort((a, b) => byType[b].qty - byType[a].qty);
    if (sortedTypes.length === 0) {
      return `<p style="font-size: 0.85rem; color: #64748b; text-align: center; padding: 1rem 0;">ไม่มีข้อมูลประเภทบรรจุภัณฑ์</p>`;
    }

    return sortedTypes.map(type => {
      const qty = byType[type].qty;
      const pct = totalQty > 0 ? Math.round((qty / totalQty) * 100) : 0;

      return `
        <div class="dashboardUi__breakdownRow-modern">
          <div class="dashboardUi__breakdownRow-header">
            <span class="dashboardUi__breakdownRow-title">${type} (${byType[type].count} รายการ)</span>
            <span class="dashboardUi__breakdownRow-val">${qty.toLocaleString()} PC (${pct}%)</span>
          </div>
          <div class="dashboardUi__breakdownRow-bar">
            <div class="dashboardUi__breakdownRow-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
      `;
    }).join("");
  }
}

export default new DashboardUi();

