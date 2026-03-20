/**
 * Radix Dialog treats portaled popovers/selects as "outside" the dialog.
 * Call from DialogContent onPointerDownOutside / onInteractOutside so nested
 * overlays stay usable and the dialog does not swallow the first interaction.
 */
export function isEventFromNestedPortal(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest("[data-radix-popper-content-wrapper]") ||
    target.closest("[data-radix-select-content]") ||
    target.closest("[data-radix-dropdown-menu-content]"),
  );
}
