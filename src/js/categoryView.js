import Storage from "./API.js";
import { formatDMY } from "./dateUtils.js";

const mainApp = document.querySelector(".main");

// ------------------------- Selecting Category Modal --------------------------
const categoryModal = document.querySelector(".EditCategorySection");
const categoryBack = document.querySelector(".EditCategorySection");
const cancelBtnEdit = document.querySelector(".cancelBtnEdit");
const categoryModTitle = document.querySelector(".EditCatMod__title");

// Selecting the inputs
const editTitleInput = document.querySelector("#editTitle");
const editDesInput = document.querySelector("#editDescription");

// Selecting the Btns
const submitBtnEdit = document.querySelector(".submitBtnEdit");

// ---------------------- Category Inputs options in Inventory ------------------
const categoryInput = document.querySelector("#categoryInput");

// --------------------------- SearchBar ------------------------------
const searchBar = document.querySelector(".searchBarInput");

class CategoryUi {
  constructor() {
    this.id = 0;
    this.searchTerm = "";
    this.currentPage = 1;
    this.pageSize = 25;
    if (cancelBtnEdit) {
      cancelBtnEdit.addEventListener("click", (e) => {
        e.preventDefault();
        this.closeCategoryModal();
      });
    }

    if (categoryBack) {
      categoryBack.addEventListener("click", (e) => {
        if (e.target.classList.contains("EditCategorySection"))
          this.closeCategoryModal();
      });
    }

    if (submitBtnEdit) {
      submitBtnEdit.addEventListener("click", (e) => {
        e.preventDefault();
        this.submitBtnLogic();
      });
    }
  }

  setApp() {
    mainApp.innerHTML = `
    <div class="inventory-app">
        <div class="masterCard__list"></div>

        <div class="master__pagination"></div>

        <div class="import-section" style="margin-top: 40px; padding: 20px; border-radius: 12px; background: var(--bg-card, #2b2b36); border: 1px solid rgba(255, 255, 255, 0.1);">
            <h2 style="font-size: 1.5rem; margin-bottom: 15px; color: #fff;">นำเข้าข้อมูลสต็อกจากไฟล์ Excel (แยกตามประเภทวัสดุ)</h2>
            <div style="display: flex; flex-direction: column; gap: 15px; max-width: 500px;">
                <div>
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 5px; color: #a0aec0;">1. ไฟล์ข้อมูลหลักวัสดุ (mater_pk_material.xlsx)</label>
                    <input type="file" id="masterExcelInput" accept=".xlsx,.xls" style="width: 100%; padding: 8px; border-radius: 6px; background: #1f1f2e; border: 1px solid rgba(255,255,255,0.1); color: #fff;" />
                </div>
                <div>
                    <label style="display: block; font-size: 0.9rem; margin-bottom: 5px; color: #a0aec0;">2. ไฟล์รายงานสต็อกประจำวัน (รายงานขวดและกระป๋อง ประจำวัน.xlsx)</label>
                    <input type="file" id="dailyExcelInput" accept=".xlsx,.xls" style="width: 100%; padding: 8px; border-radius: 6px; background: #1f1f2e; border: 1px solid rgba(255,255,255,0.1); color: #fff;" />
                </div>
                <button id="startImportBtn" style="padding: 10px 15px; border-radius: 8px; background: #3b82f6; color: #fff; border: none; font-weight: 600; cursor: pointer; transition: all 0.2s;">เริ่มการนำเข้าข้อมูลสู่ระบบ Supabase</button>
                <div id="importStatus" style="font-size: 0.9rem; color: #cbd5e0; white-space: pre-line; background: #1f1f2e; padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05); min-height: 40px;">เตรียมพร้อมสำหรับการนำเข้าข้อมูล...</div>
            </div>
        </div>
    </div>
    `;

    this.HTMLContainer = document.querySelector(".masterCard__list");
    this.paginationEl = document.querySelector(".master__pagination");
    this.updateDOM();

    this.HTMLContainer.addEventListener("click", (e) => this.handleClick(e));
    this.HTMLContainer.addEventListener("change", (e) => this.handleChange(e));
    this.HTMLContainer.addEventListener("input", (e) => this.handlePreviewInput(e));

    if (searchBar) {
      searchBar.value = "";
      searchBar.addEventListener("input", () => {
        this.searchTerm = searchBar.value.toLowerCase().trim();
        this.currentPage = 1;
        this.updateDOM();
      });
    }

    const startImportBtn = document.querySelector("#startImportBtn");
    startImportBtn.addEventListener("click", () => this.handleExcelImport());
  }

