import InventoryUi from "./InventoryView.js";
import CategoryUi from "./categoryView.js";
import Storage from "./API.js";
import { initSidebar } from "./sidebar.js";

// Search Bar
const searchBar = document.querySelector(".searchBarInput");

document.addEventListener("DOMContentLoaded", async () => {
  await Storage.fetchAll();
  CategoryUi.updateCategoryOptions();
  InventoryUi.setApp();
  initSidebar();

  searchBar.addEventListener("input", () => {
    InventoryUi.seachLogic(searchBar.value);
  });
});
