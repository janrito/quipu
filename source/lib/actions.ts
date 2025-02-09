export const focus = (element: HTMLElement) => {
  element.focus();
  if (element instanceof HTMLInputElement && element.type === "text") {
    // select element
    element.setSelectionRange(0, element.value.length);
  }
};
