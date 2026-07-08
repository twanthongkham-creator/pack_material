import Storage from "./API.js";
import { formatDMY, formatDMYTime, isoToDMY, parseDMYToISO, daysUntil } from "./dateUtils.js";

const mainApp = document.querySelector(".main");
const searchBar = document.querySelector(".searchBarInput");

class StockUi {
  constructor() {
    this.typeFilter = "";
    this.searchTerm = "";
    this.showZero = false;
    this.showTodayOnly = false;
  }

  setApp() {
    mainApp.innerHTML = `
    <div class="inventory-app stock-app">
        <div class="stock__summaryCards"></div>

        <div class="product-section__header" style="margin-bottom: 1rem; display: flex; justify-content: flex-end;">
          <button class="planning__addBtn stock__addBtn">+ เพิ่มวัตถุดิบใหม่</button>
        </div>

        <div class="stock__modal-overlay stock__addForm --hidden">
          <div class="stock__modal-content">
            <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem; font-weight: 700; color: #0f172a;">+ เพิ่มวัตถุดิบและยอดสต็อกเริ่มต้น</h3>
            
            <div class="planning__formRow">
              <div class="planning__formField">
                <label>รหัสวัตถุดิบ *</label>
                <input type="number" class="addForm__materialCode" list="addFormMaterialList" placeholder="พิมพ์/เลือกจาก Master" required />
              </div>
              <div class="planning__formField planning__formField--wide">
                <label>ชื่อวัตถุดิบ *</label>
                <input type="text" class="addForm__materialName" placeholder="เช่น ขวดแก้วใส 250ml" required />
              </div>
            </div>

            <div class="planning__formRow">
              <div class="planning__formField planning__formField--wide">
                <label>ประเภท (Type)</label>
                <div class="addForm__typeToggleGroup">
                  <label class="addForm__typeToggleBtn">
                    <input type="radio" name="addFormType" value="ขวด" class="addForm__typeRadio" checked />
                    <span>ขวด</span>
                  </label>
                  <label class="addForm__typeToggleBtn">
                    <input type="radio" name="addFormType" value="กระป๋อง" class="addForm__typeRadio" />
                    <span>กระป๋อง</span>
                  </label>
                  <label class="addForm__typeToggleBtn">
                    <input type="radio" name="addFormType" value="ฝา" class="addForm__typeRadio" />
                    <span>ฝา</span>
                  </label>
                  <label class="addForm__typeToggleBtn">
                    <input type="radio" name="addFormType" value="กล่อง" class="addForm__typeRadio" />
                    <span>กล่อง</span>
                  </label>
                  <label class="addForm__typeToggleBtn">
                    <input type="radio" name="addFormType" value="อื่นๆ" class="addForm__typeRadio" />
                    <span>อื่นๆ</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="planning__formRow">
              <div class="planning__formField">
                <label>หน่วย/พาเลท</label>
                <input type="number" min="0" class="addForm__palletUnit" placeholder="เช่น 3040" />
              </div>
              <div class="planning__formField">
                <label>หน่วย/ชั้น</label>
                <input type="number" min="0" class="addForm__layerUnit" placeholder="เช่น 380" />
              </div>
              <div class="planning__formField">
                <label>Shelf Life (วัน)</label>
                <input type="number" min="0" class="addForm__shelfLife" value="30" placeholder="เช่น 30" />
              </div>
            </div>

            <div class="planning__formRow" style="border-top: 1px dashed #e2e8f0; padding-top: 1rem; margin-top: 1rem;">
              <div class="planning__formField">
                <label>จำนวนพาเลท (เต็ม)</label>
                <input type="number" min="0" class="addForm__palletCount" placeholder="0" />
              </div>
              <div class="planning__formField">
                <label>จำนวนชั้น (เศษ)</label>
                <input type="number" min="0" class="addForm__layerCount" placeholder="0" />
              </div>
            </div>

            <div class="planning__formRow">
              <div class="planning__formField">
                <label>วันที่ผลิต (Production Date)</label>
                <input type="text" inputmode="numeric" class="addForm__productionDate" placeholder="dd/mm/yyyy" />
              </div>
              <div class="planning__formField">
                <label>วันหมดอายุ (Best Before)</label>
                <input type="text" inputmode="numeric" class="addForm__bestBefore" placeholder="dd/mm/yyyy" />
              </div>
            </div>

            <div class="planning__formRow">
              <div class="planning__formField planning__formField--wide">
                <label>หมายเหตุ</label>
                <input type="text" class="addForm__note" placeholder="ระบุรายละเอียดเพิ่มเติม" />
              </div>
            </div>

            <div class="planning__formActions" style="margin-top: 1.5rem;">
              <button class="planning__cancelBtn stock__formCancelBtn">ยกเลิก</button>
              <button class="planning__saveBtn stock__formSaveBtn">บันทึกรายการ</button>
            </div>
          </div>
        </div>

        <div class="stock__toolbarSticky">
          <div class="stock__chips"></div>
          <div class="stockEntry__toolbar">
            <select class="stock__typeFilter">
              <option value="">ทุกประเภท (Type)</option>
            </select>
            <label class="stock__onlyRecorded">
              <input type="checkbox" class="stock__showZeroCheckbox" />
              แสดงรายการที่ยอดเป็น 0 / ยังไม่ได้นับด้วย
            </label>
          </div>
        </div>

        <div class="stockCard__list"></div>
    </div>
    <datalist id="addFormMaterialList"></datalist>
    `;

    this.listEl = document.querySelector(".stockCard__list");
    this.chipsEl = document.querySelector(".stock__chips");
    this.typeFilterEl = document.querySelector(".stock__typeFilter");
    this.summaryCardsEl = document.querySelector(".stock__summaryCards");
    this.showZeroEl = document.querySelector(".stock__showZeroCheckbox");

    this.addBtn = document.querySelector(".stock__addBtn");
    this.addFormEl = document.querySelector(".stock__addForm");
    this.formCancelBtn = document.querySelector(".stock__formCancelBtn");
    this.formSaveBtn = document.querySelector(".stock__formSaveBtn");

    this.populateTypeFilter();
    this.populateChips();
    this.populateAddFormMasterOptions();
    this.updateDOM();

    this.typeFilterEl.addEventListener("change", () => {
      this.typeFilter = this.typeFilterEl.value;
      this.syncChips();
      this.updateDOM();
    });

    this.showZeroEl.addEventListener("change", () => {
      this.showZero = this.showZeroEl.checked;
      this.updateDOM();
    });

    this.addBtn.addEventListener("click", () => {
      this.addFormEl.classList.remove("--hidden");
    });

    this.formCancelBtn.addEventListener("click", () => {
      this.closeAddForm();
    });

    this.formSaveBtn.addEventListener("click", () => {
      this.handleCreateMaterialStock();
    });

    // Auto-fill form when Material Code matches master item
    const codeInput = document.querySelector(".addForm__materialCode");
    codeInput.addEventListener("input", () => {
      const code = Number(codeInput.value);
      if (code) {
        const pm = Storage.getMasterPackmat().find(item => item.material === code);
        if (pm) {
          document.querySelector(".addForm__materialName").value = pm.material_name || "";
          
          const typeVal = pm.type || "อื่นๆ";
          const radio = document.querySelector(`.addForm__typeRadio[value="${typeVal}"]`) || document.querySelector(`.addForm__typeRadio[value="อื่นๆ"]`);
          if (radio) {
            radio.checked = true;
          }

          document.querySelector(".addForm__palletUnit").value = pm.pallet_unit !== null ? pm.pallet_unit : "";
          document.querySelector(".addForm__layerUnit").value = pm.layer_unit !== null ? pm.layer_unit : "";
          document.querySelector(".addForm__shelfLife").value = pm.shelf_life !== null ? pm.shelf_life : "";
          
          this.triggerAddFormBBAutoCalc();
        }
      }
    });

    // Auto default shelf life when type toggles to ขวด
    const typeRadios = document.querySelectorAll(".addForm__typeRadio");
    const shelfLifeInput = document.querySelector(".addForm__shelfLife");
    typeRadios.forEach(radio => {
      radio.addEventListener("change", () => {
        if (radio.checked && radio.value === "ขวด") {
          shelfLifeInput.value = 30;
          this.triggerAddFormBBAutoCalc();
        }
      });
    });

    const prodDateInput = document.querySelector(".addForm__productionDate");
    prodDateInput.addEventListener("input", () => {
      this.triggerAddFormBBAutoCalc();
    });
    shelfLifeInput.addEventListener("input", () => {
      this.triggerAddFormBBAutoCalc();
    });

    this.listEl.addEventListener("click", (e) => this.handleClick(e));
    this.listEl.addEventListener("input", (e) => this.handleInput(e));

    if (searchBar) {
      searchBar.value = "";
      searchBar.addEventListener("input", () => {
        this.searchTerm = searchBar.value.toLowerCase().trim();
        this.updateDOM();
      });
    }
  }

