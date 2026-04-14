// // app/school/[slug]/finance/fees/accounts/page.tsx
// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   AlertCircle,
//   CheckCircle2,
//   ChevronRight,
//   Clock,
//   CreditCard,
//   FileText,
//   Receipt,
//   Search,
//   Wallet,
// } from "lucide-react";
// import Link from "next/link";

// // ─── types & mock data ───────────────────────────────────────────────────────
// type AccountStatus = "ACTIVE" | "CLEARED" | "OVERPAID";

// const ACCOUNTS = [
//   { id: "1", admissionNo: "S001/2025", studentName: "Nakato Aisha", class: "S.4 East", balance: 850000, totalInvoiced: 2450000, totalPaid: 1600000, status: "ACTIVE" as AccountStatus, hasArrears: true },
//   { id: "2", admissionNo: "S002/2025", studentName: "Ssemakula John", class: "S.4 West", balance: 0, totalInvoiced: 2450000, totalPaid: 2450000, status: "CLEARED" as AccountStatus, hasArrears: false },
//   { id: "3", admissionNo: "S003/2025", studentName: "Nabukenya Grace", class: "S.3 North", balance: 1200000, totalInvoiced: 2450000, totalPaid: 1250000, status: "ACTIVE" as AccountStatus, hasArrears: true },
//   { id: "4", admissionNo: "S004/2025", studentName: "Kizito Brian", class: "S.2 South", balance: -50000, totalInvoiced: 1800000, totalPaid: 1850000, status: "OVERPAID" as AccountStatus, hasArrears: false },
//   { id: "5", admissionNo: "S005/2025", studentName: "Nansubuga Rita", class: "S.1 East", balance: 400000, totalInvoiced: 1800000, totalPaid: 1400000, status: "ACTIVE" as AccountStatus, hasArrears: false },
//   { id: "6", admissionNo: "S006/2025", studentName: "Mukasa David", class: "S.5 Arts", balance: 0, totalInvoiced: 2800000, totalPaid: 2800000, status: "CLEARED" as AccountStatus, hasArrears: false },
// ];

// const INVOICES = [
//   { id: "i1", number: "INV-2025-T1-00001", totalAmount: 2450000, balance: 850000, paidAmount: 1600000, status: "PARTIAL", dueDate: "2025-03-31" },
// ];

// const TRANSACTIONS = [
//   { id: "t1", type: "PAYMENT", amount: 1000000, description: "MTN MoMo payment", date: "2025-02-15", receiptNo: "RCT-20250215-001" },
//   { id: "t2", type: "PAYMENT", amount: 600000, description: "Cash payment", date: "2025-01-20", receiptNo: "RCT-20250120-003" },
//   { id: "t3", type: "INVOICE", amount: 2450000, description: "Auto-generated invoice Term 1", date: "2025-01-10", receiptNo: null },
//   { id: "t4", type: "DISCOUNT", amount: 200000, description: "Bursary: Academic Excellence", date: "2025-01-10", receiptNo: null },
// ];

// const statusConfig: Record<AccountStatus, { label: string; color: string; icon: React.ElementType }> = {
//   ACTIVE:   { label: "Arrears",  color: "bg-amber-50 text-amber-700 border-amber-200",   icon: AlertCircle   },
//   CLEARED:  { label: "Cleared",  color: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
//   OVERPAID: { label: "Overpaid", color: "bg-violet-50 text-violet-700 border-violet-200",  icon: CreditCard   },
// };

// const txTypeColor: Record<string, string> = {
//   PAYMENT:  "text-emerald-600 bg-emerald-50",
//   INVOICE:  "text-blue-600 bg-blue-50",
//   DISCOUNT: "text-violet-600 bg-violet-50",
//   PENALTY:  "text-red-600 bg-red-50",
//   REFUND:   "text-amber-600 bg-amber-50",
// };

