"use client";


import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NavSection } from "@/lib/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarProps {
  sections: NavSection[];
  className?: string;
}

function SidebarSection({ section, onNavigate }: { section: NavSection; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: "0.25rem" }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "0.375rem 0.75rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--color-ink-muted)",
          fontSize: "0.6875rem",
          fontWeight: 600,
          textAlign: "left",
          borderRadius: "4px",
          transition: "color 0.15s",
        }}
        aria-expanded={!collapsed}
      >
        {section.title}
        {collapsed ? (
          <ChevronRight size={12} aria-hidden />
        ) : (
          <ChevronDown size={12} aria-hidden />
        )}
      </button>
      {!collapsed && (
        <ul style={{ listStyle: "none", margin: "0.125rem 0 0.5rem", padding: 0 }}>
          {section.items.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "block",
                    padding: "0.3125rem 0.75rem",
                    paddingLeft: "1rem",
                    borderRadius: "4px",
                    fontSize: "0.8125rem",
                    color: active
                      ? "var(--color-accent-hover)"
                      : "var(--color-ink-secondary)",
                    textDecoration: "none",
                    fontWeight: active ? 500 : 400,
                    backgroundColor: active ? "var(--color-accent-subtle)" : "transparent",
                    borderLeft: active
                      ? "2px solid var(--color-accent)"
                      : "2px solid transparent",
                    transition: "color 0.15s, background-color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      const el = e.currentTarget;
                      el.style.color = "var(--color-ink)";
                      el.style.backgroundColor = "var(--color-surface-raised)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      const el = e.currentTarget;
                      el.style.color = "var(--color-ink-secondary)";
                      el.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  {item.title}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function Sidebar({ sections }: SidebarProps) {
  return (
    <nav
      aria-label="Documentation navigation"
      style={{
        position: "sticky",
        top: "52px",
        height: "calc(100vh - 52px)",
        overflowY: "auto",
        padding: "1.25rem 0.5rem 2rem",
        borderRight: "1px solid var(--color-line)",
        backgroundColor: "var(--color-surface)",
        width: "240px",
        flexShrink: 0,
      }}
    >
      {sections.map((section) => (
        <SidebarSection key={section.title} section={section} />
      ))}
    </nav>
  );
}

export function MobileSidebar({ sections }: SidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.5rem 1rem",
          backgroundColor: "var(--color-surface)",
          border: "1px solid var(--color-line)",
          borderRadius: "6px",
          color: "var(--color-ink-secondary)",
          fontSize: "0.875rem",
          cursor: "pointer",
          width: "100%",
          justifyContent: "space-between",
        }}
        aria-expanded={open}
        aria-label="Toggle documentation navigation"
      >
        <span>Navigate</span>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {open && (
        <div
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-line)",
            borderRadius: "6px",
            padding: "0.75rem 0",
            marginTop: "0.5rem",
          }}
        >
          {sections.map((section) => (
            <SidebarSection key={section.title} section={section} onNavigate={() => setOpen(false)} />
          ))}
        </div>
      )}
    </>
  );
}
