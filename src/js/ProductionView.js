import Storage from "./API.js";
import { formatDMY, formatDMYTime, parseDMYToISO } from "./dateUtils.js";

const mainApp = document.querySelector(".main");
const searchBar = document.querySelector(".searchBarInput");

class ProductionUi {
  constructor() {
    this.statusFilter = "";
    this.searchTerm = "";
    this.rowCounter = 0;
  }

  setApp() {
    mainApp.innerHTML = `
    <div class="inventory-app production-app">
        <div class="product-section__header">
          <div class="product-section__header__buttons">
            <button class="planning__addBtn production__addBtn">+ เพิ่มแผนการผลิต</button>
          </div>
        </div>

        <div class="production__summaryCards"></div>

        <div class="planning__addForm production__addForm --hidden">
          <div class="planning__formRow">
            <div class="planning__formField">
              <label>วันที่ผลิต</label>
              <input type="text" inputmode="numeric" class="prodForm__date" placeholder="dd/mm/yyyy" />
            </div>
            <div class="planning__formField planning__formField--wide">
              <label>ชื่อสินค้า / ล็อตที่ผลิต</label>
              <input type="text" class="prodForm__productName" placeholder="เช่น น้ำดื่มขวด 600ml ล็อตเช้า" />
            </div>
          </div>

          <p class="production__itemsLabel">รายการวัสดุที่ต้องใช้</p>
          <datalist id="prodMaterialList"></datalist>
          <div class="production__itemRows"></div>
          <button type="button" class="production__addItemRowBtn">+ เพิ่มวัสดุ</button>

          <div class="planning__formRow">
            <div class="planning__formField planning__formField--wide">
              <label>หมายเหตุ (ถ้ามี)</label>
              <input type="text" class="prodForm__note" placeholder="เช่น กะเช้า / เครื่องจักรที่ใช้" />
            </div>
          </div>

          <div class="planning__formActions">
            <button class="planning__cancelBtn production__cancelBtn">ยกเลิก</button>
            <button class="planning__saveBtn production__saveBtn">บันทึกแผน</button>
          </div>
        </div>

        <div class="planning__chips production__chips"></div>

        <div class="planCard__list production__list"></div>
    </div>
    `;

    this.listEl = document.querySelector(".production__list");
    this.chipsEl = document.querySelector(".production__chips");
    this.summaryCardsEl = document.querySelector(".production__summaryCards");
    this.addFormEl = document.querySelector(".production__addForm");
    this.itemRowsEl = document.querySelector(".production__itemRows");
    this.materialListEl = document.querySelector("#prodMaterialList");
    this.addBtn = document.querySelector(".production__addBtn");
    this.cancelBtn = document.querySelector(".production__cancelBtn");
    this.saveBtn = document.querySelector(".production__saveBtn");
    this.addItemRowBtn = document.querySelector(".production__addItemRowBtn");

    this.populateMaterialOptions();
    this.populateChips();
    this.resetItemRows();
    this.updateDOM();

    this.addBtn.addEventListener("click", () => {
      this.addFormEl.classList.remove("--hidden");
      this.addBtn.classList.add("--hidden");
    });

    this.cancelBtn.addEventListener("click", () => this.closeAddForm());
    this.saveBtn.addEventListener("click", () => this.handleCreateProductionRun());
    this.addItemRowBtn.addEventListener("click", () => this.addItemRow());
    this.itemRowsEl.addEventListener("click", (e) => this.handleItemRowClick(e));

    this.listEl.addEventListener("click", (e) => this.handleClick(e));

    if (searchBar) {
      searchBar.value = "";
      searchBar.addEventListener("input", () => {
        this.searchTerm = searchBar.value.toLowerCase().trim();
        this.updateDOM();
      });
    }
  }

  // ---------------- Add-form: dynamic material line items ----------------

  resetItemRows() {
    this.itemRowsEl.innerHTML = "";
    this.addItemRow();
    this.addItemRow();
  }

