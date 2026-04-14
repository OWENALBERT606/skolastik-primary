// app/school/[slug]/finance/fees/config/components/AutoInvoiceConfigClient.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Info, Loader2, Settings2, Zap } from "lucide-react";
import { toast } from "sonner";
import { AutoInvoiceConfig } from "@prisma/client";
import { upsertAutoInvoiceConfig } from "@/actions/fee-bursary-installment";

// ─── Types ────────────────────────────────────────────────────────────────────

type TermOption = {
  id:          string;
  name:        string;
  termNumber:  number;
  isActive:    boolean;
};

type Props = {
  schoolId:        string;
  academicYearId:  string;
  terms:           TermOption[];
  activeTermId:    string;
  existingConfig:  AutoInvoiceConfig | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function configFromDb(config: AutoInvoiceConfig | null, fallbackTermId: string) {
  return {
    isEnabled:            config?.isEnabled            ?? true,
    generateOnEnrollment: config?.generateOnEnrollment ?? true,
    includeCarryForward:  config?.includeCarryForward  ?? true,
    applyBursaries:       config?.applyBursaries       ?? true,
    sendNotification:     config?.sendNotification     ?? false,
    generateOnDate:       config?.generateOnDate
      ? new Date(config.generateOnDate).toISOString().split("T")[0]
      : "",
    termId:               config?.termId ?? fallbackTermId,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutoInvoiceConfigClient({
  schoolId,
  academicYearId,
  terms,
  activeTermId,
  existingConfig,
}: Props) {
  const [config, setConfig]          = useState(() => configFromDb(existingConfig, activeTermId));
  const [savedOk, setSavedOk]        = useState(false);
  const [isPending, startTransition] = useTransition();

  // When the term selector changes, reload config for that term from the server
  // (simpler: just reset to defaults — user can save to upsert for the new term)
  function handleTermChange(termId: string) {
    setConfig((prev) => ({ ...prev, termId }));
    setSavedOk(false);
  }

  function toggle(key: keyof typeof config) {
    setConfig((prev) => ({ ...prev, [key]: !prev[key as keyof typeof prev] }));
    setSavedOk(false);
  }

  function handleSave() {
    if (!config.termId) {
      toast.error("Please select a term first");
      return;
    }

    startTransition(async () => {
      const result = await upsertAutoInvoiceConfig({
        schoolId,
        academicYearId,
        termId:               config.termId,
        isEnabled:            config.isEnabled,
        generateOnEnrollment: config.generateOnEnrollment,
        includeCarryForward:  config.includeCarryForward,
        applyBursaries:       config.applyBursaries,
        sendNotification:     config.sendNotification,
        generateOnDate:       config.generateOnDate
          ? new Date(config.generateOnDate)
          : undefined,
      });

      if (result.ok) {
        toast.success("Configuration saved");
        setSavedOk(true);
        setTimeout(() => setSavedOk(false), 2500);
      } else {
        toast.error(result.error);
      }
    });
  }

  const configItems = [
    {
      key:         "generateOnEnrollment" as const,
      title:       "Generate on Enrollment",
      description: "Automatically create an invoice when a student is enrolled into a term. Requires a published fee structure for the student's class.",
      color:       "purple",
    },
    {
      key:         "includeCarryForward" as const,
      title:       "Include Carry-Forward Balance",
      description: "When generating invoices, include any outstanding balance from the previous term as a carry-forward amount.",
      color:       "amber",
    },
    {
      key:         "applyBursaries" as const,
      title:       "Auto-Apply Bursaries",
      description: "Automatically apply any active bursary/scholarship assignments when generating the invoice.",
      color:       "violet",
    },
    {
      key:         "sendNotification" as const,
      title:       "Send SMS / Email Notification",
      description: "Queue a notification to the student's guardian when an invoice is generated.",
      color:       "blue",
    },
  ];

  const selectedTerm = terms.find((t) => t.id === config.termId);

  return (
    <div className="space-y-6 max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Auto-Invoice Config
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure automatic invoice generation behaviour per term
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isPending || !config.termId}
          className={`gap-2 ${
            savedOk
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-slate-800 hover:bg-slate-900"
          } text-white`}
        >
          {isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedOk ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <Settings2 className="w-4 h-4" />
          )}
          {isPending ? "Saving…" : savedOk ? "Saved!" : "Save Config"}
        </Button>
      </div>

      {/* Master enable */}
      <Card
        className={`border-2 transition-colors ${
          config.isEnabled
            ? "border-blue-300 bg-blue-50/50"
            : "border-slate-200 bg-white"
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  config.isEnabled ? "bg-blue-100" : "bg-slate-100"
                }`}
              >
                <Zap
                  className={`w-5 h-5 ${
                    config.isEnabled ? "text-blue-600" : "text-slate-400"
                  }`}
                />
              </div>
              <div>
                <p className="font-semibold text-slate-900">Auto-Invoice Enabled</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Master switch. Disabling this blocks all automatic invoice generation.
                </p>
              </div>
            </div>
            <Switch
              checked={config.isEnabled}
              onCheckedChange={() => toggle("isEnabled")}
              className="data-[state=checked]:bg-blue-500"
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      {/* Term selector */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Configuration Scope
          </CardTitle>
          <CardDescription className="text-xs">
            These settings apply to the selected term. Each term has its own independent config.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {terms.length === 0 ? (
            <p className="text-xs text-slate-400">
              No terms found for the active academic year.
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <Select
                value={config.termId}
                onValueChange={handleTermChange}
                disabled={isPending}
              >
                <SelectTrigger className="w-52 border-slate-200">
                  <SelectValue placeholder="Select term…" />
                </SelectTrigger>
                <SelectContent>
                  {terms.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTerm?.isActive && (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-200 text-blue-700 bg-blue-50"
                >
                  Active Term
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toggle options */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Behaviour Options
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-0 divide-y divide-slate-100">
          {configItems.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
            >
              <div className="flex items-start gap-3 mr-6">
                <div
                  className={`w-1.5 h-5 rounded-full mt-0.5 ${
                    item.color === "purple" ? "bg-blue-400" :
                    item.color === "amber"   ? "bg-amber-400"   :
                    item.color === "violet"  ? "bg-violet-400"  : "bg-blue-400"
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={config[item.key] as boolean}
                onCheckedChange={() => toggle(item.key)}
                className="data-[state=checked]:bg-blue-500 shrink-0"
                disabled={!config.isEnabled || isPending}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Scheduled date */}
      <Card className="border border-slate-200 bg-white">
        <CardHeader className="pb-3 pt-5 px-5">
          <CardTitle className="text-sm font-semibold text-slate-800">
            Scheduled Generation Date
          </CardTitle>
          <CardDescription className="text-xs">
            Optionally set a date to auto-generate invoices for all enrolled students
            (independent of the enrollment trigger).
          </CardDescription>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={config.generateOnDate}
              onChange={(e) =>
                setConfig({ ...config, generateOnDate: e.target.value })
              }
              className="w-52 border-slate-200"
              disabled={!config.isEnabled || isPending}
            />
            {config.generateOnDate && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-slate-400 hover:text-red-500"
                onClick={() => setConfig({ ...config, generateOnDate: "" })}
                disabled={isPending}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info notice */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800">
        <Info className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
        <div>
          <p className="font-semibold mb-0.5">Fee Structure Required</p>
          <p className="text-blue-600">
            Auto-invoice will only generate if a <b>published</b> fee structure exists for the
            student's class and selected term. Unpublished structures are silently skipped.
          </p>
        </div>
      </div>
    </div>
  );
}