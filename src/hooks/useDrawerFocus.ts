import { useEffect, type RefObject } from "react";

export function useDrawerFocus(ref: RefObject<HTMLElement | null>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    const drawer = ref.current;
    const opener = document.activeElement;
    drawer?.querySelector<HTMLButtonElement>("button")?.focus();

    function keepFocusInDrawer(event: KeyboardEvent) {
      if (event.key !== "Tab" || !drawer) return;
      const controls = drawer.querySelectorAll<HTMLElement>("a[href], button:not(:disabled)");
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }

    drawer?.addEventListener("keydown", keepFocusInDrawer);
    return () => {
      drawer?.removeEventListener("keydown", keepFocusInDrawer);
      if (opener instanceof HTMLElement && drawer?.contains(document.activeElement)) {
        opener.focus();
      }
    };
  }, [isOpen, ref]);
}