  getFilteredMaster() {
    const allPackmat = Storage.getMasterPackmat();
    if (!this.searchTerm) return allPackmat;
    return allPackmat.filter(pm =>
      (pm.material_name || "").toLowerCase().includes(this.searchTerm) ||
      String(pm.material).includes(this.searchTerm)
    );
  }

  async handleExcelImport() {
    const masterInput = document.querySelector("#masterExcelInput");
    const dailyInput = document.querySelector("#dailyExcelInput");
    const statusDiv = document.querySelector("#importStatus");

    if (!masterInput.files[0] || !dailyInput.files[0]) {
      alert("กรุณาอัปโหลดทั้งไฟล์ข้อมูลหลักและไฟล์รายงานสต็อกประจำวัน");
      return;
    }

    try {
      statusDiv.textContent = "กำลังอ่านไฟล์ข้อมูลหลักวัสดุ...\n";
      const masterData = await this.readExcelFile(masterInput.files[0]);

      statusDiv.textContent += "กำลังอ่านไฟล์รายงานสต็อกประจำวัน...\n";
      const dailyData = await this.readExcelFile(dailyInput.files[0]);

      statusDiv.textContent += "กำลังวิเคราะห์และประมวลผลข้อมูลสต็อก...\n";

      const parseNum = (val) => {
        if (val === undefined || val === null || val === '') return null;
        const cleaned = String(val).replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      };

      // Pull the fixed "หน่วยบรรจุ" (units per pallet / per layer) and the
      // "จำนวนนับจริง" (actual counted pallets/layers on the day this report was
      // last checked) straight from sheet 'รายงานยอด_PM ประจำวัน', so no one has
      // to retype these into Master or Stock Entry by hand.
      const existingUnits = {};
      Storage.getMasterPackmat().forEach(pm => {
        existingUnits[pm.material] = { pallet_unit: pm.pallet_unit, layer_unit: pm.layer_unit };
      });

      const unitMap = {};
      const countMap = {};
      let countedAtDate = null;

      const dailyUnitSheetName = dailyData.SheetNames.find(n => n.includes('รายงานยอด_PM'));
      if (dailyUnitSheetName) {
        const dailyUnitSheet = dailyData.Sheets[dailyUnitSheetName];
        const dailyUnitRows = XLSX.utils.sheet_to_json(dailyUnitSheet, { header: "A" });

        // find the "ตรวจเช็ค ณ" checked-on date near the top of the sheet
        for (const row of dailyUnitRows) {
          const values = Object.values(row);
          const dateValue = values.find(v => v instanceof Date);
          const hasLabel = values.some(v => typeof v === 'string' && v.includes('ตรวจเช็ค'));
          if (hasLabel && dateValue) {
            countedAtDate = dateValue;
            break;
          }
        }

        dailyUnitRows.forEach(row => {
          const code = String(row['B'] || '').trim();
          if (!code) return;

          const palletUnit = parseNum(row['J']);
          const layerUnit = parseNum(row['K']);
          if (palletUnit !== null || layerUnit !== null) {
            unitMap[code] = { pallet_unit: palletUnit, layer_unit: layerUnit };
          }

          const palletCount = parseNum(row['H']);
          const layerCount = parseNum(row['I']);
          if (palletCount !== null || layerCount !== null) {
            countMap[code] = { pallet_count: palletCount || 0, layer_count: layerCount || 0 };
          }
        });

        statusDiv.textContent += `พบข้อมูลหน่วยบรรจุ/จำนวนนับจริงจากแผ่นงาน '${dailyUnitSheetName}' จำนวน ${Object.keys(unitMap).length} รายการ\n`;
      }

      const masterSheet = masterData.Sheets[masterData.SheetNames[0]];
      const masterRows = XLSX.utils.sheet_to_json(masterSheet, { header: "A" });

      const masterMap = {};
      const masterList = [];
      const nowStr = new Date().toISOString();

      for (let i = 1; i < masterRows.length; i++) {
        const row = masterRows[i];
        const code = String(row['A'] || '').trim();
        if (code) {
          masterMap[code] = {
            code: code,
            name: row['B'] || '',
            desc: row['C'] || '',
            type: String(row['E'] || 'Other').trim()
          };
          // Prefer fresh units from today's report; otherwise keep whatever was
          // already saved for this material (e.g. manually set on master.html).
          const unit = unitMap[code] || existingUnits[Number(code)] || {};
          masterList.push({
            material: Number(code),
            material_name: String(row['B'] || '').trim(),
            material_desc: String(row['C'] || '').trim(),
            material_group: String(row['D'] || '').trim(),
            type: String(row['E'] || '').trim(),
            category: String(row['H'] || '').trim(),
            pallet_unit: unit.pallet_unit ?? null,
            layer_unit: unit.layer_unit ?? null,
            updated_at: nowStr
          });
        }
      }

      // Some containers (bottles/cans) only show up in the daily report and were
      // never added to the master material list — auto-create a master record for
      // them instead of requiring someone to type it in by hand.
      let addedFromDailyReport = 0;
      if (dailyUnitSheetName) {
        const seenNewCodes = new Set();
        dailyUnitRows.forEach(row => {
          const code = String(row['B'] || '').trim();
          if (!code || !/^\d+$/.test(code) || masterMap[code] || seenNewCodes.has(code)) return;
          seenNewCodes.add(code);

          const shortDesc = String(row['C'] || '').trim();
          const fullDesc = String(row['D'] || '').trim();
          const combined = `${shortDesc} ${fullDesc}`.toLowerCase();

          // Heuristic based on this sheet's own vocabulary: PET/glass bottles vs
          // Sleek/Slim cans. Falls back to 'Other' if neither keyword is found —
          // those rows can still be reviewed/edited later from master.html.
          let type = 'Other';
          let group = '';
          if (combined.includes('ขวด') || combined.includes('bottle') || combined.includes('coolhand') || combined.includes('คลูแฮนด์')) {
            type = 'ขวด';
            group = '13-550';
          } else if (combined.includes('กระป๋อง') || combined.includes('sleek') || combined.includes('slim') || combined.includes('can')) {
            type = 'Can';
            group = '13-100';
          }

          const name = fullDesc || shortDesc;
          masterMap[code] = { code, name, desc: fullDesc, type };

          const unit = unitMap[code] || existingUnits[Number(code)] || {};
          masterList.push({
            material: Number(code),
            material_name: name,
            material_desc: fullDesc || shortDesc,
            material_group: group,
            type: type,
            category: 'Packaging',
            pallet_unit: unit.pallet_unit ?? null,
            layer_unit: unit.layer_unit ?? null,
            updated_at: nowStr
          });
          addedFromDailyReport += 1;
        });

        if (addedFromDailyReport > 0) {
          statusDiv.textContent += `พบวัสดุที่ยังไม่มีใน Master จำนวน ${addedFromDailyReport} รายการ — เพิ่มเข้า Master อัตโนมัติจากรายงานประจำวัน (โปรดตรวจสอบ Type/Group ที่ master.html อีกครั้ง)\n`;
        }
      }

      const masterCodes = Object.keys(masterMap);
      statusDiv.textContent += `พบวัสดุจำนวน ${masterCodes.length} รายการในข้อมูลหลัก\n`;

      // Extract unique types to create categories
      const uniqueTypes = [...new Set(masterCodes.map(code => masterMap[code].type))];
      statusDiv.textContent += `พบประเภทวัสดุ: ${uniqueTypes.join(', ')}\n`;

      const categoriesToUpload = uniqueTypes.map((type, idx) => ({
        id: idx + 1,
        title: type,
        description: `Material type: ${type}`,
        updated: nowStr
      }));

      // Create mapping from Type name to Category ID
      const typeToCatId = {};
      categoriesToUpload.forEach(cat => {
        typeToCatId[cat.title] = cat.id;
      });

      // Compile products with correct category mapping
      const compiled = {};
      masterCodes.forEach(code => {
        const type = masterMap[code].type;
        compiled[code] = {
          id: Number(code),
          title: masterMap[code].name,
          category: typeToCatId[type],
          quantity: 0,
          price: 0,
          pallet_count: 0,
          layer_count: 0,
          stock_updated_at: null,
          updated: nowStr
        };
      });

      const sheetNames = dailyData.SheetNames;
      
      const parseQty = (val) => {
        if (val === undefined || val === null) return 0;
        const cleaned = String(val).replace(/,/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      };

      const rptSheetName = sheetNames.find(n => n.includes('รายงาน') && !n.includes('ประจำวัน'));
      if (rptSheetName) {
        statusDiv.textContent += `กำลังประมวลผลแผ่นงาน '${rptSheetName}'...\n`;
        const rptSheet = dailyData.Sheets[rptSheetName];
        const rptRows = XLSX.utils.sheet_to_json(rptSheet, { header: "A" });
        rptRows.forEach(row => {
          const code = String(row['A'] || '').trim();
          if (compiled[code] !== undefined && row['D'] !== undefined) {
            compiled[code].quantity = parseQty(row['D']);
          }
        });
      }

      const dailySheetName = sheetNames.find(n => n.includes('รายงานยอด_PM'));
      if (dailySheetName) {
        statusDiv.textContent += `กำลังประมวลผลแผ่นงาน '${dailySheetName}'...\n`;
        const dailySheet = dailyData.Sheets[dailySheetName];
        const dailyRows = XLSX.utils.sheet_to_json(dailySheet, { header: "A" });
        let countedItems = 0;
        dailyRows.forEach(row => {
          const code = String(row['B'] || '').trim();
          if (compiled[code] === undefined) return;

          // จำนวนนับจริง (พาเลท/ชั้น) — the actual count recorded for this report
          if (countMap[code]) {
            compiled[code].pallet_count = countMap[code].pallet_count;
            compiled[code].layer_count = countMap[code].layer_count;
            compiled[code].stock_updated_at = countedAtDate ? countedAtDate.toISOString() : nowStr;
            countedItems += 1;

            const unit = unitMap[code];
            if (unit && (unit.pallet_unit || unit.layer_unit)) {
              compiled[code].quantity =
                countMap[code].pallet_count * (unit.pallet_unit || 0) +
                countMap[code].layer_count * (unit.layer_unit || 0);
            }
          }

          if (row['L'] !== undefined && !compiled[code].stock_updated_at) {
            const qty = parseQty(row['L']);
            if (compiled[code].quantity === 0 && qty > 0) {
              compiled[code].quantity = qty;
            }
          }
        });
        statusDiv.textContent += `นำเข้าจำนวนนับจริง (พาเลท/ชั้น) จากรายงานวันที่ ${countedAtDate ? formatDMY(countedAtDate) : 'ล่าสุด'} จำนวน ${countedItems} รายการ\n`;
      }

      const capSheetName = sheetNames.find(n => n === 'ฝา');
      if (capSheetName) {
        statusDiv.textContent += `กำลังประมวลผลแผ่นงาน '${capSheetName}'...\n`;
        const capSheet = dailyData.Sheets[capSheetName];
        const capRows = XLSX.utils.sheet_to_json(capSheet, { header: "A" });
        capRows.forEach(row => {
          const code = String(row['B'] || '').trim();
          if (compiled[code] !== undefined && row['D'] !== undefined) {
            const qty = parseQty(row['D']);
            if (compiled[code].quantity === 0 && qty > 0) {
              compiled[code].quantity = qty;
            }
          }
        });
      }

      let nonZeroCount = 0;
      Object.values(compiled).forEach(p => {
        if (p.quantity > 0) nonZeroCount++;
      });
      statusDiv.textContent += `ประมวลผลข้อมูลคงเหลือเสร็จสิ้น มีวัสดุ ${nonZeroCount} รายการที่มีจำนวนคงเหลือมากกว่า 0\n`;

      // 4. Upload categories to Supabase
      statusDiv.textContent += "กำลังบันทึกประเภทวัสดุในฐานข้อมูล...\n";
      for (const cat of categoriesToUpload) {
        await Storage.saveCategorie(cat);
      }

      const chunkSize = 100;

      // 5. Upload products in chunks of 100
      statusDiv.textContent += "กำลังอัปโหลดสต็อกสินค้าสู่ Supabase...\n";
      const productsArray = Object.values(compiled);
      const totalProds = productsArray.length;

      for (let i = 0; i < totalProds; i += chunkSize) {
        const chunk = productsArray.slice(i, i + chunkSize);
        statusDiv.textContent += `กำลังอัปโหลดสต็อกกลุ่มที่ ${Math.floor(i / chunkSize) + 1}/${Math.ceil(totalProds / chunkSize)}...\n`;
        await Storage.upsertProducts(chunk);
      }

      // 6. Upload master packmat in chunks of 100
      statusDiv.textContent += "กำลังอัปโหลดข้อมูลหลักวัสดุบรรจุภัณฑ์สู่ Supabase...\n";
      const totalMaster = masterList.length;

      for (let i = 0; i < totalMaster; i += chunkSize) {
        const chunk = masterList.slice(i, i + chunkSize);
        statusDiv.textContent += `กำลังอัปโหลดข้อมูลหลักกลุ่มที่ ${Math.floor(i / chunkSize) + 1}/${Math.ceil(totalMaster / chunkSize)}...\n`;
        await Storage.upsertMasterPackmat(chunk);
      }

      statusDiv.textContent += "\nนำเข้าข้อมูลเสร็จสมบูรณ์เรียบร้อยแล้ว! กำลังโหลดข้อมูลใหม่...\n";
      await Storage.fetchAll();
      this.updateDOM();
      alert("นำเข้าข้อมูลสต็อกเสร็จสมบูรณ์!");

    } catch (err) {
      console.error(err);
      statusDiv.textContent += `\nError: ${err.message}\n`;
      alert(`Import failed: ${err.message}`);
    }
  }

  readExcelFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          resolve(workbook);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  }

