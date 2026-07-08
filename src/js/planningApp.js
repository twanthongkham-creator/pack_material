import PlanningUi from "./PlanningView.js";
import Storage from "./API.js";
import { initSidebar } from "./sidebar.js";
import { initDatePickers } from "./datePicker.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Storage.fetchAll();
  PlanningUi.setApp();
  initSidebar();
  initDatePickers();
});
