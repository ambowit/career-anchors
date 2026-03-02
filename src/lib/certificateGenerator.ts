import QRCode from "qrcode";

interface CertificateData {
  holderName: string;
  certificationNumber: string;
  certificationType: string;
  issueDate: string;
  expiryDate: string;
  renewalCycleYears: number;
}

const DEEP_BLUE = { r: 28, g: 40, b: 87 };
const ACCENT_GREEN = { r: 181, g: 210, b: 96 };
const GOLD = { r: 198, g: 168, b: 102 };
const LIGHT_GOLD = { r: 232, g: 218, b: 178 };

function formatCertDate(dateString: string): string {
  const date = new Date(dateString);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function getCertificationTypeLabel(certType: string): string {
  const labels: Record<string, string> = {
    scpc_professional: "SCPC Certified Professional",
    scpc_senior: "SCPC Senior Certified Professional",
    scpc_master: "SCPC Master Certified Professional",
  };
  return labels[certType] || certType;
}

function drawDecorativeBorder(pdf: any, pageWidth: number, pageHeight: number) {
  // Outer border - deep blue
  pdf.setDrawColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);
  pdf.setLineWidth(2.5);
  pdf.rect(10, 8, pageWidth - 20, pageHeight - 16);

  // Second border line
  pdf.setLineWidth(0.5);
  pdf.rect(14, 12, pageWidth - 28, pageHeight - 24);

  // Inner decorative border - gold
  pdf.setDrawColor(GOLD.r, GOLD.g, GOLD.b);
  pdf.setLineWidth(1.2);
  pdf.rect(18, 16, pageWidth - 36, pageHeight - 32);

  // Corner ornaments (small squares at each corner)
  const cornerSize = 6;
  const cornerInset = 15;
  pdf.setFillColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);

  // Top-left
  pdf.rect(cornerInset - 1, cornerInset - 3, cornerSize, 1.5, "F");
  pdf.rect(cornerInset - 1, cornerInset - 3, 1.5, cornerSize, "F");

  // Top-right
  pdf.rect(pageWidth - cornerInset - cornerSize + 1, cornerInset - 3, cornerSize, 1.5, "F");
  pdf.rect(pageWidth - cornerInset - 0.5, cornerInset - 3, 1.5, cornerSize, "F");

  // Bottom-left
  pdf.rect(cornerInset - 1, pageHeight - cornerInset - 3 + 4, cornerSize, 1.5, "F");
  pdf.rect(cornerInset - 1, pageHeight - cornerInset - cornerSize + 1, 1.5, cornerSize, "F");

  // Bottom-right
  pdf.rect(pageWidth - cornerInset - cornerSize + 1, pageHeight - cornerInset - 3 + 4, cornerSize, 1.5, "F");
  pdf.rect(pageWidth - cornerInset - 0.5, pageHeight - cornerInset - cornerSize + 1, 1.5, cornerSize, "F");
}

function drawGreenAccentLine(pdf: any, centerX: number, yPosition: number, lineWidth: number) {
  pdf.setDrawColor(ACCENT_GREEN.r, ACCENT_GREEN.g, ACCENT_GREEN.b);
  pdf.setLineWidth(1.5);
  pdf.line(centerX - lineWidth / 2, yPosition, centerX + lineWidth / 2, yPosition);

  // Small decorative dots at ends
  pdf.setFillColor(ACCENT_GREEN.r, ACCENT_GREEN.g, ACCENT_GREEN.b);
  pdf.circle(centerX - lineWidth / 2 - 2, yPosition, 1, "F");
  pdf.circle(centerX + lineWidth / 2 + 2, yPosition, 1, "F");
}

function drawSignatureLine(pdf: any, xCenter: number, yPosition: number, labelText: string) {
  const lineHalfWidth = 35;
  pdf.setDrawColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);
  pdf.setLineWidth(0.4);
  pdf.line(xCenter - lineHalfWidth, yPosition, xCenter + lineHalfWidth, yPosition);

  pdf.setFontSize(7.5);
  pdf.setTextColor(120, 120, 130);
  pdf.text(labelText, xCenter, yPosition + 5, { align: "center" });
}

