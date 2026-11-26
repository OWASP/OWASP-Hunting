// Copy text to the clipboard. Falls back to a hidden textarea where the async
// clipboard API is unavailable (non-secure contexts, older browsers).

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const previousFocus = document.activeElement as HTMLElement | null;
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("aria-hidden", "true");
    field.tabIndex = -1;
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    try {
      field.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      field.remove();
      previousFocus?.focus();
    }
  }
}