  openCategoryModal() {
    // Opening the Modal
    categoryModal.classList.remove("--hidden");
    this.clearInputs();
  }

  closeCategoryModal() {
    // Closing the Modal
    categoryModal.classList.add("--hidden");
    this.clearInputs();
    this.id = 0;
  }

  createHTML(category) {
    return `
     <div class="category__item">
        <div class="category__item__text">
            <h2 class="title">${category.title}</h2>
            <p class="description">${category.description}</p>
        </div>
        <div class="category__item__icons">
            <svg class="icon editCategoryIcon" data-id=${category.id}>
                <use xlink:href="../assets/images/sprite.svg#editIcon"></use>
            </svg>
            <img
                src="../assets/images/deleteIcon.svg"
                alt="delete Icon"
                class="deleteBtnCategory"
                data-id=${category.id}
            />
        </div>
    </div>`;
  }

  async submitBtnLogic() {
    // Checking if the input are empty or not
    if (editDesInput.value == "" || editTitleInput.value == "") {
      alert("Please Enter all of the fields!");
      return -1;
    }

    // checking for duplication
    if (this.id != 0) {
      const allCategories = Storage.getCategories();
      const otherCategories = allCategories.filter(
        (category) => category.id != this.id
      );
      const existed = otherCategories.find(
        (category) =>
          category.title.toLowerCase().trim() ==
          editTitleInput.value.toLowerCase().trim()
      );
      if (existed) {
        alert("Category already Exist");
        return -1;
      }
    }

    // Saving the data to localstorage
    await Storage.saveCategorie({
      id: this.id,
      title: editTitleInput.value,
      description: editDesInput.value,
    });

    this.id = 0;

    // Update the DOM
    this.updateDOM();

    // Closing the Modal
    this.closeCategoryModal();
  }