  populateTypeFilter() {
    const allTypes = [...new Set(Storage.getMasterPackmat().map(pm => (pm.type || "").trim()).filter(Boolean))].sort();
    let options = `<option value="">ทุกประเภท (Type)</option>`;
    allTypes.forEach(t => {
      options += `<option value="${t}">${t}</option>`;
    });
    this.typeFilterEl.innerHTML = options;
    this.allTypes = allTypes;
  }

  populateChips() {
    const allRows = Storage.getMergedStock();
    const todayStr = new Date().toDateString();
    const todayCount = allRows.filter(r => r.recorded && r.stock_updated_at && new Date(r.stock_updated_at).toDateString() === todayStr).length;

    let html = `
      <button class="entryChip entryChip--active" data-type="" data-special="">ทั้งหมด</button>
      <button class="entryChip entryChip--today" data-type="" data-special="today">
        <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <rect x="1" y="2" width="14" height="13" rx="2"/>
          <line x1="1" y1="6" x2="15" y2="6"/>
          <line x1="5" y1="1" x2="5" y2="4"/>
          <line x1="11" y1="1" x2="11" y2="4"/>
        </svg>
        บันทึกวันนี้
        <span class="entryChip__count entryChip__count--today">${todayCount}</span>
      </button>
    `;
    this.allTypes.forEach(t => {
      const count = allRows.filter(r => (r.type || "").trim() === t && (r.quantity || 0) > 0).length;
      html += `<button class="entryChip" data-type="${t}">${t} <span class="entryChip__count">${count}</span></button>`;
    });
    this.chipsEl.innerHTML = html;

    this.chipsEl.addEventListener("click", (e) => {
      const chip = e.target.closest(".entryChip");
      if (!chip) return;
      this.showTodayOnly = chip.dataset.special === "today";
      this.typeFilter = chip.dataset.type;
      this.typeFilterEl.value = this.typeFilter;
      this.syncChips();
      this.updateDOM();
    });
  }

