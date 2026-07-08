# คู่มือการพัฒนาระบบตารางแบบไดนามิก (Dynamic Table Customization Guide)

เอกสารนี้รวบรวมทักษะ แนวคิด และรูปแบบโค้ด (Design Patterns) ที่ใช้ในการพัฒนาคุณสมบัติขั้นสูงสำหรับตารางข้อมูล ได้แก่:
1. **การซ่อน/แสดงคอลัมน์แบบไดนามิก (Column Visibility Toggle)**
2. **การลากและวางเพื่อสลับคอลัมน์ (HTML5 Drag-and-Drop Column Reordering)**
3. **การตรึงหัวตารางขณะเลื่อนข้อมูล (Sticky Column Headers)**
4. **ความยืดหยุ่นของขนาดและความกว้างคอลัมน์เริ่มต้น (Spacious Column Widths & Resizing)**

---

## 1. การสลับการแสดงผลของคอลัมน์ (Column Visibility Toggle)

### แนวคิดหลัก
1. บันทึกลำดับคอลัมน์ (`colOrder`) ในรูปแบบ Array ของชื่อคีย์คอลัมน์ และคอลัมน์ที่ถูกซ่อน (`hiddenCols`) ในรูปแบบ Set หรือ Array
2. การปรับเปลี่ยนการซ่อน/แสดงจะเพิ่มหรือลดชื่อคอลัมน์ในตัวแปรเก็บสถานะ (State) จากนั้นจัดเก็บค่าลงใน `localStorage` เพื่อรักษาสถานะเมื่อรีเฟรชหน้าเว็บ
3. การเรนเดอร์ตารางจะทำงานแบบไดนามิกโดยกรองคอลัมน์ที่ไม่แสดงผลออกก่อนการเรนเดอร์

### โครงสร้างปุ่มตั้งค่าและ Dropdown (HTML)
```html
<div class="dropdown-wrapper" style="position: relative; display: inline-block;">
  <button class="btn btn-ghost btn-sm" onclick="toggleSettingsDropdown(event)">
    ⚙️ ตั้งค่าตาราง
  </button>
  <div id="settings-dropdown" style="display: none; position: absolute; right: 0; z-index: 100;">
    <div class="dropdown-header">แสดง/ซ่อน Column</div>
    <div id="column-toggles-container">
      <!-- Checkbox สำหรับเปิด/ปิดแสดงผลจะเรนเดอร์ผ่าน JS -->
    </div>
    <button onclick="resetSettings()">รีเซ็ตตาราง</button>
  </div>
</div>
```

---

## 2. การลากและวางสลับตำแหน่งคอลัมน์ (Drag-and-Drop Reordering)

### แนวคิดหลัก
1. กำหนดคุณลักษณะ `draggable="true"` ลงบนแท็ก `<th>` ที่ต้องการอนุญาตให้ลากได้
2. ติดตั้งตัวจัดการเหตุการณ์ (Event Handlers) สำหรับการลากและวางใน HTML5
3. ใช้ตัวแปรสถานะป้องกันไม่ให้การลาก (Drag) ไปเปิดใช้งานอีเวนต์คลิกเพื่อจัดเรียงข้อมูล (Sort)

### อีเวนต์ที่สำคัญสำหรับจัดการจัดเรียงคอลัมน์ (JavaScript)
* **`dragstart`**: เก็บชื่อฟิลด์คอลัมน์ที่กำลังถูกลาก (`draggedField = field`) และเพิ่ม Class สำหรับตกแต่งโปร่งแสง
* **`dragover`**: ป้องกันพฤติกรรมเริ่มต้นของเบราว์เซอร์ (`e.preventDefault()`) เพื่ออนุญาตให้วางได้
* **`dragenter`**: แสดงเส้นปะหรือไฮไลต์บอกพื้นที่หย่อนข้อมูลทางด้านซ้ายของหัวตารางที่เป็น Drop Target
* **`dragleave`**: ลบไฮไลต์ Drop Target เมื่อเมาส์เคลื่อนออก
* **`drop`**: ตรวจจับเป้าหมายการวาง จากนั้นสลับตำแหน่งของคอลัมน์ต้นทางและปลายทางในตัวแปรอาเรย์ `colOrder` จากนั้นสั่งเรนเดอร์ตารางใหม่และเซฟค่าลงใน `localStorage`
* **`dragend`**: ล้าง Class ไฮไลต์การลากออกจากหัวตารางทั้งหมด และปลดล็อกการกดปุ่ม sort ทั่วไป

