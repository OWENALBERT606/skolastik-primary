"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createExpense, createVendor, getExpenseCategories, getVendors } from "@/actions/expenses";


interface Props {
  schoolId: string;
  slug: string;
  // Optional: pre-fill for editing
  terms?: Array<{ id: string; name: string }>;
}

export default function ExpenseForm({ schoolId, slug, terms = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [showNewVendor, setShowNewVendor] = useState(false);

  const [form, setForm] = useState({
    categoryId: "",
    vendorId: "",
    academicTermId: "",
    description: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    paymentMethod: "",
    referenceNo: "",
    notes: "",
  });

  const [newVendor, setNewVendor] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    startTransition(async () => {
      const [cats, vens] = await Promise.all([
        getExpenseCategories(schoolId),
        getVendors(schoolId),
      ]);
      setCategories(cats as any[]);
      setVendors(vens as any[]);
    });
  }, [schoolId]);

  const handleAddVendor = async () => {
    if (!newVendor.name.trim()) return;
    startTransition(async () => {
      const res = await createVendor({ schoolId, ...newVendor });
      if (res.success) {
        const vens = await getVendors(schoolId);
        setVendors(vens as any[]);
        setForm((f) => ({ ...f, vendorId: (res.vendor as any).id }));
        setShowNewVendor(false);
        setNewVendor({ name: "", phone: "", address: "" });
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.categoryId) return setError("Please select a category.");
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0)
      return setError("Please enter a valid amount.");
    if (!form.expenseDate) return setError("Please enter the expense date.");

    startTransition(async () => {
      try {
        const res = await createExpense({
          schoolId,
          categoryId: form.categoryId,
          vendorId: form.vendorId || undefined,
          academicTermId: form.academicTermId || undefined,
          description: form.description,
          amount: Number(form.amount),
          expenseDate: new Date(form.expenseDate),
          paymentMethod: form.paymentMethod || undefined,
          referenceNo: form.referenceNo || undefined,
          notes: form.notes || undefined,
        });
        if (res.success) {
          router.push(`/${slug}/finance/expenses`);
        }
      } catch (err: any) {
        setError(err.message ?? "An error occurred. Please try again.");
      }
    });
  };

  const field = (
    label: string,
    required: boolean,
    children: React.ReactNode
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );

  const inputCls =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">New Expense</h1>
            <p className="text-sm text-gray-500">Record a school expenditure</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category */}
            {field("Expense Category", true,
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className={inputCls}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.name}
                  </option>
                ))}
              </select>
            )}

            {/* Description */}
            {field("Description", true,
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Purchased 50kg rice from Nakasero Market"
                className={inputCls}
              />
            )}

            {/* Amount + Date */}
            <div className="grid grid-cols-2 gap-4">
              {field("Amount (UGX)", true,
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0"
                  className={inputCls}
                />
              )}
              {field("Expense Date", true,
                <input
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm((f) => ({ ...f, expenseDate: e.target.value }))}
                  className={inputCls}
                />
              )}
            </div>

            {/* Vendor */}
            {field("Vendor / Supplier", false,
              <div className="flex gap-2">
                <select
                  value={form.vendorId}
                  onChange={(e) => setForm((f) => ({ ...f, vendorId: e.target.value }))}
                  className={`${inputCls} flex-1`}
                >
                  <option value="">No vendor / Internal expense</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowNewVendor(true)}
                  className="border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm px-3 rounded-lg whitespace-nowrap transition-colors"
                >
                  + New
                </button>
              </div>
            )}

            {/* New vendor inline form */}
            {showNewVendor && (
              <div className="border border-blue-100 bg-blue-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-blue-800">Add New Vendor</p>
                <input
                  type="text"
                  value={newVendor.name}
                  onChange={(e) => setNewVendor((v) => ({ ...v, name: e.target.value }))}
                  placeholder="Vendor / Supplier name *"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newVendor.phone}
                  onChange={(e) => setNewVendor((v) => ({ ...v, phone: e.target.value }))}
                  placeholder="Phone (optional)"
                  className={inputCls}
                />
                <input
                  type="text"
                  value={newVendor.address}
                  onChange={(e) => setNewVendor((v) => ({ ...v, address: e.target.value }))}
                  placeholder="Address (optional)"
                  className={inputCls}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewVendor(false)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2 text-sm rounded-lg hover:bg-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddVendor}
                    disabled={!newVendor.name.trim() || isPending}
                    className="flex-1 bg-blue-600 text-white py-2 text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Save Vendor
                  </button>
                </div>
              </div>
            )}

            {/* Payment Method + Reference */}
            <div className="grid grid-cols-2 gap-4">
              {field("Payment Method", false,
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Not yet paid</option>
                  {["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CHEQUE", "PETTY_CASH"].map((m) => (
                    <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
                  ))}
                </select>
              )}
              {field("Reference No.", false,
                <input
                  type="text"
                  value={form.referenceNo}
                  onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
                  placeholder="Receipt, cheque, MM ref..."
                  className={inputCls}
                />
              )}
            </div>

            {/* Term */}
            {terms.length > 0 &&
              field("Academic Term", false,
                <select
                  value={form.academicTermId}
                  onChange={(e) => setForm((f) => ({ ...f, academicTermId: e.target.value }))}
                  className={inputCls}
                >
                  <option value="">Not term-specific</option>
                  {terms.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )
            }

            {/* Notes */}
            {field("Notes", false,
              <textarea
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional details, justification, attachments..."
                className={inputCls}
              />
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "Saving..." : "Save as Draft"}
              </button>
            </div>
          </form>
        </div>

        <p className="text-xs text-center text-gray-400 mt-4">
          Expense will be saved as Draft. Submit it for approval when ready.
        </p>
      </div>
    </div>
  );
}