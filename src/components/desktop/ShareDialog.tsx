import { useState, useCallback } from "react";
import { Download, Share2, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import ShareCard from "@/components/desktop/ShareCard";
import { DIMENSIONS, type AssessmentResult, getHighSensitivityAnchors } from "@/hooks/useAssessment";
import { DIMENSION_NAMES } from "@/data/questions";
import { useTranslation } from "@/hooks/useLanguage";

interface ShareDialogProps {
  results: AssessmentResult;
  trigger?: React.ReactNode;
}

/**
 * Build a fully inline-styled HTML card for reliable image capture.
 * Uses fixed hex colors (no CSS variables) so html2canvas renders
 * identically regardless of browser theme or CSS availability.
 */
function buildShareCardHTML(results: AssessmentResult, language: string): string {
  const getDimName = (dim: string) =>
    DIMENSION_NAMES[dim as keyof typeof DIMENSION_NAMES]?.[language as "zh-CN" | "zh-TW" | "en"] || dim;

  const isEn = language === "en";
  const isTW = language === "zh-TW";

  const labels = {
    reportTitle: isEn ? "Career Anchor Report" : isTW ? "職業錨測評報告" : "职业锚测评报告",
    highSensAnchor: isEn ? "High-Sensitivity Anchor" : isTW ? "高敏感錨" : "高敏感锚",
    noHighSens: isEn ? "No High-Sensitivity Anchor" : isTW ? "無高敏感錨" : "无高敏感锚",
    scoreDistribution: isEn ? "Score Distribution" : isTW ? "維度得分分佈" : "维度得分分布",
    riskIndex: isEn ? "Risk Index" : isTW ? "風險指數" : "风险指数",
    stability: isEn ? "Stability" : isTW ? "穩定度" : "稳定度",
    conflictWarning: isEn ? "Conflict Warning" : isTW ? "衝突錨警示" : "冲突锚警示",
    footer: isEn
      ? "Based on Edgar Schein's Career Anchor Theory"
      : isTW
        ? "基於 Edgar Schein 職業錨理論"
        : "基于 Edgar Schein 职业锚理论",
    mature: isEn ? "Mature" : isTW ? "成熟穩定" : "成熟稳定",
    developing: isEn ? "Developing" : isTW ? "發展中" : "发展中",
    unclear: isEn ? "Unclear" : isTW ? "尚不清晰" : "尚不清晰",
  };

  const highSensAnchors = results.highSensitivityAnchors?.length
    ? results.highSensitivityAnchors
    : getHighSensitivityAnchors(results.scores);
  const hasHighSens = highSensAnchors.length > 0;
  const displayAnchor = highSensAnchors[0] || results.mainAnchor || "";
  const displayAnchorName = getDimName(displayAnchor);
  const displayScore = results.scores[displayAnchor] ?? 0;
  const riskIndex = results.riskIndex ?? 0;

  const riskColor = riskIndex < 40 ? "#166534" : riskIndex < 60 ? "#92400e" : "#dc2626";
  const riskBg = riskIndex < 40 ? "#f0fdf4" : riskIndex < 60 ? "#fffbeb" : "#fef2f2";

  const stabilityText =
    results.stability === "mature"
      ? labels.mature
      : results.stability === "developing"
        ? labels.developing
        : labels.unclear;
  const stabilityColor =
    results.stability === "mature"
      ? "#166534"
      : results.stability === "developing"
        ? "#92400e"
        : "#6b7280";
  const stabilityBg =
    results.stability === "mature"
      ? "#f0fdf4"
      : results.stability === "developing"
        ? "#fffbeb"
        : "#f1f5f9";

  // Sort scores descending
  const sorted = Object.entries(results.scores)
    .map(([key, score]) => ({
      key,
      name: getDimName(key),
      score,
      isHighSens: highSensAnchors.includes(key),
    }))
    .sort((a, b) => b.score - a.score);

  const maxScore = sorted[0]?.score || 1;

  // Score bars (top 5)
  const scoreBarsHTML = sorted
    .slice(0, 5)
    .map(({ name, score, isHighSens }) => {
      const barWidth = Math.min((score / maxScore) * 100, 100);
      const barColor = isHighSens ? "#1C2857" : "rgba(28,40,87,0.18)";
      const textColor = isHighSens ? "#1C2857" : "#6b7280";
      const displayName = isEn ? name.substring(0, 8) : name.substring(0, 4);
      return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;">
        <div style="width:${isEn ? '80' : '64'}px;font-size:12px;color:${textColor};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</div>
        <div style="flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;">
          <div style="height:100%;width:${barWidth}%;background:${barColor};border-radius:99px;"></div>
        </div>
        <div style="width:40px;text-align:right;font-size:12px;font-weight:500;color:${textColor};font-variant-numeric:tabular-nums;">${score}</div>
      </div>`;
    })
    .join("");

  // Conflict anchors
  let conflictHTML = "";
  if (results.conflictAnchors && results.conflictAnchors.length > 0) {
    const conflictItems = results.conflictAnchors
      .map(
        ([anchor1, anchor2]) => `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="padding:2px 8px;background:rgba(220,38,38,0.1);color:#dc2626;font-size:12px;border-radius:2px;font-weight:500;">${getDimName(anchor1)}</span>
        <span style="font-size:12px;color:#dc2626;">&#9889;</span>
        <span style="padding:2px 8px;background:rgba(220,38,38,0.1);color:#dc2626;font-size:12px;border-radius:2px;font-weight:500;">${getDimName(anchor2)}</span>
      </div>`
      )
      .join("");

    conflictHTML = `<div style="padding:12px;background:rgba(220,38,38,0.04);border:1px solid rgba(220,38,38,0.15);border-radius:4px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:13px;">&#9888;</span>
        <span style="font-size:12px;font-weight:500;color:#dc2626;">${labels.conflictWarning}</span>
      </div>
      ${conflictItems}
    </div>`;
  }

  return `<div style="width:400px;background:#ffffff;padding:24px;border-radius:6px;border:1px solid #e2e8f0;font-family:'Inter','Noto Sans SC','PingFang SC','Microsoft YaHei',system-ui,sans-serif;color:#1C2857;box-sizing:border-box;line-height:1.5;">
    <div style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
        <div style="font-size:11px;font-weight:500;letter-spacing:0.06em;color:#94a3b8;text-transform:uppercase;">Career Anchor Report</div>
        <div style="font-size:11px;color:#94a3b8;">SCPC Assessment</div>
      </div>
      <div style="font-size:18px;font-weight:600;color:#1C2857;margin:0;">${labels.reportTitle}</div>
    </div>
    <div style="background:#1C2857;color:#ffffff;padding:16px;border-radius:4px;margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <div style="width:16px;height:16px;border:2px solid rgba(255,255,255,0.6);border-radius:50%;"></div>
        <span style="font-size:11px;font-weight:500;opacity:0.75;">${hasHighSens ? labels.highSensAnchor : labels.noHighSens}</span>
      </div>
      <div style="display:flex;align-items:flex-end;justify-content:space-between;">
        <span style="font-size:16px;font-weight:600;">${hasHighSens ? displayAnchorName : (isEn ? 'Structural combination' : isTW ? '結構性組合' : '結構性組合')}</span>
        ${hasHighSens ? `<span style="font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;">${displayScore}</span>` : ''}
      </div>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:500;color:#94a3b8;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.04em;">${labels.scoreDistribution}</div>
      ${scoreBarsHTML}
    </div>
    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <div style="flex:1;padding:12px;background:${riskBg};border-radius:4px;">
        <div style="font-size:11px;color:${riskColor};margin-bottom:4px;">${labels.riskIndex}</div>
        <div style="font-size:18px;font-weight:700;color:${riskColor};font-variant-numeric:tabular-nums;">${riskIndex}<span style="font-size:11px;font-weight:400;color:#94a3b8;">/100</span></div>
      </div>
      <div style="flex:1;padding:12px;background:${stabilityBg};border-radius:4px;">
        <div style="font-size:11px;color:${stabilityColor};margin-bottom:4px;">${labels.stability}</div>
        <div style="font-size:14px;font-weight:600;color:${stabilityColor};">${stabilityText}</div>
      </div>
    </div>
    ${conflictHTML}
    <div style="padding-top:16px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
      <div style="font-size:11px;color:#94a3b8;">${labels.footer}</div>
      <div style="font-size:11px;font-weight:600;color:#1C2857;">scpc.ai</div>
    </div>
  </div>`;
}

export default function ShareDialog({ results, trigger }: ShareDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { language } = useTranslation();

  const txt = {
    "zh-CN": {
      genError: "图片生成失败，请重试",
      downloaded: "报告卡片已下载",
      copied: "图片已复制到剪贴板",
      copyFail: "复制失败，请尝试下载图片",
      noShare: "当前浏览器不支持分享功能，请复制图片手动分享",
      shareOk: "分享成功",
      shareFail: "分享失败，请尝试复制图片",
      shareTitle: "我的职业锚测评报告",
      shareText: "来看看我的职业锚测评结果吧！",
      reportFile: "职业锚测评报告-摘要",
      dialogTitle: "分享测评摘要卡片",
      dialogDesc: "生成简化版分享卡片，包含高敏感锚、得分分布和风险指标。如需完整报告，请使用「导出报告」功能。",
      download: "下载",
      copy: "复制",
      copiedBtn: "已复制",
      share: "分享",
      tip: "提示：可将图片保存后分享到社交媒体",
      defaultShare: "分享报告",
    },
    "zh-TW": {
      genError: "圖片生成失敗，請重試",
      downloaded: "報告卡片已下載",
      copied: "圖片已複製到剪貼板",
      copyFail: "複製失敗，請嘗試下載圖片",
      noShare: "當前瀏覽器不支援分享功能，請複製圖片手動分享",
      shareOk: "分享成功",
      shareFail: "分享失敗，請嘗試複製圖片",
      shareTitle: "我的職業錨測評報告",
      shareText: "來看看我的職業錨測評結果吧！",
      reportFile: "職業錨測評報告-摘要",
      dialogTitle: "分享測評摘要卡片",
      dialogDesc: "生成簡化版分享卡片，包含高敏感錨、得分分佈和風險指標。如需完整報告，請使用「匯出報告」功能。",
      download: "下載",
      copy: "複製",
      copiedBtn: "已複製",
      share: "分享",
      tip: "提示：可將圖片儲存後分享到社交媒體",
      defaultShare: "分享報告",
    },
    "en": {
      genError: "Failed to generate image, please retry",
      downloaded: "Report card downloaded",
      copied: "Image copied to clipboard",
      copyFail: "Copy failed, try downloading instead",
      noShare: "Browser doesn't support sharing, please copy the image manually",
      shareOk: "Shared successfully",
      shareFail: "Share failed, try copying the image",
      shareTitle: "My Career Anchor Report",
      shareText: "Check out my Career Anchor assessment results!",
      reportFile: "Career-Anchor-Summary",
      dialogTitle: "Share Summary Card",
      dialogDesc: "Generate a simplified share card with key results. For the full report, use the Export function.",
      download: "Download",
      copy: "Copy",
      copiedBtn: "Copied",
      share: "Share",
      tip: "Tip: Save the image and share to social media",
      defaultShare: "Share Report",
    },
  }[language];

  const generateImage = useCallback(async (): Promise<string | null> => {
    try {
      setIsGenerating(true);

      // Render an inline-styled card off-screen for reliable capture
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;pointer-events:none;";
      wrapper.innerHTML = buildShareCardHTML(results, language);
      document.body.appendChild(wrapper);

      const target = wrapper.firstElementChild as HTMLElement;

      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(target, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        logging: false,
      });

      document.body.removeChild(wrapper);
      return canvas.toDataURL("image/png", 1.0);
    } catch (error) {
      console.error("Failed to generate share card image:", error);
      toast.error(txt.genError);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [results, language]);

  const handleDownload = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = `${txt.reportFile}-${new Date().toISOString().split("T")[0]}.png`;
    link.href = dataUrl;
    link.click();

    toast.success(txt.downloaded);
  }, [generateImage]);

  const handleCopyImage = useCallback(async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);

      setIsCopied(true);
      toast.success(txt.copied);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy image:", error);
      toast.error(txt.copyFail);
    }
  }, [generateImage]);

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) {
      toast.error(txt.noShare);
      return;
    }

    const dataUrl = await generateImage();
    if (!dataUrl) return;

    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      const file = new File([blob], `${txt.reportFile}.png`, {
        type: "image/png",
      });

      await navigator.share({
        title: txt.shareTitle,
        text: txt.shareText,
        files: [file],
      });

      toast.success(txt.shareOk);
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        console.error("Share failed:", error);
        toast.error(txt.shareFail);
      }
    }
  }, [generateImage]);

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Share2 className="w-4 h-4" />
      {txt.defaultShare}
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{txt.dialogTitle}</DialogTitle>
          <DialogDescription>{txt.dialogDesc}</DialogDescription>
        </DialogHeader>

        {/* Preview Card (themed component for dialog display) */}
        <div className="relative rounded-sm border border-border bg-muted/20 p-4 overflow-hidden">
          <div className="flex justify-center">
            <div className="origin-top" style={{ transform: "scale(0.85)" }}>
              <ShareCard results={results} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{txt.download}</span>
          </Button>

          <Button
            variant="outline"
            className="gap-2"
            onClick={handleCopyImage}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isCopied ? (
              <Check className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {isCopied ? txt.copiedBtn : txt.copy}
            </span>
          </Button>

          <Button
            variant="default"
            className="gap-2"
            onClick={handleNativeShare}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Share2 className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{txt.share}</span>
          </Button>
        </div>

        {/* Tips */}
        <div className="text-xs text-muted-foreground text-center pt-2">
          {txt.tip}
        </div>
      </DialogContent>
    </Dialog>
  );
}
