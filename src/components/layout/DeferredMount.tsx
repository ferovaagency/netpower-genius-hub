import { useEffect, useState, type ReactNode } from "react";

/**
 * Retrasa el montaje de sus hijos hasta que el navegador esté idle
 * o el usuario interactúe (scroll/click/keydown/touch/mousemove).
 * Sirve para diferir widgets no críticos (chat, popups) y liberar
 * ancho de banda / CPU en el primer render, mejorando LCP/TTI.
 */
export default function DeferredMount({
  children,
  timeout = 3000,
}: {
  children: ReactNode;
  timeout?: number;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (show) return;
    let cancelled = false;
    const activate = () => { if (!cancelled) setShow(true); };

    const events: (keyof WindowEventMap)[] = [
      "scroll", "pointerdown", "keydown", "touchstart", "mousemove",
    ];
    const onEvent = () => activate();
    events.forEach((e) => window.addEventListener(e, onEvent, { once: true, passive: true } as AddEventListenerOptions));

    // Fallback: idle callback o timeout duro.
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout: number }) => number)
      | undefined;
    const idleId = ric ? ric(activate, { timeout }) : window.setTimeout(activate, timeout);

    return () => {
      cancelled = true;
      events.forEach((e) => window.removeEventListener(e, onEvent));
      if (ric && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idleId);
      else clearTimeout(idleId as number);
    };
  }, [show, timeout]);

  return show ? <>{children}</> : null;
}
