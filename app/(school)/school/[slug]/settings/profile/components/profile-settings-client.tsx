// app/(school)/school/[slug]/settings/profile/components/profile-settings-client.tsx
"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import {
  Loader2, Save, CheckCircle2, AlertCircle,
  Building2, Phone, Mail, Globe, BookOpen, Upload, ImageIcon,
} from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";
import { updateSchoolProfile } from "@/actions/school-settings";

type School = {
  id:       string;
  name:     string;
  motto:    string | null;
  slug:     string;
  code:     string;
  address:  string | null;
  contact:  string | null;
  contact2: string | null;
  contact3: string | null;
  email:    string | null;
  email2:   string | null;
  website:  string | null;
  logo:     string | null;
  division: string;
};

type Props = { school: School; slug: string };

function Field({
  label, value, onChange, placeholder, type = "text", icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        )}
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                      rounded-lg py-2.5 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary
                      transition-colors ${Icon ? "pl-9 pr-3" : "px-3"}`}
        />
      </div>
    </div>
  );
}

export default function ProfileSettingsClient({ school, slug }: Props) {
  const [name,     setName]     = useState(school.name     ?? "");
  const [motto,    setMotto]    = useState(school.motto    ?? "");
  const [address,  setAddress]  = useState(school.address  ?? "");
  const [contact,  setContact]  = useState(school.contact  ?? "");
  const [contact2, setContact2] = useState(school.contact2 ?? "");
  const [contact3, setContact3] = useState(school.contact3 ?? "");
  const [email,    setEmail]    = useState(school.email    ?? "");
  const [email2,   setEmail2]   = useState(school.email2   ?? "");
  const [website,  setWebsite]  = useState(school.website  ?? "");
  const [logo,     setLogo]     = useState(school.logo     ?? "");

  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [success,   setSuccess]   = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    startTransition(async () => {
      const res = await updateSchoolProfile(
        school.id,
        {
          name, motto: motto || null, address: address || null,
          contact: contact || null, contact2: contact2 || null, contact3: contact3 || null,
          email: email || null, email2: email2 || null, website: website || null,
          logo: logo || null,
        },
        slug,
      );
      if (res.ok) setSuccess(res.message);
      else setError(res.message);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── School Badge / Logo ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ImageIcon className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">School Badge / Logo</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Preview */}
          <div className="shrink-0">
            <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 overflow-hidden
                            bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
              {logo ? (
                <Image
                  src={logo}
                  alt="School badge"
                  width={112}
                  height={112}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <Building2 className="h-8 w-8" />
                  <span className="text-[10px]">No badge</span>
                </div>
              )}
            </div>
            {logo && (
              <button
                type="button"
                onClick={() => setLogo("")}
                className="mt-2 w-full text-xs text-red-400 hover:text-red-600 transition-colors text-center"
              >
                Remove
              </button>
            )}
          </div>

          {/* Upload area */}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Upload your school badge or logo. It will appear in the sidebar and on official documents.
              Recommended: square image, at least 200×200px.
            </p>
            <div className={`transition-opacity ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <UploadButton
                endpoint="schoolLogo"
                onUploadBegin={() => setUploading(true)}
                onClientUploadComplete={(res) => {
                  setUploading(false);
                  if (res?.[0]?.url) {
                    setLogo(res[0].url);
                    setSuccess(null);
                    setError(null);
                  }
                }}
                onUploadError={(err) => {
                  setUploading(false);
                  setError(`Upload failed: ${err.message}`);
                }}
                appearance={{
                  button: "bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg px-4 py-2 ut-uploading:opacity-60",
                  allowedContent: "text-xs text-slate-400",
                }}
              />
            </div>
            {uploading && (
              <p className="flex items-center gap-2 text-xs text-slate-400">
                <Loader2 className="h-3 w-3 animate-spin" /> Uploading…
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Basic info ────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Basic Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <Field label="School Name *" value={name} onChange={setName}
              placeholder="e.g. St. Mary's Secondary School" icon={Building2} />
          </div>
          <div className="md:col-span-2">
            <Field label="Motto / Tagline" value={motto} onChange={setMotto}
              placeholder="e.g. Knowledge is Power" icon={BookOpen} />
          </div>
          <div className="md:col-span-2">
            <Field label="Physical Address" value={address} onChange={setAddress}
              placeholder="e.g. P.O. Box 123, Kampala" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-1 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <span>Slug: <span className="font-mono text-slate-500">{school.slug}</span></span>
          <span>Code: <span className="font-mono text-slate-500">{school.code}</span></span>
        </div>
      </div>

      {/* ── Contacts ──────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Phone className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Contact Numbers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Primary Contact"   value={contact}  onChange={setContact}  placeholder="+256 700 000 000" icon={Phone} />
          <Field label="Secondary Contact" value={contact2} onChange={setContact2} placeholder="+256 700 000 001" icon={Phone} />
          <Field label="Third Contact"     value={contact3} onChange={setContact3} placeholder="+256 700 000 002" icon={Phone} />
        </div>
      </div>

      {/* ── Online presence ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="h-4 w-4 text-slate-500" />
          <h2 className="font-semibold text-slate-700 dark:text-slate-200">Online Presence</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Primary Email"   value={email}   onChange={setEmail}   placeholder="admin@school.ac.ug"  type="email" icon={Mail}  />
          <Field label="Secondary Email" value={email2}  onChange={setEmail2}  placeholder="info@school.ac.ug"   type="email" icon={Mail}  />
          <div className="md:col-span-2">
            <Field label="Website" value={website} onChange={setWebsite} placeholder="https://www.school.ac.ug" type="url" icon={Globe} />
          </div>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending || uploading || !name.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50
                     disabled:cursor-not-allowed text-primary-foreground text-sm font-medium rounded-xl transition-colors"
        >
          {isPending
            ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
            : <><Save className="h-4 w-4" />Save Changes</>
          }
        </button>
      </div>
    </form>
  );
}