  syncChips() {
    this.chipsEl.querySelectorAll(".entryChip").forEach(c => {
      const isTodayChip = c.dataset.special === "today";
      if (this.showTodayOnly) {
        c.classList.toggle("entryChip--active", isTodayChip);
      } else {
        c.classList.toggle("entryChip--active", !isTodayChip && c.dataset.type === this.typeFilter);
      }
    });
  }

  populateAddFormMasterOptions() {
    const listEl = document.querySelector("#addFormMaterialList");
    if (!listEl) return;
    const all = Storage.getMasterPackmat().slice().sort((a, b) => a.material - b.material);
    listEl.innerHTML = all.map(pm => `<option value="${pm.material}">${pm.material_name} (${pm.type || ''})</option>`).join("");
  }

  getFilteredRows() {
    let rows = Storage.getMergedStock();
    if (this.showTodayOnly) {
      const todayDateString = new Date().toDateString();
      rows = rows.filter(r => r.recorded && r.stock_updated_at && new Date(r.stock_updated_at).toDateString() === todayDateString);
    } else {
      if (this.typeFilter) {
        rows = rows.filter(r => (r.type || "").trim() === this.typeFilter);
      }
      if (!this.showZero && !this.searchTerm) {
        rows = rows.filter(r => (r.quantity || 0) > 0);
      }
    }
    if (this.searchTerm) {
      rows = rows.filter(r =>
        (r.material_name || "").toLowerCase().includes(this.searchTerm) ||
        String(r.material).includes(this.searchTerm)
      );
    }
    return rows;
  }