  getGroupOptions() {
    return [...new Set(Storage.getMasterPackmat().map(pm => (pm.material_group || "").trim()).filter(Boolean))].sort();
  }

  getTypeOptions() {
    return [...new Set(Storage.getMasterPackmat().map(pm => (pm.type || "").trim()).filter(Boolean))].sort();
  }

  buildSelectOptions(options, currentValue) {
    const value = (currentValue || "").trim();
    const knownOptions = value && !options.includes(value) ? [...options, value] : options;

    let html = `<option value="">-- ไม่ระบุ --</option>`;
    knownOptions.forEach(opt => {
      html += `<option value="${opt}" ${opt === value ? "selected" : ""}>${opt}</option>`;
    });
    html += `<option value="__custom__">+ เพิ่มค่าใหม่...</option>`;
    return html;
  }

  updateDOM() {
    const filtered = this.getFilteredMaster();
    const totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const start = (this.currentPage - 1) * this.pageSize;
    const pageItems = filtered.slice(start, start + this.pageSize);

    const groupOptions = this.getGroupOptions();
    const typeOptions = this.getTypeOptions();

    let result = "";
    if (pageItems.length === 0) {
      result = `<p class="stockCard__empty">ไม่พบรายการที่ตรงกับเงื่อนไข</p>`;
    }

    pageItems.forEach((pm) => {
      result += this.createCardHTML(pm, groupOptions, typeOptions);
    });

    this.HTMLContainer.innerHTML = result;

    this.renderPagination(filtered.length, totalPages);
    this.updateCategoryOptions();
  }