  addItemRow() {
    this.rowCounter += 1;
    const rowId = this.rowCounter;
    const row = document.createElement("div");
    row.className = "production__itemRow";
    row.dataset.rowId = rowId;
    row.innerHTML = `
      <input type="text" list="prodMaterialList" class="production__itemMaterial" placeholder="รหัสหรือชื่อวัสดุ" />
      <input type="number" inputmode="numeric" min="0" class="production__itemPallets" placeholder="พาเลท" />
      <input type="number" inputmode="numeric" min="0" class="production__itemLayers" placeholder="ชั้น" />
      <button type="button" class="production__itemRemoveBtn" aria-label="ลบรายการนี้">&times;</button>
    `;
    this.itemRowsEl.appendChild(row);
  }

  handleItemRowClick(e) {
    if (!e.target.classList.contains("production__itemRemoveBtn")) return;
    const row = e.target.closest(".production__itemRow");
    if (!row) return;
    // Always keep at least one row so the form never disappears entirely.
    if (this.itemRowsEl.children.length <= 1) {
      row.querySelector(".production__itemMaterial").value = "";
      row.querySelector(".production__itemPallets").value = "";
      row.querySelector(".production__itemLayers").value = "";
      return;
    }
    row.remove();
  }

  closeAddForm() {
    this.addFormEl.classList.add("--hidden");
    this.addBtn.classList.remove("--hidden");
    document.querySelector(".prodForm__date").value = "";
    document.querySelector(".prodForm__productName").value = "";
    document.querySelector(".prodForm__note").value = "";
    this.resetItemRows();
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
    const match = String(value || "").trim().match(/^(\d+)/);
    if (!match) return null;
    const code = Number(match[1]);
    return Storage.getMasterPackmat().find(pm => pm.material === code) || null;
  }

  // ---------------- Filtering / chips ----------------

