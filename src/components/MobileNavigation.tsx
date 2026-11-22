"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { TaskModal } from "@/components/TaskModal";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ViewSwitch, type TaskView } from "@/components/ViewSwitch";

export function MobileNavigation({
  view,
  onViewChange,
}: {
  view: TaskView;
  onViewChange: (view: TaskView) => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function changeView(view: TaskView) {
    onViewChange(view);
    setOpen(false);
  }

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
            <ViewSwitch view={view} onChange={changeView} />
          </nav>
        </>
      )}

      <TaskModal compact />
    </div>
  );
}
