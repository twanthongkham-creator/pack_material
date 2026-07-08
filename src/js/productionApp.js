import ProductionUi from "./ProductionView.js";
import Storage from "./API.js";
import { initSidebar } from "./sidebar.js";
import { initDatePickers } from "./datePicker.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Storage.fetchAll();
  ProductionUi.setApp();
  initSidebar();
  initDatePickers();
});
