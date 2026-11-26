import { SITE_CONFIG } from "@/lib/navigation";
import type { PayloadPage } from "@/lib/payload-data";

export const EDUCATION_TOC = [
  { id: "what-it-is", text: "What it is", level: 2 },
  { id: "attack-vectors", text: "Attack vectors", level: 2 },
  { id: "testing-methodology", text: "Testing methodology", level: 2 },
  { id: "indicators", text: "Indicators", level: 2 },
  { id: "detection", text: "Detection", level: 2 },
  { id: "mitigation", text: "Mitigation", level: 2 },
  { id: "references", text: "References", level: 2 },
];

/** The hand-written guidance for a category: what it is, how to test, detect and fix it. */
export function EducationalSections({ page, dir }: { page: PayloadPage; dir: string }) {
  return (
    <div className="prose" style={{ maxWidth: "none" }}>
      <h2 id="what-it-is">What it is</h2>
      <p>{page.whatItIs}</p>

      <h2 id="attack-vectors">Attack vectors</h2>
      <ul>
        {page.whereItAppears.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 id="testing-methodology">Testing methodology</h2>
      <ol>
        {page.testingMethodology.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <h2 id="indicators">Indicators of vulnerability</h2>
      <ul>
        {page.indicators.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 id="detection">Detection guidance</h2>
      <p>{page.detectionGuidance}</p>

      <h2 id="mitigation">Mitigation and remediation</h2>
      <ul>
        {page.mitigations.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>

      <h2 id="references">References</h2>
      <ul>
        {page.references.map((ref, i) => (
          <li key={i}>
            <a href={ref.url} target="_blank" rel="noopener noreferrer" className="link-external">
              {ref.title}
            </a>
          </li>
        ))}
        <li>
          <a href={`${SITE_CONFIG.upstreamRepo}/tree/main/${dir}`} target="_blank" rel="noopener noreferrer" className="link-external">
            OWASP Hunting: {page.title} (source)
          </a>
        </li>
      </ul>
    </div>
  );
}
