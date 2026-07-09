import StockUi from "./StockView.js?v=2.6";
import Storage from "./API.js";
import { initSidebar } from "./sidebar.js";
import { initDatePickers } from "./datePicker.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Storage.fetchAll();
  StockUi.setApp();
  initSidebar();
  initDatePickers();
});
