import Storage from "./API.js";
import { formatDMY, parseDMYToISO } from "./dateUtils.js";

const mainApp = document.querySelector(".main");
const searchBar = document.querySelector(".searchBarInput");

class PlanningUi {
  constructor() {
    this.statusFilter = "";
    this.searchTerm = "";
  }

  setApp() {
    mainApp.innerHTML = `
    <div class="inventory-app planning-app">
        <div class="product-section__header">
          <div class="product-section__header__buttons">
            <button class="planning__addBtn">+ เพิ่มแผนรับเข้า</button>
          </div>
        </div>

        <div class="planning__summaryCards"></div>

        <div class="stock__modal-overlay planning__addForm --hidden">
          <div class="stock__modal-content">
            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700; color: #0f172a;">+ เพิ่มแผนรับเข้าสินค้า</h3>
            <div class="planning__formRow">
              <div class="planning__formField">
                <label>สินค้า (พิมพ์รหัสหรือชื่อ)</label>
                <input type="text" list="planMaterialList" class="planForm__material" placeholder="พิมพ์ชื่อสินค้าหรือรหัส เช่น 130009855" />
                <datalist id="planMaterialList"></datalist>
              </div>
            </div>
            <div class="planning__formRow">
              <div class="planning__formField">
                <label>วันที่จะเข้า</label>
                <input type="text" inputmode="numeric" class="planForm__date" placeholder="dd/mm/yyyy" />
              </div>
              <div class="planning__formField">
                <label>เวลาที่เข้า</label>
                <input type="time" class="planForm__time" />
              </div>
              <div class="planning__formField">
                <label>จำนวน (พาเลทเต็ม)</label>
                <input type="number" inputmode="numeric" min="0" class="planForm__pallets" placeholder="เช่น 10" />
              </div>
            </div>
            <div class="planning__formRow">
              <div class="planning__formField planning__formField--wide">
                <label>หมายเหตุ (ถ้ามี)</label>
                <input type="text" class="planForm__note" placeholder="เช่น ชื่อผู้ขนส่ง / เลขที่ PO" />
              </div>
            </div>
            <div class="planning__formActions" style="margin-top: 1.5rem;">
              <button class="planning__cancelBtn">ยกเลิก</button>
              <button class="planning__saveBtn">บันทึกแผน</button>
            </div>
          </div>
        </div>

        <div class="planning__chips"></div>

        <div class="planCard__list"></div>
    </div>
    `;

    this.listEl = document.querySelector(".planCard__list");
    this.chipsEl = document.querySelector(".planning__chips");
    this.summaryCardsEl = document.querySelector(".planning__summaryCards");
    this.addFormEl = document.querySelector(".planning__addForm");
    this.materialListEl = document.querySelector("#planMaterialList");
    this.addBtn = document.querySelector(".planning__addBtn");
    this.cancelBtn = document.querySelector(".planning__cancelBtn");
    this.saveBtn = document.querySelector(".planning__saveBtn");

    this.populateMaterialOptions();
    this.populateChips();
    this.updateDOM();

    this.addBtn.addEventListener("click", () => {
      this.addFormEl.classList.remove("--hidden");
    });

    this.cancelBtn.addEventListener("click", () => this.closeAddForm());
    this.saveBtn.addEventListener("click", () => this.handleCreatePlan());

    this.listEl.addEventListener("click", (e) => this.handleClick(e));

    if (searchBar) {
      searchBar.value = "";
      searchBar.addEventListener("input", () => {
        this.searchTerm = searchBar.value.toLowerCase().trim();
        this.updateDOM();
      });
    }
  }

  closeAddForm() {
    this.addFormEl.classList.add("--hidden");
    document.querySelector(".planForm__material").value = "";
    document.querySelector(".planForm__date").value = "";
    document.querySelector(".planForm__time").value = "";
    document.querySelector(".planForm__pallets").value = "";
    document.querySelector(".planForm__note").value = "";
  }

  populateMaterialOptions() {
    const all = Storage.getMasterPackmat()
      .slice()
      .sort((a, b) => (a.material_name || "").localeCompare(b.material_name || ""));
    this.materialListEl.innerHTML = all
      .map(pm => `<option value="${pm.material} - ${pm.material_name || ""}"></option>`)
      .join("");
  }

  resolveMaterialFromInput(value) {
    const val = String(value || "").trim().toLowerCase();
    if (!val) return null;

    const all = Storage.getMasterPackmat();

    // 1. Try exact match on code (if it's purely a number)
    const pureNumber = Number(val);
    if (!isNaN(pureNumber)) {
      const found = all.find(pm => pm.material === pureNumber);
      if (found) return found;
    }

    // 2. Try pattern match: extracts digits from start (e.g. "130011571 - Sleek can...")
    const matchDigits = val.match(/^(\d+)/);
    if (matchDigits) {
      const code = Number(matchDigits[1]);
      const found = all.find(pm => pm.material === code);
      if (found) return found;
    }

    // 3. Try to find by name (if user typed part of the name, e.g. "Sleek can325")
    const foundByName = all.find(pm => (pm.material_name || "").toLowerCase().includes(val));
    if (foundByName) return foundByName;

    return null;
  }