  renderSummaryCards(allRows) {
    const totalItems = allRows.length;
    const recordedItems = allRows.filter(r => r.recorded).length;
    const notRecorded = totalItems - recordedItems;
    const totalQty = allRows.reduce((acc, r) => acc + (r.quantity || 0), 0);

    this.summaryCardsEl.innerHTML = `
      <div class="stock__card stock__card--total">
        <p class="stock__cardValue">${totalItems.toLocaleString()}</p>
        <p class="stock__cardLabel">รายการสินค้าทั้งหมด</p>
      </div>
      <div class="stock__card stock__card--complete">
        <p class="stock__cardValue">${recordedItems.toLocaleString()}</p>
        <p class="stock__cardLabel">บันทึกแล้ว</p>
      </div>
      <div class="stock__card stock__card--pending">
        <p class="stock__cardValue">${notRecorded.toLocaleString()}</p>
        <p class="stock__cardLabel">ยังไม่ได้บันทึก</p>
      </div>
      <div class="stock__card stock__card--totalQty">
        <p class="stock__cardValue">${totalQty.toLocaleString()}</p>
        <p class="stock__cardLabel">ยอดรวมทั้งหมด (PC)</p>
      </div>
    `;
  }

  updateDOM() {
    const allRows = Storage.getMergedStock();
    this.renderSummaryCards(allRows);

    const rows = this.getFilteredRows();

    // group rows by Type, preserving alphabetical order of type + name
    const grouped = {};
    rows
      .slice()
      .sort((a, b) => (a.material_name || "").localeCompare(b.material_name || ""))
      .forEach(row => {
        const type = row.type || "ไม่ระบุประเภท";
        if (!grouped[type]) grouped[type] = [];
        grouped[type].push(row);
      });

    let result = "";

    if (rows.length === 0) {
      result = `<p class="stockCard__empty">ไม่พบรายการที่ตรงกับเงื่อนไข</p>`;
    }

    Object.keys(grouped).sort().forEach(type => {
      const items = grouped[type];
      const subtotal = items.reduce((acc, r) => acc + (r.quantity || 0), 0);

      result += `
      <div class="stockCard__groupHeader">${type} (${items.length.toLocaleString()} รายการ — รวม ${subtotal.toLocaleString()})</div>
      `;

      items.forEach(row => {
        result += this.createCardHTML(row);
      });
    });

    this.listEl.innerHTML = result;
  }