  createCardHTML(pm, groupOptions, typeOptions) {
    return `
    <div class="masterCard" data-material="${pm.material}">
      <div class="masterCard__top">
        <div class="masterCard__info">
          <p class="masterCard__name">${pm.material_name || ""}</p>
          <p class="masterCard__meta">รหัส ${pm.material}${pm.type ? " · " + pm.type : ""}${pm.material_group ? " · กลุ่ม " + pm.material_group : ""}</p>
        </div>
        <button class="masterCard__editBtn">แก้ไข</button>
      </div>

      <p class="masterCard__desc">${pm.material_desc || ""}</p>
      <p class="masterCard__units">หน่วย/พาเลท: ${pm.pallet_unit ?? "-"} · หน่วย/ชั้น: ${pm.layer_unit ?? "-"} · Shelf Life: ${pm.shelf_life ?? "-"} วัน</p>

      <div class="masterCard__editForm --hidden">
        <div class="masterCard__field">
          <label>ชื่อวัสดุ (MaterialName)</label>
          <input type="text" class="masterCard__nameInput" value="${pm.material_name || ""}" />
        </div>

        <div class="masterCard__field">
          <label>รายละเอียด (MaterialDesc)</label>
          <input type="text" class="masterCard__descInput" value="${pm.material_desc || ""}" />
        </div>

        <div class="masterCard__row">
          <div class="masterCard__field">
            <label>MaterialGroup</label>
            <select class="masterCard__groupSelect">${this.buildSelectOptions(groupOptions, pm.material_group)}</select>
            <input type="text" class="masterCard__groupCustom --hidden" placeholder="พิมพ์ Group ใหม่" />
          </div>
          <div class="masterCard__field">
            <label>Type</label>
            <select class="masterCard__typeSelect">${this.buildSelectOptions(typeOptions, pm.type)}</select>
            <input type="text" class="masterCard__typeCustom --hidden" placeholder="พิมพ์ Type ใหม่" />
          </div>
        </div>

        <div class="masterCard__row">
          <div class="masterCard__field">
            <label>หน่วย/พาเลท</label>
            <input type="number" min="0" class="masterCard__palletUnit" value="${pm.pallet_unit ?? ""}" placeholder="เช่น 3040" />
          </div>
          <div class="masterCard__field">
            <label>หน่วย/ชั้น</label>
            <input type="number" min="0" class="masterCard__layerUnit" value="${pm.layer_unit ?? ""}" placeholder="เช่น 380" />
          </div>
        </div>

        <div class="masterCard__row">
          <div class="masterCard__field">
            <label>Shelf Life (วัน)</label>
            <input type="number" min="0" class="masterCard__shelfLife" value="${pm.shelf_life ?? ""}" placeholder="เช่น 30" />
          </div>
          <div class="masterCard__field" style="visibility: hidden;"></div>
        </div>

        <div class="masterCard__actions">
          <button class="masterCard__cancelBtn">ยกเลิก</button>
          <button class="masterCard__saveBtn">บันทึก</button>
        </div>
      </div>
    </div>
    `;
  }

