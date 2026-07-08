// Shared sidebar behavior used by every page: the desktop collapse/expand
// toggle (persisted across page loads via localStorage). Mobile uses a
// persistent fixed bottom bar (.sideBar-ontoggle) that needs no JS toggle.

const COLLAPSE_STORAGE_KEY = "pm_sidebar_collapsed";

export function initSidebar() {
  const appEl = document.querySelector(".app");
  const collapseBtn = document.querySelector(".sideBar__collapseBtn");

  if (appEl && collapseBtn) {
    if (localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1") {
      appEl.classList.add("app--sideBarCollapsed");
    }

    collapseBtn.addEventListener("click", () => {
      const isCollapsed = appEl.classList.toggle("app--sideBarCollapsed");
      localStorage.setItem(COLLAPSE_STORAGE_KEY, isCollapsed ? "1" : "0");
    });
  }
}