// function AccountDetailSheet({ account }: { account: typeof ACCOUNTS[number] }) {
//   return (
//     <Sheet>
//       <SheetTrigger asChild>
//         <Button variant="ghost" size="sm" className="h-7 px-2.5 text-xs text-blue-600 hover:bg-blue-50">
//           View <ChevronRight className="w-3 h-3 ml-0.5" />
//         </Button>
//       </SheetTrigger>
//       <SheetContent side="right" className="w-[520px] sm:max-w-[520px] p-0 overflow-y-auto">
//         {/* Sheet header */}
//         <SheetHeader className="p-5 pb-4 border-b border-slate-200 bg-slate-50">
//           <div className="flex items-center gap-3">
//             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
//               {account.studentName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
//             </div>
//             <div>
//               <SheetTitle className="text-slate-900 leading-tight">{account.studentName}</SheetTitle>
//               <SheetDescription className="text-xs">
//                 {account.admissionNo} · {account.class}
//               </SheetDescription>
//             </div>
//           </div>
//           {/* Balance summary */}
//           <div className="grid grid-cols-3 gap-3 mt-4">
//             {[
//               { label: "Invoiced", value: `UGX ${(account.totalInvoiced / 1e6).toFixed(2)}M`, color: "text-slate-700" },
//               { label: "Paid", value: `UGX ${(account.totalPaid / 1e6).toFixed(2)}M`, color: "text-emerald-600" },
//               { label: "Balance", value: `UGX ${Math.abs(account.balance).toLocaleString()}`, color: account.balance > 0 ? "text-amber-600" : "text-emerald-600" },
//             ].map((s) => (
//               <div key={s.label} className="bg-white border border-slate-200 rounded-lg p-2.5 text-center">
//                 <p className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">{s.label}</p>
//                 <p className={`text-sm font-bold mt-0.5 ${s.color}`}>{s.value}</p>
//               </div>
//             ))}
//           </div>
//         </SheetHeader>

//         {/* Tabs */}
//         <div className="p-4">
//           <Tabs defaultValue="invoices">
//             <TabsList className="grid grid-cols-2 bg-slate-100 mb-4">
//               <TabsTrigger value="invoices" className="text-xs">Invoices</TabsTrigger>
//               <TabsTrigger value="ledger" className="text-xs">Ledger</TabsTrigger>
//             </TabsList>

//             <TabsContent value="invoices" className="space-y-2 mt-0">
//               {INVOICES.map((inv) => (
//                 <div key={inv.id} className="border border-slate-200 rounded-lg p-3.5 bg-white hover:border-blue-200 transition-colors">
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <p className="text-xs font-mono font-semibold text-slate-700">{inv.number}</p>
//                       <p className="text-[10px] text-slate-400 mt-0.5">Due: {inv.dueDate}</p>
//                     </div>
//                     <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${
//                       inv.status === "PAID" ? "border-emerald-200 text-emerald-700 bg-emerald-50" :
//                       inv.status === "PARTIAL" ? "border-amber-200 text-amber-700 bg-amber-50" :
//                       "border-blue-200 text-blue-700 bg-blue-50"
//                     }`}>
//                       {inv.status}
//                     </Badge>
//                   </div>
//                   <div className="mt-2.5 flex gap-3 text-xs text-slate-600">
//                     <span>Total: <b>UGX {inv.totalAmount.toLocaleString()}</b></span>
//                     <span>Paid: <b className="text-emerald-600">UGX {inv.paidAmount.toLocaleString()}</b></span>
//                     <span>Bal: <b className="text-amber-600">UGX {inv.balance.toLocaleString()}</b></span>
//                   </div>
//                   {/* progress */}
//                   <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
//                     <div
//                       className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
//                       style={{ width: `${(inv.paidAmount / inv.totalAmount) * 100}%` }}
//                     />
//                   </div>
//                 </div>
//               ))}
//             </TabsContent>