  createCardHTML(row) {
    const updatedLabel = row.stock_updated_at
      ? formatDMYTime(row.stock_updated_at)
      : "ยังไม่เคยบันทึก";
    const unitsMissing = !row.pallet_unit && !row.layer_unit;
    const total = row.quantity || 0;

    return `
    <div class="stockCard ${total > 0 ? '' : 'stockCard--zero'}" data-material="${row.material}" data-pallet-unit="${row.pallet_unit || 0}" data-layer-unit="${row.layer_unit || 0}">
      
      <div class="stockCard__header">
        <div class="stockCard__info">
          <p class="stockCard__name">${row.material_name || ""}</p>
          <p class="stockCard__meta">
            <span class="stockCard__code">${row.material}</span>
            ${row.type ? `<span class="stockCard__typeBadge">${row.type}</span>` : ''}
          </p>
        </div>
        <div class="stockCard__summary">
          <div class="stockCard__qtyBlock">
            <span class="stockCard__qtyValue">${total.toLocaleString()}</span>
            <span class="stockCard__unit">PC</span>
          </div>
          <p class="stockCard__updated">${updatedLabel}</p>
        </div>
      </div>

      ${this.expiryInfoHTML(row) ? `<div class="stockCard__expiryInfo">${this.expiryInfoHTML(row)}</div>` : ''}

      <button class="stockCard__editBtn" aria-expanded="false">
        <span class="stockCard__editBtnLabel">แก้ไขยอด</span>
        <svg class="stockCard__chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <div class="stockCard__editForm --hidden">
        <div class="stockCard__editFormInner">
          <div class="stockCard__editRow">
            <div class="stockCard__editField">
              <label>พาเลท (เต็ม)${row.pallet_unit ? "<span class='stockCard__editUnit'>× " + row.pallet_unit + " PC</span>" : ""}</label>
              <input type="number" inputmode="numeric" class="stockCard__palletCount" min="0" placeholder="0" value="${row.pallet_count || ""}" />
            </div>
            <div class="stockCard__editField">
              <label>ชั้น (เศษ)${row.layer_unit ? "<span class='stockCard__editUnit'>× " + row.layer_unit + " PC</span>" : ""}</label>
              <input type="number" inputmode="numeric" class="stockCard__layerCount" min="0" placeholder="0" value="${row.layer_count || ""}" />
            </div>
          </div>
          <div class="stockCard__editRow">
            <div class="stockCard__editField">
              <label>วันที่ผลิต</label>
              <input type="text" inputmode="numeric" class="stockCard__productionDate" placeholder="dd/mm/yyyy" value="${isoToDMY(row.production_date)}" />
            </div>
            <div class="stockCard__editField">
              <label>วันหมดอายุ</label>
              <input type="text" inputmode="numeric" class="stockCard__bestBefore" placeholder="dd/mm/yyyy" value="${isoToDMY(row.best_before)}" />
            </div>
          </div>
          ${unitsMissing ? '<p class="stockCard__unitWarning">⚠ ยังไม่ได้ตั้งค่าหน่วย/พาเลท — ยอดรวมจะคำนวณเป็น 0 จนกว่าจะตั้งค่าที่หน้าข้อมูลหลัก</p>' : ''}
          <div class="stockCard__previewRow">
            <span>ยอดรวมใหม่:</span>
            <span class="stockCard__previewValue">${total.toLocaleString()} PC</span>
          </div>
          <div class="stockCard__editActions">
            <button class="stockCard__cancelBtn">ยกเลิก</button>
            <button class="stockCard__saveBtn">บันทึก</button>
          </div>
        </div>
      </div>

    </div>
    `;
  }

  // Renders the "ผลิต ... · หมดอายุ ... (เหลือ/เกิน N วัน)" line shown under each
  // card, color-coded by how close the material is to its Best Before date.
  expiryInfoHTML(row) {
    if (!row.production_date && !row.best_before) return "";

    const prodLabel = row.production_date ? formatDMY(row.production_date) : "-";
    const bestLabel = row.best_before ? formatDMY(row.best_before) : "-";

    let remainingText = "";
    let toneClass = "";
    if (row.best_before) {
      const remaining = daysUntil(row.best_before);
      if (remaining < 0) {
        remainingText = ` (หมดอายุแล้ว ${Math.abs(remaining).toLocaleString()} วัน)`;
        toneClass = "stockCard__expiryInfo--expired";
      } else if (remaining <= 14) {
        remainingText = ` (เหลือ ${remaining.toLocaleString()} วัน)`;
        toneClass = "stockCard__expiryInfo--soon";
      } else {
        remainingText = ` (เหลือ ${remaining.toLocaleString()} วัน)`;
      }
    }

    return `<span class="${toneClass}">ผลิต: ${prodLabel} · หมดอายุ: ${bestLabel}${remainingText}</span>`;
  }

  calcTotal(palletUnit, layerUnit, palletCount, layerCount) {
    const pu = Number(palletUnit) || 0;
    const lu = Number(layerUnit) || 0;
    const pc = Number(palletCount) || 0;
    const lc = Number(layerCount) || 0;
    return pc * pu + lc * lu;
  }

