import { useState, useMemo, useEffect } from "react";
import { FileSpreadsheet, Download, Filter, Eye, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useLanguage";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

interface GcqaCertification {
  id: string;
  user_id: string;
  certification_number: string;
  certification_type: string;
  cert_code: string;
  issue_date: string;
  expiry_date: string;
  recertification_date: string | null;
  first_name_en: string;
  last_name_en: string;
  certification_status: string;
  organization_id: string;
}

interface GcqaExportRow {
  certificate_id: string;
  name: string;
  first_name: string;
  last_name: string;
  recertification_date: string;
  expired_date: string;
}

export default function GcqaExportPage() {
  const { language } = useTranslation();
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(new Date().toISOString().split("T")[0]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [certifications, setCertifications] = useState<GcqaCertification[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { full_name: string; first_name_en: string; last_name_en: string }>>({});
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const txt = {
    title: language === "en" ? "GCQA Data Export" : language === "zh-TW" ? "GCQA 資料匯出" : "GCQA 资料导出",
    subtitle: language === "en" ? "Export certification data in GCQA standard format" : language === "zh-TW" ? "以 GCQA 標準格式匯出認證資料" : "以 GCQA 标准格式导出认证数据",
    dateFrom: language === "en" ? "From" : language === "zh-TW" ? "起始日期" : "起始日期",
    dateTo: language === "en" ? "To" : language === "zh-TW" ? "結束日期" : "结束日期",
    certType: language === "en" ? "Certificate Type" : language === "zh-TW" ? "證照類型" : "证照类型",
    all: language === "en" ? "All Types" : language === "zh-TW" ? "全部類型" : "全部类型",
    preview: language === "en" ? "Preview" : language === "zh-TW" ? "預覽" : "预览",
    exportCsv: language === "en" ? "Export CSV" : language === "zh-TW" ? "匯出 CSV" : "导出 CSV",
    totalRecords: language === "en" ? "Total Records" : language === "zh-TW" ? "總筆數" : "总记录数",
    noData: language === "en" ? "No certifications match the criteria" : language === "zh-TW" ? "無符合條件的認證資料" : "无符合条件的认证数据",
    exportSuccess: language === "en" ? "CSV exported successfully" : language === "zh-TW" ? "CSV 匯出成功" : "CSV 导出成功",
    certId: "CERTIFICATE ID",
    colName: "NAME",
    colFirstName: "FIRST NAME",
    colLastName: "LAST NAME",
    colRecertDate: "RECERTIFICATION DATE",
    colExpiredDate: "EXPIRED DATE",
  };

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("certifications")
      .select("id, user_id, certification_number, certification_type, cert_code, issue_date, expiry_date, recertification_date, first_name_en, last_name_en, certification_status, organization_id")
      .gte("issue_date", dateFrom)
      .lte("issue_date", dateTo)
      .in("certification_status", ["active", "pending_renewal", "expired"]);

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    setCertifications((data || []) as GcqaCertification[]);

    // Fetch profiles for names
    const userIds = [...new Set((data || []).map(c => c.user_id))];
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, first_name_en, last_name_en")
        .in("id", userIds);

      const map: Record<string, { full_name: string; first_name_en: string; last_name_en: string }> = {};
      (profiles || []).forEach((p: { id: string; full_name: string; first_name_en: string; last_name_en: string }) => {
        map[p.id] = p;
      });
      setProfileMap(map);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered data
  const filteredCerts = useMemo(() => {
    return certifications.filter(cert => {
      if (typeFilter !== "all" && cert.certification_type !== typeFilter) return false;
      return true;
    });
  }, [certifications, typeFilter]);

  // Build export rows
  const exportRows: GcqaExportRow[] = useMemo(() => {
    return filteredCerts.map(cert => {
      const profile = profileMap[cert.user_id];
      const firstName = cert.first_name_en || profile?.first_name_en || "";
      const lastName = cert.last_name_en || profile?.last_name_en || "";
      const fullName = `${firstName} ${lastName}`.trim() || profile?.full_name || "";

      // RECERTIFICATION DATE = original issue_date (not expiry_date)
      const recertDate = cert.recertification_date || cert.issue_date;

      return {
        certificate_id: cert.certification_number,
        name: fullName,
        first_name: firstName,
        last_name: lastName,
        recertification_date: recertDate,
        expired_date: cert.expiry_date,
      };
    });
  }, [filteredCerts, profileMap]);

  // Export to CSV
  const handleExport = () => {
    if (exportRows.length === 0) return;
    setExporting(true);

    const headers = ["CERTIFICATE ID", "NAME", "FIRST NAME", "LAST NAME", "RECERTIFICATION DATE", "EXPIRED DATE"];
    const csvRows = [headers.join(",")];

    exportRows.forEach(row => {
      csvRows.push([
        `"${row.certificate_id}"`,
        `"${row.name}"`,
        `"${row.first_name}"`,
        `"${row.last_name}"`,
        `"${row.recertification_date}"`,
        `"${row.expired_date}"`,
      ].join(","));
    });

    // UTF-8 BOM for Excel compatibility
    const bom = "\uFEFF";
    const csvContent = bom + csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `GCQA_Export_${dateFrom}_${dateTo}.csv`);
    link.click();
    URL.revokeObjectURL(url);

    toast.success(txt.exportSuccess);
    setExporting(false);
  };

  const certTypes = [...new Set(certifications.map(c => c.certification_type))].sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-primary" />
          {txt.title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{txt.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 p-4 bg-card border border-border rounded-lg">
        <div>
          <label className="text-xs font-medium text-muted-foreground">{txt.dateFrom}</label>
          <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="mt-1 w-40" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{txt.dateTo}</label>
          <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="mt-1 w-40" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">{txt.certType}</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="mt-1 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{txt.all}</SelectItem>
              {certTypes.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchData} variant="outline" className="gap-1" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          {txt.preview}
        </Button>
        <Button onClick={handleExport} disabled={exportRows.length === 0 || exporting} className="gap-1">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {txt.exportCsv}
        </Button>
        <div className="ml-auto text-sm text-muted-foreground">
          {txt.totalRecords}: <strong className="text-foreground">{exportRows.length}</strong>
        </div>
      </div>

      {/* Preview Table */}
      <div className="border border-border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-mono text-xs">{txt.certId}</TableHead>
              <TableHead className="font-mono text-xs">{txt.colName}</TableHead>
              <TableHead className="font-mono text-xs">{txt.colFirstName}</TableHead>
              <TableHead className="font-mono text-xs">{txt.colLastName}</TableHead>
              <TableHead className="font-mono text-xs">{txt.colRecertDate}</TableHead>
              <TableHead className="font-mono text-xs">{txt.colExpiredDate}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : exportRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  {txt.noData}
                </TableCell>
              </TableRow>
            ) : (
              exportRows.map((row, index) => (
                <TableRow key={index} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm font-medium">{row.certificate_id}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.first_name || "—"}</TableCell>
                  <TableCell>{row.last_name || "—"}</TableCell>
                  <TableCell className="font-mono text-sm">{row.recertification_date}</TableCell>
                  <TableCell className="font-mono text-sm">{row.expired_date}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