//             <TabsContent value="ledger" className="space-y-1.5 mt-0">
//               {TRANSACTIONS.map((tx) => (
//                 <div key={tx.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
//                   <div className="flex items-center gap-2.5">
//                     <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${txTypeColor[tx.type] ?? "bg-slate-100 text-slate-600"}`}>
//                       {tx.type}
//                     </span>
//                     <div>
//                       <p className="text-xs text-slate-700">{tx.description}</p>
//                       <p className="text-[10px] text-slate-400">{tx.date}{tx.receiptNo ? ` · ${tx.receiptNo}` : ""}</p>
//                     </div>
//                   </div>
//                   <span className={`text-xs font-bold ${
//                     ["PAYMENT","DISCOUNT","WAIVER"].includes(tx.type) ? "text-emerald-600" : "text-slate-800"
//                   }`}>
//                     {["PAYMENT","DISCOUNT","WAIVER"].includes(tx.type) ? "-" : "+"}
//                     UGX {tx.amount.toLocaleString()}
//                   </span>
//                 </div>
//               ))}
//             </TabsContent>
//           </Tabs>
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────

// export default function StudentAccountsPage({ params }: { params: { slug: string } }) {
//   const [search, setSearch] = useState("");
//   const [statusFilter, setStatusFilter] = useState("ALL");

//   const filtered = ACCOUNTS.filter((a) => {
//     const matchSearch =
//       a.studentName.toLowerCase().includes(search.toLowerCase()) ||
//       a.admissionNo.toLowerCase().includes(search.toLowerCase());
//     const matchStatus = statusFilter === "ALL" || a.status === statusFilter;
//     return matchSearch && matchStatus;
//   });

//   return (
//     <div className="min-h-screen bg-slate-50/60 p-6 space-y-5">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Accounts</h1>
//           <p className="text-sm text-slate-500 mt-0.5">
//             {ACCOUNTS.length} accounts · {ACCOUNTS.filter((a) => a.status === "ACTIVE").length} with arrears
//           </p>
//         </div>
//         <Link href={`/school/${params.slug}/finance/fees/payments`}>
//           <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
//             <Receipt className="w-4 h-4" /> Record Payment
//           </Button>
//         </Link>
//       </div>

//       {/* Filters */}
//       <div className="flex items-center gap-3">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
//           <Input
//             placeholder="Search student or admission no…"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             className="pl-9 bg-white border-slate-200 w-72"
//           />
//         </div>
//         <Select value={statusFilter} onValueChange={setStatusFilter}>
//           <SelectTrigger className="w-40 bg-white border-slate-200 text-sm">
//             <SelectValue />
//           </SelectTrigger>
//           <SelectContent>
//             <SelectItem value="ALL">All Statuses</SelectItem>
//             <SelectItem value="ACTIVE">In Arrears</SelectItem>
//             <SelectItem value="CLEARED">Cleared</SelectItem>
//             <SelectItem value="OVERPAID">Overpaid</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>

