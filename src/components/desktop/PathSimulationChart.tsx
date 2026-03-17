/**
 * Path A/B Simulation Chart — dual-path timeline visualization
 */

import type { Language } from "@/hooks/useLanguage";

interface PathData {
  description: string;
  threeYear: string;
  fiveYear: string;
  tenYear: string;
  verificationPoints: string[];
}

interface PathSimulationChartProps {
  pathA: PathData;
  pathB: PathData;
  language: Language;
}

export default function PathSimulationChart({
  pathA,
  pathB,
  language,
}: PathSimulationChartProps) {
  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const labels = {
    pathA: isEn ? "Path A: Strengthen Alignment" : isTW ? "路徑A：強化一致" : "路径A：强化一致",
    pathB: isEn ? "Path B: Reduce Tension" : isTW ? "路徑B：降低張力" : "路径B：降低张力",
    year3: isEn ? "3 Years" : "3年",
    year5: isEn ? "5 Years" : "5年",
    year10: isEn ? "10 Years" : "10年",
    verify: isEn ? "Verification" : isTW ? "驗證點" : "验证点",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Path A */}
      <PathColumn
        title={labels.pathA}
        color="#3b82f6"
        bgColor="#eff6ff"
        data={pathA}
        yearLabels={[labels.year3, labels.year5, labels.year10]}
        verifyLabel={labels.verify}
      />

      {/* Path B */}
      <PathColumn
        title={labels.pathB}
        color="#f59e0b"
        bgColor="#fffbeb"
        data={pathB}
        yearLabels={[labels.year3, labels.year5, labels.year10]}
        verifyLabel={labels.verify}
      />
    </div>
  );
}

function PathColumn({
  title,
  color,
  bgColor,
  data,
  yearLabels,
  verifyLabel,
}: {
  title: string;
  color: string;
  bgColor: string;
  data: PathData;
  yearLabels: string[];
  verifyLabel: string;
}) {
  const steps = [
    { label: yearLabels[0], text: data.threeYear },
    { label: yearLabels[1], text: data.fiveYear },
    { label: yearLabels[2], text: data.tenYear },
  ];

  return (
    <div className="rounded-xl border p-5" style={{ borderColor: `${color}40`, backgroundColor: bgColor }}>
      <h4 className="font-bold text-sm mb-1" style={{ color }}>{title}</h4>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{data.description}</p>

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        <div
          className="absolute left-[9px] top-2 bottom-2 w-[2px]"
          style={{ backgroundColor: `${color}30` }}
        />

        {steps.map((step, index) => (
          <div key={index} className="relative mb-5 last:mb-0">
            {/* Dot */}
            <div
              className="absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center"
              style={{
                borderColor: color,
                backgroundColor: index === steps.length - 1 ? color : "#fff",
              }}
            >
              {index === steps.length - 1 && (
                <svg width={10} height={10} viewBox="0 0 10 10">
                  <path d="M2 5 L4.5 7.5 L8 3" stroke="#fff" strokeWidth={1.5} fill="none" strokeLinecap="round" />
                </svg>
              )}
            </div>

            <div className="ml-1">
              <span
                className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-1"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {step.label}
              </span>
              <p className="text-xs text-foreground leading-relaxed">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Points */}
      {data.verificationPoints.length > 0 && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: `${color}20` }}>
          <span className="text-xs font-semibold" style={{ color }}>
            {verifyLabel}
          </span>
          <ul className="mt-1 space-y-1">
            {data.verificationPoints.map((point, pointIndex) => (
              <li key={pointIndex} className="text-xs text-muted-foreground flex items-start gap-1.5">
                <span style={{ color }} className="mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
