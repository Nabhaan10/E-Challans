import { inr, fmtDateTime, labelize } from "@/lib/format";

export type ReceiptData = {
  challan_no: string;
  reg_no: string;
  violation: string;
  legal: string;
  location: string;
  issued_at: string;
  amount: number;
  status: string;
  payment?: { transaction_id: string; method: string; paid_at: string; amount: number } | null;
};

// Browser-only: call from an event handler.
export async function downloadReceipt(d: ReceiptData) {
  const [{ jsPDF }, QR] = await Promise.all([import("jspdf"), import("qrcode")]);
  const verifyUrl = `${window.location.origin}/verify/${d.challan_no}`;
  const qr = await QR.toDataURL(verifyUrl, { margin: 1, width: 240 });
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const rs = (n: number) => inr(n).replace("₹", "Rs. ");
  doc.setFillColor(20, 24, 38);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("e-CHALLAN", 14, 13);
  doc.setFontSize(10);
  doc.text(d.payment ? "Payment Receipt" : "Challan Notice", 14, 21);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  const rows: [string, string][] = [
    ["Challan No", d.challan_no],
    ["Vehicle", d.reg_no],
    ["Violation", d.violation],
    ["Legal basis", d.legal],
    ["Location", d.location],
    ["Issued at", fmtDateTime(d.issued_at)],
    ["Fine amount", rs(d.amount)],
    ["Status", labelize(d.status)],
  ];
  if (d.payment) {
    rows.push(
      ["Transaction ID", d.payment.transaction_id],
      ["Method", d.payment.method],
      ["Paid at", fmtDateTime(d.payment.paid_at)],
      ["Amount paid", rs(d.payment.amount)],
    );
  }
  let y = 42;
  rows.forEach(([k, v]) => {
    doc.setFont("helvetica", "bold");
    doc.text(k, 14, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(v, 100);
    doc.text(lines, 55, y);
    y += 8 * lines.length;
  });
  doc.addImage(qr, "PNG", 160, 40, 36, 36);
  doc.setFontSize(8);
  doc.text("Scan to verify", 166, 80);
  doc.setFontSize(9);
  doc.setTextColor(110, 110, 110);
  doc.text(`Verify online: ${verifyUrl}`, 14, y + 8);
  doc.text("This is a system-generated document. Fine amounts are sample data for demonstration.", 14, y + 14);
  doc.save(`${d.payment ? "receipt" : "challan"}-${d.challan_no}.pdf`);
}
