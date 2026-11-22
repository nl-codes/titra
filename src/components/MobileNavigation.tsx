"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { TaskModal } from "@/components/TaskModal";
import { ThemeToggle } from "@/components/ThemeToggle";

export function MobileNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className="mobile-navigation">
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {open && (
        <>
          <button
            className="mobile-menu-backdrop"
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          />
          <nav className="mobile-menu-drawer" aria-label="Application menu">
            <div className="brand">Titra</div>
            <ThemeToggle />
          </nav>
        </>
      )}

      <TaskModal compact />
    </div>
  );
}
