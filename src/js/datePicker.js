// Shared "click to open a native calendar" behavior for every dd/mm/yyyy date
// text field in the system (production date, best before, plan dates, etc.).
//
// The visible inputs stay plain <input type="text"> so the system-wide
// dd/mm/yyyy display format stays fully under our control (native
// <input type="date"> renders in whatever format the browser/OS locale
// dictates, which we can't force to dd/mm/yyyy). Instead, clicking/focusing
// one of these fields opens a single shared, invisible native
// <input type="date"> to get the OS/browser's calendar picker UI, and the
// picked value is written back into the visible field as dd/mm/yyyy.
//
// Uses event delegation on document so this works for fields that don't
// exist yet at call time (e.g. stock cards rendered/re-rendered later) —
// initDatePickers() only needs to be called once per page.

import { formatDMY, parseDMYToISO } from "./dateUtils.js";

const SELECTOR = 'input[placeholder="dd/mm/yyyy"]';

let hiddenInput = null;
let initialized = false;

function getHiddenInput() {
  if (hiddenInput) return hiddenInput;
  hiddenInput = document.createElement("input");
  hiddenInput.type = "date";
  hiddenInput.setAttribute("aria-hidden", "true");
  hiddenInput.tabIndex = -1;
  hiddenInput.style.position = "fixed";
  hiddenInput.style.left = "0";
  hiddenInput.style.top = "0";
  hiddenInput.style.width = "1px";
  hiddenInput.style.height = "1px";
  hiddenInput.style.opacity = "0";
  hiddenInput.style.pointerEvents = "none";
  hiddenInput.style.border = "0";
  document.body.appendChild(hiddenInput);
  return hiddenInput;
}

function openPickerFor(textInput) {
  const picker = getHiddenInput();

  // Position the hidden input exactly where the textInput is located
  // so the native calendar picker aligns properly under the text field.
  const rect = textInput.getBoundingClientRect();
  picker.style.left = `${rect.left + window.scrollX}px`;
  picker.style.top = `${rect.top + window.scrollY}px`;
  picker.style.width = `${rect.width}px`;
  picker.style.height = `${rect.height}px`;

  try {
    picker.value = parseDMYToISO(textInput.value) || "";
  } catch (err) {
    picker.value = "";
  }

  picker.onchange = () => {
    if (!picker.value) return;
    textInput.value = formatDMY(picker.value);
    textInput.dispatchEvent(new Event("input", { bubbles: true }));
    textInput.dispatchEvent(new Event("change", { bubbles: true }));
  };
  if (typeof picker.showPicker === "function") {
    try {
      picker.showPicker();
      textInput.blur();
      return;
    } catch (err) {
      // Fallback if showPicker fails
    }
  }

  textInput.blur();
  picker.click();
}

function handleOpen(e) {
  const target = e.target;
  if (!target || typeof target.matches !== "function") return;
  if (!target.matches(SELECTOR)) return;
  openPickerFor(target);
}

export function initDatePickers() {
  if (initialized) return;
  initialized = true;
  document.addEventListener("focusin", handleOpen);
  document.addEventListener("click", handleOpen);
}
