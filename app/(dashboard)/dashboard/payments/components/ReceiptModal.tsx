"use client";

import { useRef } from "react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Payment = {
  id:            string;
  receiptNumber: string;
  amountPaid:    number;
  currency:      string;
  paidAt:        string;
  note?:         string | null;
  school:        { name: string };
  term:          { name: string };
};

const fmt = (n: number, cur = "UGX") => `${cur} ${n.toLocaleString("en-UG")}`;

export default function ReceiptModal({
  payment, open, onClose,
}: { payment: Payment | null; open: boolean; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  function handlePrint() {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank", "width=600,height=800");
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><title>Receipt ${payment?.receiptNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #1e3a6e; padding-bottom: 16px; margin-bottom: 24px; }
        .logo { font-size: 22px; font-weight: 900; color: #1e3a6e; }
        .logo span { color: #e8a020; }
        .receipt-no { font-size: 13px; color: #64748b; margin-top: 4px; }
        .amount-box { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
        .amount { font-size: 28px; font-weight: 900; color: #1e3a6e; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        td:first-child { color: #64748b; width: 40%; }
        td:last-child { font-weight: 600; }
        .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        @media print { body { padding: 20px; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.onload = () => { win.focus(); win.print(); };
  }

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div ref={printRef}>
          <div className="header text-center border-b-2 pb-4 mb-5" style={{ borderColor: "#1e3a6e" }}>
            <div className="text-xl font-black" style={{ color: "#1e3a6e" }}>
              SKOLA<span style={{ color: "#e8a020" }}>STIK</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">School Solutions — Official Receipt</div>
            <div className="text-sm font-semibold text-slate-600 mt-2">{payment.receiptNumber}</div>
          </div>

          <div className="rounded-xl p-4 text-center mb-5" style={{ background: "#f0f9ff", border: "1px solid #bae6fd" }}>
            <div className="text-xs text-slate-500 mb-1">Amount Paid</div>
            <div className="text-3xl font-black" style={{ color: "#1e3a6e" }}>
              {fmt(payment.amountPaid, payment.currency)}
            </div>
          </div>

          <table className="w-full text-sm">
            <tbody>
              {[
                ["School",    payment.school.name],
                ["Term",      payment.term.name],
                ["Date",      new Date(payment.paidAt).toLocaleDateString("en-UG", { day: "2-digit", month: "long", year: "numeric" })],
                ["Receipt #", payment.receiptNumber],
                ...(payment.note ? [["Note", payment.note]] : []),
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-slate-100">
                  <td className="py-2 text-slate-500 w-1/3">{label}</td>
                  <td className="py-2 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
            This receipt is computer-generated and valid without a signature.
          </div>
        </div>

        <div className="flex gap-2 mt-4 print:hidden">
          <Button variant="outline" className="flex-1" onClick={onClose}><X className="h-4 w-4 mr-1.5" />Close</Button>
          <Button className="flex-1" onClick={handlePrint}><Printer className="h-4 w-4 mr-1.5" />Print</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
