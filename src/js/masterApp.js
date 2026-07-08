import CategoryUi from "./categoryView.js";
import Storage from "./API.js";
import { initSidebar } from "./sidebar.js";

document.addEventListener("DOMContentLoaded", async () => {
  await Storage.fetchAll();
  CategoryUi.setApp();
  initSidebar();
});
