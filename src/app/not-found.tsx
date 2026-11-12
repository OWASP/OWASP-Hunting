import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <main
        id="main-content"
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "4rem 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "440px" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.75rem",
              color: "var(--color-accent)",
              marginBottom: "1rem",
            }}
          >
            404
          </p>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              color: "var(--color-ink)",
              margin: "0 0 0.75rem",
              letterSpacing: "-0.02em",
            }}
          >
            Page not found
          </h1>
          <p
            style={{
              fontSize: "0.9375rem",
              color: "var(--color-ink-secondary)",
              lineHeight: 1.6,
              margin: "0 0 2rem",
            }}
          >
            The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                backgroundColor: "var(--color-accent)",
                color: "var(--color-canvas)",
                borderRadius: "5px",
                textDecoration: "none",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              <ArrowLeft size={14} aria-hidden />
              Back to Home
            </Link>
            <Link
              href="/docs"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-ink-secondary)",
                border: "1px solid var(--color-line)",
                borderRadius: "5px",
                textDecoration: "none",
                fontSize: "0.875rem",
              }}
            >
              Browse Docs
            </Link>
          </div>
          <p
            style={{
              marginTop: "2rem",
              fontSize: "0.8125rem",
              color: "var(--color-ink-muted)",
            }}
          >
            Try{" "}
            <kbd
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.75rem",
                padding: "0.125rem 0.35rem",
                border: "1px solid var(--color-line)",
                borderRadius: "3px",
                backgroundColor: "var(--color-surface)",
                color: "var(--color-ink-secondary)",
              }}
            >
              ⌘K
            </kbd>{" "}
            to search the documentation.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