  renderPagination(totalItems, totalPages) {
    if (!this.paginationEl) return;

    this.paginationEl.innerHTML = `
      <span>ทั้งหมด ${totalItems.toLocaleString()} รายการ — หน้า ${this.currentPage} / ${totalPages}</span>
      <button class="master__prevBtn" ${this.currentPage <= 1 ? "disabled" : ""}>ก่อนหน้า</button>
      <button class="master__nextBtn" ${this.currentPage >= totalPages ? "disabled" : ""}>หน้าถัดไป</button>
    `;

    const prevBtn = this.paginationEl.querySelector(".master__prevBtn");
    const nextBtn = this.paginationEl.querySelector(".master__nextBtn");

    prevBtn.addEventListener("click", () => {
      if (this.currentPage > 1) {
        this.currentPage -= 1;
        this.updateDOM();
      }
    });

    nextBtn.addEventListener("click", () => {
      if (this.currentPage < totalPages) {
        this.currentPage += 1;
        this.updateDOM();
      }
    });
  }

  handleClick(e) {
    const card = e.target.closest(".masterCard");
    if (!card) return;

    if (e.target.classList.contains("masterCard__editBtn")) {
      card.querySelector(".masterCard__editForm").classList.remove("--hidden");
      card.classList.add("masterCard--editing");
    }

    if (e.target.classList.contains("masterCard__cancelBtn")) {
      card.querySelector(".masterCard__editForm").classList.add("--hidden");
      card.classList.remove("masterCard--editing");
    }

    if (e.target.classList.contains("masterCard__saveBtn")) {
      this.saveCard(card, e.target);
    }
  }