  populateChips() {
    const statuses = [
      { value: "", label: "ทั้งหมด" },
      { value: "pending", label: "รอรับ" },
      { value: "partial", label: "รับบางส่วน" },
      { value: "complete", label: "รับครบแล้ว" }
    ];
    this.chipsEl.innerHTML = statuses
      .map((s, i) => `<button class="entryChip${i === 0 ? " entryChip--active" : ""}" data-status="${s.value}">${s.label}</button>`)
      .join("");

    this.chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".entryChip");
      if (!chip) return;
      this.statusFilter = chip.dataset.status;
      this.chipsEl.querySelectorAll(".entryChip").forEach(c => c.classList.toggle("entryChip--active", c === chip));
      this.updateDOM();
    });
  }

  getFilteredPlans() {
    let plans = Storage.getMergedPlans();
    if (this.statusFilter) {
      plans = plans.filter(p => p.status === this.statusFilter);
    }
    if (this.searchTerm) {
      plans = plans.filter(p =>
        (p.material_name || "").toLowerCase().includes(this.searchTerm) ||
        String(p.material).includes(this.searchTerm)
      );
    }
    return plans;
  }

  renderSummaryCards(allPlans) {
    const total = allPlans.length;
    const pending = allPlans.filter(p => p.status === "pending").length;
    const partial = allPlans.filter(p => p.status === "partial").length;
    const complete = allPlans.filter(p => p.status === "complete").length;

    this.summaryCardsEl.innerHTML = `
      <div class="stock__card stock__card--total">
        <div class="stock__cardContent">
          <p class="stock__cardValue">${total.toLocaleString()}</p>
          <p class="stock__cardLabel">แผนทั้งหมด</p>
        </div>
        <div class="stock__cardIcon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        </div>
      </div>
      <div class="stock__card stock__card--pending">
        <div class="stock__cardContent">
          <p class="stock__cardValue">${pending.toLocaleString()}</p>
          <p class="stock__cardLabel">รอรับ</p>
        </div>
        <div class="stock__cardIcon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
      </div>
      <div class="stock__card stock__card--partial">
        <div class="stock__cardContent">
          <p class="stock__cardValue">${partial.toLocaleString()}</p>
          <p class="stock__cardLabel">รับบางส่วน</p>
        </div>
        <div class="stock__cardIcon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
        </div>
      </div>
      <div class="stock__card stock__card--complete">
        <div class="stock__cardContent">
          <p class="stock__cardValue">${complete.toLocaleString()}</p>
          <p class="stock__cardLabel">รับครบแล้ว</p>
        </div>
        <div class="stock__cardIcon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
      </div>
    `;
  }

  updateDOM() {
    const allPlans = Storage.getMergedPlans();
    this.renderSummaryCards(allPlans);

    const plans = this.getFilteredPlans();

    const grouped = {};
    plans
      .slice()
      .sort((a, b) => {
        const dateCmp = (a.plan_date || "").localeCompare(b.plan_date || "");
        if (dateCmp !== 0) return dateCmp;
        return (a.plan_time || "").localeCompare(b.plan_time || "");
      })
      .forEach(plan => {
        const date = plan.plan_date || "ไม่ระบุวันที่";
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(plan);
      });

    let result = "";
    if (plans.length === 0) {
      result = `<p class="stockCard__empty">ไม่พบแผนรับเข้าที่ตรงกับเงื่อนไข</p>`;
    }

    Object.keys(grouped).sort().forEach(date => {
      const items = grouped[date];
      const dateLabel = date === "ไม่ระบุวันที่" ? date : formatDMY(date);
      result += `<div class="stockCard__groupHeader">${dateLabel} (${items.length.toLocaleString()} แผน)</div>`;
      items.forEach(plan => {
        result += this.createCardHTML(plan);
      });
    });

    this.listEl.innerHTML = result;
  }

  statusLabel(status) {
    if (status === "complete") return "รับครบแล้ว";
    if (status === "partial") return "รับบางส่วน";
    return "รอรับ";
  }

  createCardHTML(plan) {
    const planned = Number(plan.planned_pallets) || 0;
    const received = Number(plan.received_pallets) || 0;
    const pct = planned > 0 ? Math.min(100, Math.round((received / planned) * 100)) : 0;
    const remainingPct = Math.max(0, 100 - pct);
    const remainingPallets = Math.max(0, planned - received);
    const timeLabel = plan.plan_time ? plan.plan_time.slice(0, 5) + " น." : "ไม่ระบุเวลา";

    return `
    <div class="planCard" data-plan-id="${plan.id}">
      <div class="planCard__top">
        <div class="planCard__info">
          <p class="planCard__name">${plan.material_name || ""}</p>
          <p class="planCard__meta">รหัส ${plan.material}${plan.type ? " · " + plan.type : ""} · เวลาเข้า ${timeLabel}</p>
        </div>
        <span class="planCard__badge planCard__badge--${plan.status}">${this.statusLabel(plan.status)}</span>
      </div>

      <div class="planCard__progressWrap">
        <div class="planCard__progressBar">
          <div class="planCard__progressFill planCard__progressFill--${plan.status}" style="width:${pct}%;"></div>
        </div>
        <p class="planCard__progressLabel">รับแล้ว ${pct}% (${received.toLocaleString()}/${planned.toLocaleString()} พาเลท) · เหลืออีก ${remainingPct}% (${remainingPallets.toLocaleString()} พาเลท)</p>
      </div>

      ${plan.note ? `<p class="planCard__note">หมายเหตุ: ${plan.note}</p>` : ""}

      <div class="planCard__bottom">
        <button class="planCard__receiveBtn" ${plan.status === "complete" ? "disabled" : ""}>รับเข้า</button>
      </div>

      <div class="planCard__receiveForm --hidden">
        <div class="planCard__receiveRow">
          <input type="number" inputmode="numeric" min="1" class="planCard__receiveInput" placeholder="จำนวนที่รับเพิ่ม (พาเลท)" />
          <button class="planCard__receiveConfirmBtn">ยืนยัน</button>
          <button class="planCard__receiveCancelBtn">ยกเลิก</button>
        </div>
      </div>
    </div>
    `;
  }

  async handleCreatePlan() {
    const materialInput = document.querySelector(".planForm__material");
    const dateInput = document.querySelector(".planForm__date");
    const timeInput = document.querySelector(".planForm__time");
    const palletsInput = document.querySelector(".planForm__pallets");
    const noteInput = document.querySelector(".planForm__note");

    const material = this.resolveMaterialFromInput(materialInput.value);
    if (!material) {
      alert("กรุณาเลือกสินค้าจากรายการ (พิมพ์รหัสหรือชื่อแล้วเลือกจากตัวเลือกที่ขึ้นมา)");
      return;
    }

    let planDateISO;
    try {
      planDateISO = parseDMYToISO(dateInput.value);
    } catch (err) {
      alert(err.message);
      return;
    }
    if (!planDateISO) {
      alert("กรุณาระบุวันที่จะเข้า (dd/mm/yyyy)");
      return;
    }

    const planned = Number(palletsInput.value);
    if (!planned || planned <= 0) {
      alert("กรุณาระบุจำนวนพาเลทที่มากกว่า 0");
      return;
    }

    this.saveBtn.textContent = "กำลังบันทึก...";
    this.saveBtn.disabled = true;

    try {
      await Storage.createPlan({
        material: material.material,
        plan_date: planDateISO,
        plan_time: timeInput.value,
        planned_pallets: planned,
        note: noteInput.value
      });
      this.closeAddForm();
      this.updateDOM();
    } catch (err) {
      console.error(err);
      alert(`บันทึกแผนไม่สำเร็จ: ${err.message}`);
    } finally {
      this.saveBtn.textContent = "บันทึกแผน";
      this.saveBtn.disabled = false;
    }
  }

  handleClick(e) {
    const card = e.target.closest(".planCard");
    if (!card) return;

    if (e.target.classList.contains("planCard__receiveBtn")) {
      card.querySelector(".planCard__receiveForm").classList.remove("--hidden");
      e.target.classList.add("--hidden");
    }

    if (e.target.classList.contains("planCard__receiveCancelBtn")) {
      card.querySelector(".planCard__receiveForm").classList.add("--hidden");
      card.querySelector(".planCard__receiveBtn").classList.remove("--hidden");
      card.querySelector(".planCard__receiveInput").value = "";
    }

    if (e.target.classList.contains("planCard__receiveConfirmBtn")) {
      this.handleReceive(card, e.target);
    }
  }

  async handleReceive(card, confirmBtn) {
    const planId = card.dataset.planId;
    const input = card.querySelector(".planCard__receiveInput");
    const addedPallets = Number(input.value);

    if (!addedPallets || addedPallets <= 0) {
      alert("กรุณาระบุจำนวนที่รับเพิ่มมากกว่า 0");
      return;
    }

    confirmBtn.textContent = "กำลังบันทึก...";
    confirmBtn.disabled = true;

    try {
      await Storage.receivePlanQty(planId, addedPallets);
      this.updateDOM();
    } catch (err) {
      console.error(err);
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
      confirmBtn.textContent = "ยืนยัน";
      confirmBtn.disabled = false;
    }
  }
}

export default new PlanningUi();