  handleClick(e) {
    const card = e.target.closest(".stockCard");
    if (!card) return;

    const editBtn = e.target.closest(".stockCard__editBtn");
    if (editBtn) {
      const form = card.querySelector(".stockCard__editForm");
      const isOpen = card.classList.contains("stockCard--editing");
      if (isOpen) {
        form.classList.add("--hidden");
        card.classList.remove("stockCard--editing");
        editBtn.setAttribute("aria-expanded", "false");
      } else {
        form.classList.remove("--hidden");
        card.classList.add("stockCard--editing");
        editBtn.setAttribute("aria-expanded", "true");
        // Focus first input for quick entry
        const firstInput = form.querySelector("input");
        if (firstInput) firstInput.focus();
      }
      return;
    }

    if (e.target.classList.contains("stockCard__cancelBtn")) {
      const form = card.querySelector(".stockCard__editForm");
      const btn = card.querySelector(".stockCard__editBtn");
      form.classList.add("--hidden");
      card.classList.remove("stockCard--editing");
      if (btn) btn.setAttribute("aria-expanded", "false");
    }

    if (e.target.classList.contains("stockCard__saveBtn")) {
      this.saveCard(card, e.target);
    }
  }

  handleInput(e) {
    const card = e.target.closest(".stockCard");
    if (!card) return;

    // Auto-calculate Best Before from Production Date + shelf_life
    if (e.target.classList.contains("stockCard__productionDate")) {
      const prodVal = e.target.value.trim();
      const materialId = Number(card.dataset.material);
      const pm = Storage.getMergedStock().find(row => row.material === materialId);
      const shelfLife = pm ? pm.shelf_life : null;

      if (shelfLife !== null && shelfLife !== undefined && prodVal.length === 10) {
        try {
          const iso = parseDMYToISO(prodVal);
          if (iso) {
            const d = new Date(iso);
            d.setDate(d.getDate() + shelfLife);
            const bbInput = card.querySelector(".stockCard__bestBefore");
            if (bbInput) {
              bbInput.value = formatDMY(d);
            }
          }
        } catch (err) {
          // Silent catch while typing, validation happens on save
        }
      }
    }

    if (
      !e.target.classList.contains("stockCard__palletCount") &&
      !e.target.classList.contains("stockCard__layerCount")
    ) {
      return;
    }

    const palletUnit = Number(card.dataset.palletUnit) || 0;
    const layerUnit = Number(card.dataset.layerUnit) || 0;
    const palletCount = Number(card.querySelector(".stockCard__palletCount").value) || 0;
    const layerCount = Number(card.querySelector(".stockCard__layerCount").value) || 0;

    const total = this.calcTotal(palletUnit, layerUnit, palletCount, layerCount);
    card.querySelector(".stockCard__previewValue").textContent = total.toLocaleString();
  }

  async saveCard(card, saveBtn) {
    const material = card.dataset.material;
    const palletUnit = card.dataset.palletUnit;
    const layerUnit = card.dataset.layerUnit;
    const palletCount = card.querySelector(".stockCard__palletCount").value;
    const layerCount = card.querySelector(".stockCard__layerCount").value;
    const productionDateText = card.querySelector(".stockCard__productionDate").value;
    const bestBeforeText = card.querySelector(".stockCard__bestBefore").value;

    let productionDateISO;
    let bestBeforeISO;
    try {
      productionDateISO = parseDMYToISO(productionDateText);
      bestBeforeISO = parseDMYToISO(bestBeforeText);
    } catch (err) {
      alert(err.message);
      return;
    }

    saveBtn.textContent = "กำลังบันทึก...";
    saveBtn.disabled = true;

    try {
      await Storage.saveStockEntry({
        material,
        pallet_unit: palletUnit,
        layer_unit: layerUnit,
        pallet_count: palletCount,
        layer_count: layerCount,
        production_date: productionDateISO,
        best_before: bestBeforeISO
      });

      const total = this.calcTotal(palletUnit, layerUnit, palletCount, layerCount);
      card.querySelector(".stockCard__qtyValue").textContent = total.toLocaleString();
      card.querySelector(".stockCard__updated").textContent = formatDMYTime(new Date());
      card.querySelector(".stockCard__expiryInfo").innerHTML = this.expiryInfoHTML({
        production_date: productionDateISO,
        best_before: bestBeforeISO
      });

      const form = card.querySelector(".stockCard__editForm");
      form.classList.add("--hidden");
      card.classList.remove("stockCard--editing");

      // refresh summary cards (recorded/not-recorded counts changed)
      this.renderSummaryCards(Storage.getMergedStock());
    } catch (err) {
      console.error(err);
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
    } finally {
      saveBtn.textContent = "บันทึก";
      saveBtn.disabled = false;
    }
  }

