// components/fees/ReceiptPDF.tsx
// npm install @react-pdf/renderer
"use client";

import {
  Document, Page, Text, View, StyleSheet, BlobProvider, PDFDownloadLink, Image,
} from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Printer, Download, Loader2 } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReceiptData = {
  receiptNumber:       string;
  studentName:         string;
  admissionNo:         string;
  studentClass?:       string;
  invoiceNo?:          string;
  amount:              number;
  paymentMethod:       string;
  mobileMoneyNetwork?: string;
  mobileMoneyPhone?:   string;
  referenceNumber?:    string;
  description?:        string;
  processedAt:         string; // ISO
  isVoid?:             boolean;
};

export type SchoolInfo = {
  name:          string;
  address?:      string;
  contact?:      string;
  email?:        string;
  logo?:         string;
  primaryColor?: string;
  accentColor?:  string;
};

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(primary: string, accent: string) {
  return StyleSheet.create({
    page: {
      fontFamily:        "Helvetica",
      fontSize:          10,
      color:             "#1e293b",
      backgroundColor:   "#ffffff",
      paddingTop:        32,
      paddingBottom:     40,
      paddingHorizontal: 36,
    },
    watermark: {
      position:   "absolute",
      top:        "38%",
      left:       "15%",
      fontSize:   80,
      fontFamily: "Helvetica-Bold",
      color:      "#dc2626",
      opacity:    0.07,
    },
    header: {
      flexDirection:     "row",
      justifyContent:    "space-between",
      alignItems:        "flex-start",
      paddingBottom:     14,
      marginBottom:      16,
      borderBottomWidth: 2,
      borderBottomColor: primary,
    },
    schoolName: {
      fontSize:     15,
      fontFamily:   "Helvetica-Bold",
      color:        "#1e293b",
      marginBottom: 3,
    },
    schoolMeta: {
      fontSize:   8,
      color:      "#64748b",
      lineHeight: 1.6,
    },
    badge: {
      backgroundColor:   primary,
      borderRadius:      4,
      paddingVertical:   6,
      paddingHorizontal: 12,
      alignItems:        "center",
      justifyContent:    "center",
    },
    badgeLabel: {
      fontSize:      7.5,
      fontFamily:    "Helvetica-Bold",
      color:         "#ffffff",
      letterSpacing: 1.8,
    },
    badgeNumber: {
      fontSize:   11,
      fontFamily: "Helvetica-Bold",
      color:      "#ffffff",
      marginTop:  3,
    },
    amountBox: {
      flexDirection:   "row",
      justifyContent:  "space-between",
      alignItems:      "center",
      backgroundColor: `${primary}18`,
      borderWidth:     1,
      borderColor:     `${primary}55`,
      borderRadius:    6,
      padding:         14,
      marginBottom:    18,
    },
    amountLabel: {
      fontSize:   10,
      fontFamily: "Helvetica-Bold",
      color:      primary,
    },
    amountValue: {
      fontSize:   20,
      fontFamily: "Helvetica-Bold",
      color:      primary,
    },
    sectionTitle: {
      fontSize:          7.5,
      fontFamily:        "Helvetica-Bold",
      color:             primary,
      letterSpacing:     1.2,
      marginBottom:      6,
      paddingBottom:     4,
      borderBottomWidth: 0.5,
      borderBottomColor: "#e2e8f0",
    },
    row: {
      flexDirection:     "row",
      justifyContent:    "space-between",
      paddingVertical:   4,
      borderBottomWidth: 0.5,
      borderBottomColor: "#f1f5f9",
    },
    rowLabel: {
      fontSize: 8.5,
      color:    "#64748b",
      flex:     1,
    },
    rowValue: {
      fontSize:   8.5,
      fontFamily: "Helvetica-Bold",
      color:      "#1e293b",
      flex:       2,
      textAlign:  "right",
    },
    spacer: { marginBottom: 14 },
    footer: {
      marginTop:      28,
      paddingTop:     10,
      borderTopWidth: 1,
      borderTopColor: "#e2e8f0",
      flexDirection:  "row",
      justifyContent: "space-between",
      alignItems:     "flex-end",
    },
    footerNote: {
      fontSize:   7,
      color:      "#94a3b8",
      lineHeight: 1.6,
      maxWidth:   "60%",
    },
    circle: {
      width:          64,
      height:         64,
      borderRadius:   32,
      borderWidth:    2,
      borderColor:    primary,
      alignItems:     "center",
      justifyContent: "center",
      opacity:        0.3,
    },
    circleText: {
      fontSize:   8,
      fontFamily: "Helvetica-Bold",
      color:      primary,
      textAlign:  "center",
      lineHeight: 1.5,
    },
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtUGX = (n: number) =>
  `UGX ${n.toLocaleString("en-UG")}`;

const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-UG", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtMethod = (method: string, network?: string) => {
  if (method === "MOBILE_MONEY" && network) return `${network} Mobile Money`;
  return ({
    CASH:          "Cash",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE:        "Cheque",
    POS:           "POS / Card",
    ONLINE:        "Online Payment",
  } as Record<string, string>)[method] ?? method;
};

// ─── PDF document ──────────────────────────────────────────────────────────────

function ReceiptDocument({
  receipt,
  school,
}: {
  receipt: ReceiptData;
  school:  SchoolInfo;
}) {
  const primary = school.primaryColor ?? "#1e3a6b";
  const accent  = school.accentColor  ?? "#c8a400";
  const S = makeStyles(primary, accent);
  const studentRows: [string, string][] = [
    ["Student Name",  receipt.studentName],
    ["Admission No.", receipt.admissionNo],
    ...(receipt.studentClass ? [["Class / Stream", receipt.studentClass] as [string, string]] : []),
    ...(receipt.invoiceNo    ? [["Invoice No.",    receipt.invoiceNo]    as [string, string]] : []),
  ];

  const paymentRows: [string, string][] = [
    ["Payment Method", fmtMethod(receipt.paymentMethod, receipt.mobileMoneyNetwork)],
    ...(receipt.mobileMoneyPhone ? [["Phone Number",   receipt.mobileMoneyPhone]  as [string, string]] : []),
    ...(receipt.referenceNumber  ? [["Transaction Ref",receipt.referenceNumber]   as [string, string]] : []),
    ...(receipt.description      ? [["Description",    receipt.description]        as [string, string]] : []),
    ["Date & Time", fmtDateTime(receipt.processedAt)],
  ];

  return (
    <Document
      title={`Receipt ${receipt.receiptNumber}`}
      author={school.name}
      subject="Fee Payment Receipt"
    >
      <Page size="A5" style={S.page}>

        {/* Void watermark */}
        {receipt.isVoid && <Text style={S.watermark}>VOID</Text>}

        {/* Header */}
        <View style={S.header}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", flex: 1, gap: 10 }}>
            {school.logo && (
              <Image
                src={school.logo}
                style={{ width: 44, height: 44, objectFit: "contain" }}
              />
            )}
            <View style={{ flex: 1 }}>
              <Text style={S.schoolName}>{school.name}</Text>
              {school.address && <Text style={S.schoolMeta}>{school.address}</Text>}
              {school.contact && <Text style={S.schoolMeta}>Tel: {school.contact}</Text>}
              {school.email   && <Text style={S.schoolMeta}>{school.email}</Text>}
            </View>
          </View>
          <View style={S.badge}>
            <Text style={S.badgeLabel}>RECEIPT</Text>
            <Text style={S.badgeNumber}>{receipt.receiptNumber}</Text>
          </View>
        </View>

        {/* Amount hero */}
        <View style={S.amountBox}>
          <Text style={S.amountLabel}>Amount Paid</Text>
          <Text style={S.amountValue}>{fmtUGX(receipt.amount)}</Text>
        </View>

        {/* Student details */}
        <Text style={S.sectionTitle}>STUDENT DETAILS</Text>
        {studentRows.map(([label, value]) => (
          <View key={label} style={S.row}>
            <Text style={S.rowLabel}>{label}</Text>
            <Text style={S.rowValue}>{value}</Text>
          </View>
        ))}

        <View style={S.spacer} />

        {/* Payment details */}
        <Text style={S.sectionTitle}>PAYMENT DETAILS</Text>
        {paymentRows.map(([label, value]) => (
          <View key={label} style={S.row}>
            <Text style={S.rowLabel}>{label}</Text>
            <Text style={S.rowValue}>{value}</Text>
          </View>
        ))}

        {/* Footer */}
        <View style={S.footer}>
          <Text style={S.footerNote}>
            This receipt is computer-generated and valid without a signature.
          </Text>
          <View style={S.circle}>
            <Text style={S.circleText}>
              {receipt.isVoid ? "VOID" : "PAID"}{"\n"}
              {new Date(receipt.processedAt).toLocaleDateString("en-UG", {
                day: "2-digit", month: "short",
              })}
            </Text>
          </View>
        </View>

      </Page>
    </Document>
  );
}

// ─── Print button (blob → new tab → auto print dialog) ───────────────────────

export function ReceiptPrintButton({
  receipt,
  school,
  variant = "outline",
}: {
  receipt:  ReceiptData;
  school:   SchoolInfo;
  variant?: "outline" | "ghost";
}) {
  return (
    <BlobProvider document={<ReceiptDocument receipt={receipt} school={school} />}>
      {({ url, loading }) => (
        <Button
          size="sm"
          variant={variant}
          disabled={loading || !url}
          onClick={() => {
            if (!url) return;
            const win = window.open(url, "_blank");
            if (win) win.onload = () => win.print();
          }}
          className="gap-1.5 h-7 px-2.5 text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Printer className="w-3 h-3" />}
          {loading ? "…" : "Print"}
        </Button>
      )}
    </BlobProvider>
  );
}

// ─── Download button ──────────────────────────────────────────────────────────

export function ReceiptDownloadButton({
  receipt,
  school,
}: {
  receipt: ReceiptData;
  school:  SchoolInfo;
}) {
  return (
    <PDFDownloadLink
      document={<ReceiptDocument receipt={receipt} school={school} />}
      fileName={`${receipt.receiptNumber}.pdf`}
      style={{ textDecoration: "none" }}
    >
      {({ loading }) => (
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          className="gap-1.5 h-7 px-2.5 text-xs border-slate-200 text-slate-600 hover:bg-slate-50"
          asChild={false}
        >
          {loading
            ? <Loader2 className="w-3 h-3 animate-spin" />
            : <Download className="w-3 h-3" />}
          {loading ? "…" : "PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}