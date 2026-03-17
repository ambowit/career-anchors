/**
 * Value × Anchor Heatmap — 8 value dimensions × 8 anchor codes
 * Cell = V_dim_weight * W(dim→anchor) * anchor_score
 */

import { useMemo } from "react";
import type { ValueDimension, AnchorCode } from "@/lib/fusionEngineV3";
import { VALUE_DIMENSIONS, ANCHOR_CODES, getDimensionLabel, getAnchorLabel } from "@/lib/fusionEngineV3";
import type { Language } from "@/hooks/useLanguage";

interface ValueAnchorHeatmapProps {
  heatmapData: Record<ValueDimension, Record<AnchorCode, number>>;
  language: Language;
}

function getHeatColor(value: number, maxValue: number): string {
  if (maxValue === 0) return "#f8fafc";
  const intensity = Math.min(value / maxValue, 1);
  if (intensity < 0.05) return "#f8fafc";
  if (intensity < 0.15) return "#e0f2fe";
  if (intensity < 0.3) return "#7dd3fc";
  if (intensity < 0.5) return "#38bdf8";
  if (intensity < 0.7) return "#0284c7";
  if (intensity < 0.85) return "#0369a1";
  return "#075985";
}

function getTextColor(value: number, maxValue: number): string {
  if (maxValue === 0) return "#94a3b8";
  const intensity = Math.min(value / maxValue, 1);
  return intensity > 0.45 ? "#ffffff" : "#334155";
}

export default function ValueAnchorHeatmap({
  heatmapData,
  language,
}: ValueAnchorHeatmapProps) {
  const { maxValue, flatData } = useMemo(() => {
    let foundMax = 0;
    const dataFlat: Array<{ dim: ValueDimension; anchor: AnchorCode; value: number }> = [];
    for (const dim of VALUE_DIMENSIONS) {
      for (const anchor of ANCHOR_CODES) {
        const cellValue = heatmapData[dim]?.[anchor] || 0;
        if (cellValue > foundMax) foundMax = cellValue;
        dataFlat.push({ dim, anchor, value: cellValue });
      }
    }
    return { maxValue: foundMax, flatData: dataFlat };
  }, [heatmapData]);

  const cellSize = 52;
  const headerHeight = 44;
  const rowLabelWidth = 90;

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse" style={{ fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ width: rowLabelWidth, height: headerHeight, padding: "4px 8px" }} />
            {ANCHOR_CODES.map(anchor => (
              <th
                key={anchor}
                style={{
                  width: cellSize,
                  height: headerHeight,
                  padding: "4px",
                  textAlign: "center",
                  fontWeight: 600,
                  color: "#475569",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                <div className="text-xs leading-tight">{getAnchorLabel(anchor, language)}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{anchor}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {VALUE_DIMENSIONS.map(dim => (
            <tr key={dim}>
              <td
                style={{
                  padding: "4px 8px",
                  fontWeight: 600,
                  color: "#334155",
                  borderRight: "2px solid #e2e8f0",
                  whiteSpace: "nowrap",
                }}
              >
                {getDimensionLabel(dim, language)}
              </td>
              {ANCHOR_CODES.map(anchor => {
                const cellValue = heatmapData[dim]?.[anchor] || 0;
                const bgColor = getHeatColor(cellValue, maxValue);
                const textColor = getTextColor(cellValue, maxValue);
                return (
                  <td
                    key={`${dim}-${anchor}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      textAlign: "center",
                      backgroundColor: bgColor,
                      color: textColor,
                      fontWeight: 600,
                      fontSize: 11,
                      border: "1px solid #f1f5f9",
                      transition: "background-color 0.2s",
                    }}
                    title={`${getDimensionLabel(dim, language)} × ${anchor}: ${cellValue.toFixed(1)}`}
                  >
                    {cellValue > 0.1 ? cellValue.toFixed(1) : "—"}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Color scale legend */}
      <div className="flex items-center gap-2 mt-3 justify-center">
        <span className="text-xs text-muted-foreground">
          {language === "en" ? "Low" : "低"}
        </span>
        <div className="flex h-3">
          {["#f8fafc", "#e0f2fe", "#7dd3fc", "#38bdf8", "#0284c7", "#0369a1", "#075985"].map((color, colorIndex) => (
            <div key={colorIndex} style={{ width: 20, height: 12, backgroundColor: color }} />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">
          {language === "en" ? "High" : "高"}
        </span>
      </div>
    </div>
  );
}