  async handleQuickAddSave(card, saveBtn) {
    const material = Number(card.dataset.material);
    const palletUnit = Number(card.dataset.palletUnit) || 0;
    const layerUnit = Number(card.dataset.layerUnit) || 0;

    const quickForm = card.querySelector(".stockCard__quickAddForm");
    const addedPallets = Number(quickForm.querySelector(".quickAdd__pallets").value) || 0;
    const addedLayers = Number(quickForm.querySelector(".quickAdd__layers").value) || 0;

    if (addedPallets === 0 && addedLayers === 0) {
      alert("กรุณาระบุจำนวนพาเลทหรือจำนวนชั้นที่ต้องการบวกเพิ่ม");
      return;
    }

    saveBtn.textContent = "กำลังบันทึก...";
    saveBtn.disabled = true;

    try {
      // Find current stock details
      const pm = Storage.getMergedStock().find(row => row.material === material);
      const currentPallets = pm ? pm.pallet_count || 0 : 0;
      const currentLayers = pm ? pm.layer_count || 0 : 0;

      const newPallets = currentPallets + addedPallets;
      const newLayers = currentLayers + addedLayers;

      await Storage.saveStockEntry({
        material,
        pallet_unit: palletUnit,
        layer_unit: layerUnit,
        pallet_count: newPallets,
        layer_count: newLayers,
        production_date: pm ? pm.production_date : null,
        best_before: pm ? pm.best_before : null
      });

      const total = this.calcTotal(palletUnit, layerUnit, newPallets, newLayers);
      card.querySelector(".stockCard__qtyValue").textContent = total.toLocaleString();
      card.querySelector(".stockCard__updated").textContent = formatDMYTime(new Date());

      // Close quick add form
      quickForm.classList.add("--hidden");

      // Update baseline details inside full edit form in case they open it next
      const palletInput = card.querySelector(".stockCard__palletCount");
      const layerInput = card.querySelector(".stockCard__layerCount");
      if (palletInput) palletInput.value = newPallets;
      if (layerInput) layerInput.value = newLayers;

      // refresh summary cards
      this.renderSummaryCards(Storage.getMergedStock());
      
      // If we are filtering by "recorded today", refresh DOM to ensure counts update
      if (this.showTodayOnly) {
        this.populateChips();
        this.updateDOM();
      }
    } catch (err) {
      console.error(err);
      alert(`บวกยอดเพิ่มไม่สำเร็จ: ${err.message}`);
    } finally {
      saveBtn.textContent = "+ ยืนยันเพิ่มยอด";
      saveBtn.disabled = false;
    }
  }

  triggerAddFormBBAutoCalc() {
    const prodDateInput = document.querySelector(".addForm__productionDate");
    const shelfLifeInput = document.querySelector(".addForm__shelfLife");
    const bbInput = document.querySelector(".addForm__bestBefore");
    if (!prodDateInput || !shelfLifeInput || !bbInput) return;

    const prodVal = prodDateInput.value.trim();
    const shelfLife = Number(shelfLifeInput.value);

    if (shelfLife > 0 && prodVal.length === 10) {
      try {
        const iso = parseDMYToISO(prodVal);
        if (iso) {
          const d = new Date(iso);
          d.setDate(d.getDate() + shelfLife);
          bbInput.value = formatDMY(d);
        }
      } catch (err) {
        // silent catch
      }
    }
  }