export async function generateCertificatePdf(data: CertificateData): Promise<void> {
  const { default: jsPDF } = await import("jspdf");
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const centerX = pageWidth / 2;

  // Background - subtle warm ivory tone
  pdf.setFillColor(252, 250, 245);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  // Draw decorative borders
  drawDecorativeBorder(pdf, pageWidth, pageHeight);

  // ===== SCPC Logo / Organization Name =====
  let currentY = 34;

  pdf.setFontSize(11);
  pdf.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  pdf.setFont("helvetica", "bold");
  pdf.text("SCPC", centerX, currentY, { align: "center" });

  currentY += 6;
  pdf.setFontSize(7);
  pdf.setTextColor(130, 130, 140);
  pdf.setFont("helvetica", "normal");
  pdf.text("Schein Career & Professional Certification", centerX, currentY, { align: "center" });

  // ===== Decorative line under logo =====
  currentY += 7;
  drawGreenAccentLine(pdf, centerX, currentY, 60);

  // ===== Certificate Title =====
  currentY += 12;
  pdf.setFontSize(26);
  pdf.setTextColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);
  pdf.setFont("helvetica", "bold");
  pdf.text("CERTIFICATE", centerX, currentY, { align: "center" });

  currentY += 9;
  pdf.setFontSize(11);
  pdf.setTextColor(GOLD.r, GOLD.g, GOLD.b);
  pdf.setFont("helvetica", "normal");
  pdf.text("OF PROFESSIONAL CERTIFICATION", centerX, currentY, { align: "center" });

  // ===== "This is to certify that" text =====
  currentY += 14;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 110);
  pdf.setFont("helvetica", "italic");
  pdf.text("This is to certify that", centerX, currentY, { align: "center" });

  // ===== Holder Name (prominent) =====
  currentY += 14;
  pdf.setFontSize(24);
  pdf.setTextColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.holderName, centerX, currentY, { align: "center" });

  // Underline for name
  const nameWidth = pdf.getTextWidth(data.holderName);
  const nameLineHalf = Math.max(nameWidth / 2 + 10, 40);
  currentY += 3;
  pdf.setDrawColor(LIGHT_GOLD.r, LIGHT_GOLD.g, LIGHT_GOLD.b);
  pdf.setLineWidth(0.6);
  pdf.line(centerX - nameLineHalf, currentY, centerX + nameLineHalf, currentY);

  // ===== Certification type description =====
  currentY += 11;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 110);
  pdf.setFont("helvetica", "italic");
  pdf.text("has been awarded the professional qualification of", centerX, currentY, { align: "center" });

  currentY += 9;
  pdf.setFontSize(14);
  pdf.setTextColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);
  pdf.setFont("helvetica", "bold");
  pdf.text(getCertificationTypeLabel(data.certificationType), centerX, currentY, { align: "center" });

  // ===== Decorative separator =====
  currentY += 9;
  drawGreenAccentLine(pdf, centerX, currentY, 40);

  // ===== Dates and Certificate Number =====
  currentY += 10;
  pdf.setFontSize(8.5);
  pdf.setTextColor(80, 80, 90);
  pdf.setFont("helvetica", "normal");

  const issueLabel = `Issued: ${formatCertDate(data.issueDate)}`;
  const expiryLabel = `Valid Until: ${formatCertDate(data.expiryDate)}`;
  const cycleLabel = `Renewal Cycle: ${data.renewalCycleYears} Years`;

  pdf.text(issueLabel, centerX - 55, currentY, { align: "center" });
  pdf.text(expiryLabel, centerX + 55, currentY, { align: "center" });

  currentY += 5;
  pdf.text(cycleLabel, centerX, currentY, { align: "center" });

  // ===== Signature Lines =====
  currentY += 16;
  drawSignatureLine(pdf, centerX - 65, currentY, "Program Director");
  drawSignatureLine(pdf, centerX + 65, currentY, "Certification Board Chair");

  // ===== Certificate Number (bottom) =====
  const bottomTextY = pageHeight - 26;
  pdf.setFontSize(7.5);
  pdf.setTextColor(140, 140, 150);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Certificate No. ${data.certificationNumber}`, 30, bottomTextY, { align: "left" });

  pdf.setFontSize(6.5);
  pdf.text("Verify this certificate at:", 30, bottomTextY + 4.5);
  const verifyUrl = `${window.location.origin}/verify-certificate?cert=${encodeURIComponent(data.certificationNumber)}`;
  pdf.setTextColor(DEEP_BLUE.r, DEEP_BLUE.g, DEEP_BLUE.b);
  pdf.textWithLink(verifyUrl, 30, bottomTextY + 9, { url: verifyUrl });

  // ===== QR Code (bottom right) =====
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 200,
    margin: 1,
    color: {
      dark: `#${DEEP_BLUE.r.toString(16).padStart(2, "0")}${DEEP_BLUE.g.toString(16).padStart(2, "0")}${DEEP_BLUE.b.toString(16).padStart(2, "0")}`,
      light: "#FCFAF5",
    },
  });

  const qrSize = 24;
  const qrXPosition = pageWidth - 30 - qrSize;
  const qrYPosition = pageHeight - 26 - qrSize / 2;
  pdf.addImage(qrDataUrl, "PNG", qrXPosition, qrYPosition, qrSize, qrSize);

  // Small label under QR
  pdf.setFontSize(5.5);
  pdf.setTextColor(140, 140, 150);
  pdf.setFont("helvetica", "normal");
  pdf.text("Scan to verify", qrXPosition + qrSize / 2, qrYPosition + qrSize + 3.5, { align: "center" });

  // ===== Download =====
  pdf.save(`SCPC-Certificate-${data.certificationNumber}.pdf`);
}