### ตัวอย่างสไตล์ไฮไลต์การลากวาง (CSS)
```css
.dragging-th {
  opacity: 0.5;
  background: var(--surface3) !important;
}
.drag-over-th {
  border-left: 3px dashed var(--accent) !important;
  background: rgba(99, 102, 241, 0.05) !important;
}
```

---

## 3. การเรนเดอร์เซลล์ตารางแบบไดนามิก (Dynamic Row Rendering)

การสลับคอลัมน์และซ่อนคอลัมน์ทำให้เราไม่สามารถเขียนเทมเพลตแถวเป็นโค้ด HTML แบบ Hardcoded ได้อีกต่อไป ระบบจำต้องสร้างเซลล์ทีละชิ้นตามลำดับและสถานะการซ่อนของคอลัมน์ในปัจจุบัน

### แนวทางปฏิบัติ: ตัวประมวลผลเซลล์ (Renderer Dictionaries)
สร้างพจนานุกรม (Dictionary) จัดเก็บฟังก์ชันการเรนเดอร์คอลัมน์แต่ละชนิด โดยรับข้อมูลแถว (Row Object) และคืนค่าเป็นสายอักขระ HTML สำหรับเซลล์ `<td>`:

```javascript
// ตัวอย่างตัวเรนเดอร์สำหรับตารางข้อมูลหลัก
const rowRenderers = {
  code: (r) => `<td class="code-text">${r.code}</td>`,
  name: (r) => `<td>${r.name || '—'}</td>`,
  quantity: (r) => `<td style="text-align:right;">${r.quantity.toLocaleString()}</td>`,
  action: (r) => `<td><button onclick="editItem('${r.id}')">แก้ไข</button></td>`
};

// ฟังก์ชันหลักในการจัดสร้าง HTML แถว
function generateRowHtml(row, visibleCols) {
  let rowHtml = '<tr>';
  visibleCols.forEach(field => {
    rowHtml += rowRenderers[field](row);
  });
  rowHtml += '</tr>';
  return rowHtml;
}
```

---

## 4. การตรึงหัวตารางและขนาดของตาราง (Sticky Headers & Fixed Layout)

เพื่อป้องกันตารางบิดเบี้ยวเมื่อคอลัมน์ถูกสลับ ตารางควรปรับพฤติกรรมโครงสร้างเป็นแบบ `fixed` และควรกำหนดความกว้างเริ่มต้นของหัวคอลัมน์แต่ละหัวไว้ล่วงหน้าเพื่อให้พื้นที่กว้างพอสำหรับข้อความภาษาไทย

### สไตล์ควบคุมตารางและหัวข้อ
```css
/* ตรึงหัวตารางไว้กับขอบบนของพื้นที่เลื่อน */
thead th {
  position: sticky !important;
  top: 0;
  z-index: 10;
  background: var(--surface2) !important;
}

/* ตั้งค่าตารางให้อิงตามความกว้างของ th ใน thead เสมอ */
table {
  table-layout: fixed !important;
  width: 100%;
}

/* ลบล้างค่าความกว้างคงตัวของ td เพื่อให้สอดคล้องกับ th เสมอ */
table td:nth-child(n) {
  width: auto !important;
}
```
*การประยุกต์ใช้สไตล์ข้างต้นคู่กับความกว้างคงตัว (Inline widths) บน `<th>` ในแถวหัวตาราง จะช่วยให้คุณสมบัติการย่อขยายขนาดคอลัมน์และการลากวางแสดงผลได้อย่างราบรื่น 100%*