  closeAddForm() {
    this.addFormEl.classList.add("--hidden");
    document.querySelector(".addForm__materialCode").value = "";
    document.querySelector(".addForm__materialName").value = "";
    const defaultRadio = document.querySelector('.addForm__typeRadio[value="ขวด"]');
    if (defaultRadio) defaultRadio.checked = true;
    document.querySelector(".addForm__palletUnit").value = "";
    document.querySelector(".addForm__layerUnit").value = "";
    document.querySelector(".addForm__shelfLife").value = "30"; // default
    document.querySelector(".addForm__palletCount").value = "";
    document.querySelector(".addForm__layerCount").value = "";
    document.querySelector(".addForm__productionDate").value = "";
    document.querySelector(".addForm__bestBefore").value = "";
    document.querySelector(".addForm__note").value = "";
  }

  async handleCreateMaterialStock() {
    const codeEl = document.querySelector(".addForm__materialCode");
    const nameEl = document.querySelector(".addForm__materialName");
    const typeRadio = document.querySelector('input[name="addFormType"]:checked');
    const typeValue = typeRadio ? typeRadio.value : "อื่นๆ";
    const pUnitEl = document.querySelector(".addForm__palletUnit");
    const lUnitEl = document.querySelector(".addForm__layerUnit");
    const sLifeEl = document.querySelector(".addForm__shelfLife");

    const pCountEl = document.querySelector(".addForm__palletCount");
    const lCountEl = document.querySelector(".addForm__layerCount");
    const prodDateEl = document.querySelector(".addForm__productionDate");
    const bbEl = document.querySelector(".addForm__bestBefore");
    const noteEl = document.querySelector(".addForm__note");

    const materialCode = Number(codeEl.value);
    if (!materialCode || materialCode <= 0) {
      alert("กรุณาระบุรหัสวัตถุดิบเป็นตัวเลขที่ถูกต้อง");
      return;
    }

    const exists = Storage.getMasterPackmat().some(pm => pm.material === materialCode);
    if (exists) {
      alert("รหัสวัตถุดิบนี้มีอยู่ในระบบแล้ว");
      return;
    }

    const materialName = nameEl.value.trim();
    if (!materialName) {
      alert("กรุณาระบุชื่อวัตถุดิบ");
      return;
    }

    const palletUnit = pUnitEl.value ? Number(pUnitEl.value) : null;
    const layerUnit = lUnitEl.value ? Number(lUnitEl.value) : null;
    const shelfLife = sLifeEl.value ? Number(sLifeEl.value) : null;

    let productionDateISO = null;
    let bestBeforeISO = null;

    try {
      if (prodDateEl.value.trim()) {
        productionDateISO = parseDMYToISO(prodDateEl.value);
      }
      if (bbEl.value.trim()) {
        bestBeforeISO = parseDMYToISO(bbEl.value);
      }
    } catch (err) {
      alert(err.message);
      return;
    }

    this.formSaveBtn.textContent = "กำลังบันทึก...";
    this.formSaveBtn.disabled = true;

    try {
      // 1. Insert/Upsert into master_packmat
      await Storage.upsertMasterPackmat([{
        material: materialCode,
        material_name: materialName,
        type: typeValue,
        pallet_unit: palletUnit,
        layer_unit: layerUnit,
        shelf_life: shelfLife,
        category: "Packaging"
      }]);

      // 2. Save stock count entry
      await Storage.saveStockEntry({
        material: materialCode,
        pallet_count: Number(pCountEl.value) || 0,
        layer_count: Number(lCountEl.value) || 0,
        pallet_unit: palletUnit || 0,
        layer_unit: layerUnit || 0,
        production_date: productionDateISO,
        best_before: bestBeforeISO,
        note: noteEl.value.trim() || null
      });

      // 3. Close form and refresh view
      this.closeAddForm();
      this.populateTypeFilter(); // update filters with any new types
      this.updateDOM();
    } catch (err) {
      console.error(err);
      alert(`เพิ่มรายการไม่สำเร็จ: ${err.message}`);
    } finally {
      this.formSaveBtn.textContent = "บันทึกรายการ";
      this.formSaveBtn.disabled = false;
    }
  }
}

export default new StockUi();