  handleChange(e) {
    const card = e.target.closest(".masterCard");
    if (!card) return;

    if (e.target.classList.contains("masterCard__groupSelect")) {
      const customInput = card.querySelector(".masterCard__groupCustom");
      customInput.classList.toggle("--hidden", e.target.value !== "__custom__");
      if (e.target.value === "__custom__") customInput.focus();
    }

    if (e.target.classList.contains("masterCard__typeSelect")) {
      const customInput = card.querySelector(".masterCard__typeCustom");
      customInput.classList.toggle("--hidden", e.target.value !== "__custom__");
      if (e.target.value === "__custom__") customInput.focus();
    }
  }

  // Placeholder hook kept for symmetry with other pages' live-preview inputs;
  // Master edits don't need a live-calculated total, so this is a no-op.
  handlePreviewInput() {}

  readCardValues(card) {
    const groupSelect = card.querySelector(".masterCard__groupSelect").value;
    const typeSelect = card.querySelector(".masterCard__typeSelect").value;

    const material_group = groupSelect === "__custom__"
      ? card.querySelector(".masterCard__groupCustom").value.trim()
      : groupSelect;

    const type = typeSelect === "__custom__"
      ? card.querySelector(".masterCard__typeCustom").value.trim()
      : typeSelect;

    return {
      material_name: card.querySelector(".masterCard__nameInput").value.trim(),
      material_desc: card.querySelector(".masterCard__descInput").value.trim(),
      material_group,
      type,
      pallet_unit: card.querySelector(".masterCard__palletUnit").value,
      layer_unit: card.querySelector(".masterCard__layerUnit").value,
      shelf_life: card.querySelector(".masterCard__shelfLife").value
    };
  }

  async saveCard(card, saveBtn) {
    const material = card.dataset.material;
    const values = this.readCardValues(card);

    saveBtn.textContent = "กำลังบันทึก...";
    saveBtn.disabled = true;

    try {
      await Storage.updateMasterRecord(material, values);
      this.updateDOM();
    } catch (err) {
      console.error(err);
      alert(`บันทึกไม่สำเร็จ: ${err.message}`);
      saveBtn.textContent = "บันทึก";
      saveBtn.disabled = false;
    }
  }

  clearInputs() {
    // Clearing the inputs values
    [editDesInput, editTitleInput].forEach((input) => {
      input.value = "";
    });
  }

  async deleteCategory(id) {
    // Deleting the category
    await Storage.deleteCategory(id);
    this.updateDOM();
  }

  editCategory(id) {
    const allCategories = Storage.getCategories();

    const selectedCategory = allCategories.find(
      (category) => category.id == id
    );

    // Setting the new id so we can change only this id
    this.id = id;

    // Update the title of the modal
    categoryModTitle.textContent = "Edit Category";

    // Opening the Modal
    this.openCategoryModal();

    // Updating the values
    editTitleInput.value = selectedCategory.title;
    editDesInput.value = selectedCategory.description;
  }

  updateCategoryOptions() {
    // Updating the Options category in the Inventory
    let result = `<option value="">Select product category</option>
    <option value="no-cat">No Category</option>`;
    // Getting all the value
    const allCategories = Storage.getCategories();
    allCategories.forEach((category) => {
      result += `<option value=${category.id}>${category.title}</option>`;
    });

    // Updating the DOM
    if (categoryInput) {
      categoryInput.innerHTML = result;
    }
  }
}

export default new CategoryUi();
