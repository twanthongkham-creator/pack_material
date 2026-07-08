# เอกสารทักษะและรูปแบบการพัฒนา (Technical Skills & Patterns Guide)

เอกสารนี้ระบุทักษะเชิงลึก รูปแบบการออกแบบสถาปัตยกรรม (Design Patterns) และความเชี่ยวชาญทางเทคนิคที่ใช้ในการพัฒนาระบบจัดการสต็อกบรรจุภัณฑ์ เพื่อให้สอดคล้องกับมาตรฐานทางวิศวกรรมซอฟต์แวร์และการซ่อมบำรุงระบบในอนาคต

---

## 1. การจัดการสถาปัตยกรรมระดับไคลเอนต์ (Client-Side Architecture)

### 1.1 Vanilla JavaScript ES6 Modules
* **การใช้สถาปัตยกรรมแบบแยกโมดูล (Modular JavaScript):** แอปพลิเคชันแยกฟังก์ชันการทำงานเป็นไฟล์เดี่ยว เช่น `API.js`, `dateUtils.js`, `sidebar.js` และไฟล์ `View.js`/`App.js` ประจำหน้าเว็บแต่ละหน้า
* **การทำหน้าที่ขอบเขตที่ชัดเจน (Separation of Concerns):**
  * `*App.js` ทำหน้าที่ดึงข้อมูลตั้งต้น สั่งเรียกใช้ UI และเปิดใช้งาน Sidebar (Controller)
  * `*View.js` จัดการพฤติกรรมการคลิก การแสดงฟอร์ม และจัดการการเปลี่ยนสถานะของ UI (View)
  * `API.js` ทำหน้าที่สตรีมข้อมูลเข้าออกฐานข้อมูล ควบคุมแคช และตรรกะทางธุรกิจของข้อมูลทั้งหมด (Model)

### 1.2 State Management & Cache Synchronization
* การใช้งานคลาสเก็บข้อมูลกลาง (`Storage`) ซึ่งเก็บข้อมูลในรูปตัวแปรอาเรย์ภายในหน่วยความจำชั่วคราว (Cache Arrays) เช่น `this.products`, `this.masterPackmat` เพื่อลดภาระการร้องขอข้อมูลผ่าน API บ่อยเกินความจำเป็น
* **การซิงโครไนซ์สถานะแบบ 2 ทิศทาง (Dual-Path State Synchronization):** เมื่อเกิดการเปลี่ยนแปลงข้อมูล (เช่น ยืนยันการผลิตหรือบันทึกแผน) ข้อมูลจะต้องถูกส่งไปยัง Supabase DB พร้อมกับอัปเดตตัวแปรภายใน Cache ทันที เพื่อให้การเรนเดอร์ UI ใหม่อ้างอิงข้อมูลล่าสุดได้ทันทีโดยไม่ต้องเรียก Fetch ใหม่ทั้งหมด

---

## 2. การประมวลผลไฟล์และการนำเข้าข้อมูล (File Operations & Data Processing)

### 2.1 Asynchronous Excel Parsing ด้วย SheetJS
* **การจัดการไฟล์แบบ Non-blocking:** ใช้ `FileReader API` เพื่อแปลงอ็อบเจกต์ไฟล์ที่ได้จาก `<input type="file">` ให้เป็น `ArrayBuffer` หรือ `Uint8Array`
* **การประมวลผลข้อมูลชีตด้วยไลบรารี XLSX:**
  ```javascript
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    // ประมวลผล workbook ...
  };
  ```
* **Heuristic Classification (ตรรกะการจำแนกข้อมูล):** การใช้คำสำคัญ (Keywords) ค้นหาจากรายละเอียดข้อความของตาราง เพื่อวิเคราะห์และตัดสินใจว่าวัสดุบรรจุภัณฑ์นั้นเป็นประเภทใด เช่น หากคำอธิบายมีคำว่า `"ขวด"`, `"bottle"` หรือ `"coolhand"` ระบบจะจัดประเภทเป็น `"ขวด"` อัตโนมัติ

