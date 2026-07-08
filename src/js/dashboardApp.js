import DashboardUi from "./Dashboard.js";
import Storage from "./API.js";
import { initSidebar } from "./sidebar.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Storage.fetchAll();
  DashboardUi.setApp();
  initSidebar();
});
