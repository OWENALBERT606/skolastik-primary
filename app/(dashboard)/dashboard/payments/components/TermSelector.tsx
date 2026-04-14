"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Term = { id: string; name: string };

export default function TermSelector({
  terms, value, onChange,
}: { terms: Term[]; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="All Terms" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Terms</SelectItem>
        {terms.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