---

## 3. ตรรกะเชิงคำนวณและการคำนวณวันหมดอายุ (Algorithmic Logic)

### 3.1 การแปลงพหุหน่วยนับ (Multi-Unit Pack Conversion)
* ความสามารถในการพัฒนาตรรกะคำนวณหน่วยย่อยจากยอดพาเลทและชั้น ซึ่งแปรผันตามวัสดุแต่ละตัว โดยการอ่านข้อมูลหน่วยการบรรจุคงที่จากฐานข้อมูลหลัก:
  $$\text{Quantity} = (\text{Pallet Count} \times \text{Pallet Unit}) + (\text{Layer Count} \times \text{Layer Unit})$$
* มีระบบ Live Preview แสดงผลจำนวนหน่วยย่อยทันทีที่ผู้ใช้กรอกตัวเลขโดยใช้ Event Listener `input` แทนการรอให้กดบันทึก ช่วยลดความผิดพลาดในการป้อนข้อมูล (Data Entry Validation)

### 3.2 ระบบจัดการวันผลิตและวันหมดอายุ (FEFO & Expiry Calculation)
* การแปลงและตรวจสอบรูปแบบวันที่ของไทย (dd/mm/yyyy) เป็นรูปแบบมาตรฐาน ISO Date เพื่อเก็บในฐานข้อมูล
* **การคำนวณความเสี่ยงของอายุวัสดุ (Expiry Risk Assessment):** ใช้ฟังก์ชันคำนวณระยะห่างระหว่างวันหมดอายุกับวันปัจจุบัน (`daysUntil`):
  ```javascript
  export function daysUntil(dateString) {
    const target = new Date(dateString);
    const today = new Date();
    // ล้างเวลาเป็น 00:00:00 เพื่อคำนวณแค่วัน
    target.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  ```
  จากนั้นนำผลลัพธ์มาแมปเข้ากับ CSS classes เพื่อเปลี่ยนโทนสีเตือน (เช่น สีแดงสำหรับหมดอายุ และสีเหลืองสำหรับใกล้หมดอายุ)

---

## 4. เทคนิคการพัฒนาส่วนหน้าและส่วนต่อประสานผู้ใช้ (UI/UX Engineering)

### 4.1 Event Delegation Pattern
* ใช้รูปแบบการฝากเหตุการณ์ไว้ที่องค์ประกอบแม่ (Event Delegation) เช่น ติดตั้ง Event Listener ไว้ที่ `.stockCard__list` เพียงจุดเดียว เพื่อตรวจจับการคลิกแก้ไขหรือยกเลิกที่เกิดขึ้นภายใน Card ย่อย แทนการติดตั้งทีละปุ่ม เพื่อช่วยประหยัดหน่วยความจำและป้องกันปัญหา Event memory leaks เมื่อมีการลบและสร้างการ์ดขึ้นใหม่แบบไดนามิก

### 4.2 Dynamic Datalist Autocomplete
* การผสมผสานแท็ก `<input>` ร่วมกับ `<datalist>` เพื่อให้การวางแผนสร้างแผนรับเข้าสินค้าหรือแผนผลิตมีความแม่นยำสูง ผู้ใช้สามารถค้นหาชื่อวัสดุด้วยการพิมพ์ภาษาไทยหรือภาษาอังกฤษ หรือพิมพ์รหัสวัสดุ แล้วเลือกจากรายการแนะนำ เพื่อหลีกเลี่ยงการป้อนรหัสที่ไม่มีอยู่ในฐานข้อมูลจริง

### 4.3 Clean UI with CSS Variable Theme
* การพัฒนาโครงสร้าง CSS ที่ควบคุมด้วยตัวแปร (CSS Variables) เช่น `--bg-card`, `--accent`, `--surface2` ทำให้รองรับการขยายตัวสู่ระบบ Dark mode หรือ Multi-theme ได้ง่ายในอนาคต