//       {/* Table */}
//       <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
//         <Table>
//           <TableHeader>
//             <TableRow className="bg-slate-50 border-b border-slate-200">
//               {["Student", "Class", "Invoiced", "Paid", "Balance", "Status", ""].map((h) => (
//                 <TableHead key={h} className="text-xs font-semibold uppercase tracking-wide text-slate-500 first:pl-5 last:pr-5">
//                   {h}
//                 </TableHead>
//               ))}
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filtered.map((acc) => {
//               const cfg = statusConfig[acc.status];
//               return (
//                 <TableRow key={acc.id} className="hover:bg-slate-50/50 transition-colors">
//                   <TableCell className="pl-5">
//                     <div className="flex items-center gap-2.5">
//                       <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-xs font-bold text-white">
//                         {acc.studentName.split(" ").map((n) => n[0]).join("").slice(0,2)}
//                       </div>
//                       <div>
//                         <p className="text-sm font-semibold text-slate-800">{acc.studentName}</p>
//                         <p className="text-[10px] text-slate-400 font-mono">{acc.admissionNo}</p>
//                       </div>
//                     </div>
//                   </TableCell>
//                   <TableCell className="text-xs text-slate-600">{acc.class}</TableCell>
//                   <TableCell className="text-xs font-medium text-slate-700">
//                     UGX {acc.totalInvoiced.toLocaleString()}
//                   </TableCell>
//                   <TableCell className="text-xs font-medium text-emerald-600">
//                     UGX {acc.totalPaid.toLocaleString()}
//                   </TableCell>
//                   <TableCell>
//                     <span className={`text-xs font-bold ${acc.balance > 0 ? "text-amber-600" : acc.balance < 0 ? "text-violet-600" : "text-slate-400"}`}>
//                       {acc.balance < 0 ? "-" : ""}UGX {Math.abs(acc.balance).toLocaleString()}
//                     </span>
//                   </TableCell>
//                   <TableCell>
//                     <Badge variant="outline" className={`text-[10px] border gap-1 ${cfg.color}`}>
//                       <cfg.icon className="w-3 h-3" />
//                       {cfg.label}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="pr-5">
//                     <AccountDetailSheet account={acc} />
//                   </TableCell>
//                 </TableRow>
//               );
//             })}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }





// app/school/[slug]/finance/fees/accounts/page.tsx

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/config/auth";
import { redirect } from "next/navigation";
import { db } from "@/prisma/db";
import { Session } from "next-auth";
import StudentAccountsPage from "./components/StudentAccountsClient";

export default async function AccountsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const session  = (await getServerSession(authOptions)) as Session | null;
  const schoolId = session?.user?.school?.id;
  if (!schoolId) redirect("/login");

  // Active year + term
  const activeYear = await db.academicYear.findFirst({
    where:   { schoolId, isActive: true },
    include: { terms: { where: { isActive: true }, take: 1 } },
  });
  const activeTermId = activeYear?.terms[0]?.id ?? null;

  // All accounts for the active term (fall back to all if none)
  const accounts = await db.studentFeeAccount.findMany({
    where: {
      schoolId,
      ...(activeTermId ? { termId: activeTermId } : {}),
    },
    orderBy: { balance: "desc" },
    include: {
      student: {
        select: {
          id:          true,
          firstName:   true,
          lastName:    true,
          admissionNo: true,
          enrollments: {
            where:   { status: "ACTIVE" },
            select: {
              classYear: { select: { classTemplate: { select: { name: true } } } },
              stream:    { select: { name: true } },
            },
            take:    1,
            orderBy: { createdAt: "desc" },
          },
        },
      },
      term: { select: { name: true, termNumber: true } },
    },
  });

  const accountsForUI = accounts.map((a) => {
    const enr       = a.student.enrollments[0];
    const className  = enr?.classYear.classTemplate.name ?? "";
    const streamName = enr?.stream?.name ?? "";
    return {
      id:                   a.id,
      studentId:            a.student.id,
      studentName:          `${a.student.firstName} ${a.student.lastName}`,
      admissionNo:          a.student.admissionNo,
      class:                streamName ? `${className} ${streamName}` : className,
      termName:             a.term.name,
      totalInvoiced:        a.totalInvoiced,
      totalPaid:            a.totalPaid,
      totalDiscount:        a.totalDiscount,
      totalPenalty:         a.totalPenalty,
      totalWaived:          a.totalWaived,
      totalRefunded:        a.totalRefunded,
      carryForward:         a.carryForward,
      balance:              a.balance,
      status:               a.status as "ACTIVE" | "CLEARED" | "OVERPAID" | "SUSPENDED",
      autoInvoiceGenerated: a.autoInvoiceGenerated,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50/60 p-6">
      <StudentAccountsPage
        accounts={accountsForUI}
        slug={slug}
      />
    </div>
  );
}