  populateChips() {
    const statuses = [
      { value: "", label: "ทั้งหมด" },
      { value: "pending", label: "รอผลิต" },
      { value: "short", label: "วัตถุดิบไม่พอ" },
      { value: "confirmed", label: "ยืนยันผลิตแล้ว" }
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

  getFilteredRuns() {
    let runs = Storage.getMergedProductionRuns();
    if (this.statusFilter === "pending") {
      runs = runs.filter(r => r.status === "pending");
    } else if (this.statusFilter === "short") {
      runs = runs.filter(r => r.status === "pending" && !r.allSufficient);
    } else if (this.statusFilter === "confirmed") {
      runs = runs.filter(r => r.status === "confirmed");
    }
    if (this.searchTerm) {
      runs = runs.filter(r =>
        (r.product_name || "").toLowerCase().includes(this.searchTerm) ||
        r.items.some(i => (i.material_name || "").toLowerCase().includes(this.searchTerm) || String(i.material).includes(this.searchTerm))
      );
    }
    return runs;
  }

  renderSummaryCards(allRuns) {
    const total = allRuns.length;
    const pending = allRuns.filter(r => r.status === "pending").length;
    const shortStock = allRuns.filter(r => r.status === "pending" && !r.allSufficient).length;
    const confirmed = allRuns.filter(r => r.status === "confirmed").length;

    this.summaryCardsEl.innerHTML = `
      <div class="stock__card">
        <p class="stock__cardValue">${total.toLocaleString()}</p>
        <p class="stock__cardLabel">แผนทั้งหมด</p>
      </div>
      <div class="stock__card">
        <p class="stock__cardValue">${pending.toLocaleString()}</p>
        <p class="stock__cardLabel">รอผลิต</p>
      </div>
      <div class="stock__card">
        <p class="stock__cardValue">${shortStock.toLocaleString()}</p>
        <p class="stock__cardLabel">วัตถุดิบไม่พอ</p>
      </div>
      <div class="stock__card">
        <p class="stock__cardValue">${confirmed.toLocaleString()}</p>
        <p class="stock__cardLabel">ยืนยันผลิตแล้ว</p>
      </div>
    `;
  }

  updateDOM() {
    const allRuns = Storage.getMergedProductionRuns();
    this.renderSummaryCards(allRuns);

    const runs = this.getFilteredRuns();

    const grouped = {};
    runs
      .slice()
      .sort((a, b) => (a.run_date || "").localeCompare(b.run_date || ""))
      .forEach(run => {
        const date = run.run_date || "ไม่ระบุวันที่";
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(run);
      });

    let result = "";
    if (runs.length === 0) {
      result = `<p class="stockCard__empty">ไม่พบแผนการผลิตที่ตรงกับเงื่อนไข</p>`;
    }

    Object.keys(grouped).sort().forEach(date => {
      const items = grouped[date];
      const dateLabel = date === "ไม่ระบุวันที่" ? date : formatDMY(date);
      result += `<div class="stockCard__groupHeader">${dateLabel} (${items.length.toLocaleString()} แผน)</div>`;
      items.forEach(run => {
        result += this.createCardHTML(run);
      });
    });

    this.listEl.innerHTML = result;
  }

  // ---------------- Card rendering ----------------

  createItemRowHTML(item) {
    const remainingLabel = item.sufficient
      ? `เหลือหลังผลิต ${item.remaining_quantity.toLocaleString()} PC`
      : `ขาด ${Math.abs(item.remaining_quantity).toLocaleString()} PC`;
    const toneClass = item.sufficient ? "prodItem__remaining--ok" : "prodItem__remaining--short";

    return `
      <div class="prodItem">
        <div class="prodItem__info">
          <p class="prodItem__name">${item.material_name || ""}</p>
          <p class="prodItem__meta">รหัส ${item.material}${item.type ? " · " + item.type : ""} · ต้องใช้ ${Number(item.required_pallets).toLocaleString()} พาเลท ${Number(item.required_layers).toLocaleString()} ชั้น</p>
        </div>
        <div class="prodItem__stock">
          <p class="prodItem__stockValue">คงเหลือ ${item.current_quantity.toLocaleString()} PC</p>
          <p class="prodItem__remaining ${toneClass}">${remainingLabel}</p>
        </div>
      </div>
    `;
  }

  createCardHTML(run) {
    const statusLabel = run.status === "confirmed" ? "ยืนยันผลิตแล้ว" : "รอผลิต";
    const readyLabel = run.allSufficient ? "วัตถุดิบพร้อม" : "วัตถุดิบไม่พอ";
    const readyTone = run.allSufficient ? "prodCard__badge--ready" : "prodCard__badge--short";

    return `
    <div class="prodCard" data-run-id="${run.id}">
      <div class="prodCard__top">
        <div class="prodCard__info">
          <p class="prodCard__name">${run.product_name || ""}</p>
          <p class="prodCard__meta">${run.items.length.toLocaleString()} รายการวัสดุ</p>
        </div>
        <div class="prodCard__badges">
          <span class="prodCard__badge prodCard__badge--${run.status}">${statusLabel}</span>
          <span class="prodCard__badge ${readyTone}">${readyLabel}</span>
        </div>
      </div>

      <div class="prodCard__items">
        ${run.items.map(item => this.createItemRowHTML(item)).join("")}
      </div>

      ${run.note ? `<p class="planCard__note">หมายเหตุ: ${run.note}</p>` : ""}

      <div class="prodCard__bottom">
        ${run.status === "pending"
          ? `<button class="prodCard__confirmBtn">ยืนยันผลิตแล้ว (ตัดสต็อก)</button><button class="prodCard__deleteBtn">ลบแผนนี้</button>`
          : `<p class="prodCard__confirmedNote">ยืนยันผลิตแล้วเมื่อ ${formatDMYTime(run.confirmed_at)}</p>`
        }
      </div>
    </div>
    `;
  }

  // ---------------- Actions ----------------

  async handleCreateProductionRun() {
    const dateInput = document.querySelector(".prodForm__date");
    const productNameInput = document.querySelector(".prodForm__productName");
    const noteInput = document.querySelector(".prodForm__note");

    let runDateISO;
    try {
      runDateISO = parseDMYToISO(dateInput.value);
    } catch (err) {
      alert(err.message);
      return;
    }
    if (!runDateISO) {
      alert("กรุณาระบุวันที่ผลิต (dd/mm/yyyy)");
      return;
    }

    const productName = productNameInput.value.trim();
    if (!productName) {
      alert("กรุณาระบุชื่อสินค้า/ล็อตที่ผลิต");
      return;
    }

    const items = [];
    const rows = this.itemRowsEl.querySelectorAll(".production__itemRow");
    for (const row of rows) {
      const materialInput = row.querySelector(".production__itemMaterial");
      const palletsInput = row.querySelector(".production__itemPallets");
      const layersInput = row.querySelector(".production__itemLayers");

      const materialValue = materialInput.value.trim();
      const palletsValue = palletsInput.value.trim();
      const layersValue = layersInput.value.trim();

      // Skip rows the user left completely empty.
      if (!materialValue && !palletsValue && !layersValue) continue;

      const material = this.resolveMaterialFromInput(materialValue);
      if (!material) {
        alert("กรุณาเลือกวัสดุจากรายการให้ครบทุกแถว (พิมพ์รหัสหรือชื่อแล้วเลือกจากตัวเลือกที่ขึ้นมา)");
        return;
      }

      const pallets = Number(palletsValue) || 0;
      const layers = Number(layersValue) || 0;
      if (pallets <= 0 && layers <= 0) {
        alert(`กรุณาระบุจำนวนที่ต้องใช้ของ "${material.material_name}" มากกว่า 0`);
        return;
      }

      items.push({
        material: material.material,
        required_pallets: pallets,
        required_layers: layers
      });
    }

    if (items.length === 0) {
      alert("กรุณาเพิ่มวัสดุที่ต้องใช้อย่างน้อย 1 รายการ");
      return;
    }

    this.saveBtn.textContent = "กำลังบันทึก...";
    this.saveBtn.disabled = true;

    try {
      await Storage.createProductionRun({
        run_date: runDateISO,
        product_name: productName,
        note: noteInput.value,
        items
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
    const card = e.target.closest(".prodCard");
    if (!card) return;
    const runId = card.dataset.runId;

    if (e.target.classList.contains("prodCard__confirmBtn")) {
      this.handleConfirmRun(runId, card, e.target);
    }

    if (e.target.classList.contains("prodCard__deleteBtn")) {
      this.handleDeleteRun(runId, card, e.target);
    }
  }

  async handleConfirmRun(runId, card, btn) {
    const run = Storage.getMergedProductionRuns().find(r => String(r.id) === String(runId));
    const warn = run && !run.allSufficient
      ? "\n\nคำเตือน: วัตถุดิบบางรายการมีไม่พอ ระบบจะยังคงตัดสต็อกตามจำนวนที่ระบุ (ยอดคงเหลืออาจติดลบ)"
      : "";
    if (!confirm(`ยืนยันว่าผลิตแล้ว และให้ตัดสต็อกวัสดุตามแผนนี้ทั้งหมด?${warn}`)) return;

    btn.textContent = "กำลังบันทึก...";
    btn.disabled = true;

    try {
      await Storage.confirmProductionRun(runId);
      this.updateDOM();
    } catch (err) {
      console.error(err);
      alert(`ยืนยันไม่สำเร็จ: ${err.message}`);
      btn.textContent = "ยืนยันผลิตแล้ว (ตัดสต็อก)";
      btn.disabled = false;
    }
  }

  async handleDeleteRun(runId, card, btn) {
    if (!confirm("ลบแผนการผลิตนี้? การลบไม่มีผลย้อนหลังต่อสต็อก")) return;

    btn.textContent = "กำลังลบ...";
    btn.disabled = true;

    try {
      await Storage.deleteProductionRun(runId);
      this.updateDOM();
    } catch (err) {
      console.error(err);
      alert(`ลบไม่สำเร็จ: ${err.message}`);
      btn.textContent = "ลบแผนนี้";
      btn.disabled = false;
    }
  }
}

export default new ProductionUi();
