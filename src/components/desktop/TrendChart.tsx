import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DIMENSIONS } from "@/hooks/useAssessment";
import { useTranslation } from "@/hooks/useLanguage";
import type { StoredAssessmentResult } from "@/hooks/useAssessmentResults";
import { standardizeScores, DIMENSION_CODES } from "@/data/questions";

interface TrendChartProps {
  results: StoredAssessmentResult[];
  selectedDimensions?: string[];
}

const DIMENSION_COLORS: Record<string, string> = {
  TF: "#004E8C", // 技术/专业能力型 - Deep blue
  GM: "#0F172A", // 管理型 - Slate dark
  AU: "#D97706", // 自主/独立型 - Amber
  SE: "#059669", // 安全/稳定型 - Emerald
  EC: "#B91C1C", // 创业/创造型 - Red
  SV: "#7C3AED", // 服务/奉献型 - Purple
  CH: "#DC2626", // 挑战型 - Bright red
  LS: "#0891B2", // 生活方式整合型 - Cyan
};

export default function TrendChart({
  results,
  selectedDimensions = ["TF", "GM", "AU", "SE"],
}: TrendChartProps) {
  const { language } = useTranslation();

  // Get dimension name in current language
  const getDimensionName = (dim: string) => {
    return DIMENSIONS[dim as keyof typeof DIMENSIONS]?.[language] || dim;
  };

  // Multilingual texts
  const texts = {
    "zh-CN": {
      title: "职业锚变化趋势",
      description: (count: number) => `显示你过去 ${count} 次测评中，各维度得分的变化情况`,
      noData: "需要至少 2 次测评记录才能显示趋势图",
      scoreLabel: "得分",
      scoreUnit: "分",
    },
    "zh-TW": {
      title: "職業錨變化趨勢",
      description: (count: number) => `顯示你過去 ${count} 次測評中，各維度得分的變化情況`,
      noData: "需要至少 2 次測評記錄才能顯示趨勢圖",
      scoreLabel: "得分",
      scoreUnit: "分",
    },
    "en": {
      title: "Career Anchor Trends",
      description: (count: number) => `Showing score changes across your past ${count} assessments`,
      noData: "At least 2 assessment records required to display trends",
      scoreLabel: "Score",
      scoreUnit: "pts",
    },
  };

  const txt = texts[language];

  if (results.length < 2) {
    return (
      <div className="flex items-center justify-center h-64 bg-card border border-border rounded-sm">
        <p className="text-muted-foreground text-sm">
          {txt.noData}
        </p>
      </div>
    );
  }

  // Sort results chronologically (oldest first for chart display)
  const sortedResults = [...results].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const chartData = sortedResults.map((result) => {
    // DB stores raw scores; convert to standardized 0-100 for display
    const standardized = standardizeScores({
      TF: result.score_tf,
      GM: result.score_gm,
      AU: result.score_au,
      SE: result.score_se,
      EC: result.score_ec,
      SV: result.score_sv,
      CH: result.score_ch,
      LS: result.score_ls,
    });
    return {
      date: formatDate(result.created_at, language),
      fullDate: result.created_at,
      ...standardized,
      riskIndex: result.risk_index,
      mainAnchor: result.main_anchor,
    };
  });

  return (
    <div className="bg-card border border-border rounded-sm p-6">
      <div className="mb-6">
        <h3 className="font-semibold text-foreground mb-2">{txt.title}</h3>
        <p className="text-sm text-muted-foreground">
          {txt.description(results.length)}
        </p>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              strokeOpacity={0.5}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickLine={{ stroke: "hsl(var(--border))" }}
              axisLine={{ stroke: "hsl(var(--border))" }}
              label={{
                value: txt.scoreLabel,
                angle: -90,
                position: "insideLeft",
                fill: "hsl(var(--muted-foreground))",
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "2px",
                fontSize: 12,
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number, name: string) => [
                `${value}${txt.scoreUnit}`,
                getDimensionName(name),
              ]}
            />
            <Legend
              formatter={(value: string) => getDimensionName(value)}
              wrapperStyle={{ fontSize: 12 }}
            />
            {DIMENSION_CODES.map((dim) => {
              const isSelected = selectedDimensions.includes(dim);
              return (
                <Line
                  key={dim}
                  type="monotone"
                  dataKey={dim}
                  stroke={DIMENSION_COLORS[dim] || "#888"}
                  strokeWidth={isSelected ? 2 : 0}
                  opacity={isSelected ? 1 : 0}
                  dot={isSelected ? { fill: DIMENSION_COLORS[dim] || "#888", r: 4 } : false}
                  activeDot={isSelected ? { r: 6 } : false}
                  connectNulls
                  legendType={isSelected ? "line" : "none"}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend explaining colors */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {selectedDimensions.map((dim) => (
            <div key={dim} className="flex items-center gap-2 text-xs">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: DIMENSION_COLORS[dim] }}
              />
              <span className="text-muted-foreground">
                {getDimensionName(dim)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString: string, language: string): string {
  const date = new Date(dateString);
  const locale = language === "en" ? "en-US" : language === "zh-TW" ? "zh-TW" : "zh-CN";
  return date.toLocaleDateString(locale, {
    year: "2-digit",
    month: "short",
  });
}
