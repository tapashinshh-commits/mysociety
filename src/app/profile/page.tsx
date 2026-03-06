"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@/hooks/useUser";
import type { Society } from "@/types/database";
import {
  ArrowLeft,
  User as UserIcon,
  Home,
  Building2,
  Phone,
  Mail,
  CreditCard,
  Camera,
  Save,
  CheckCircle,
  Loader2,
  Upload,
  X,
  Edit3,
} from "lucide-react";

const BLOCKS_TOWERS = [
  "A-Block", "B-Block", "C-Block", "D-Block", "E-Block", "F-Block",
  "G-Block", "H-Block", "Tower 1", "Tower 2", "Tower 3", "Tower 4",
  "Tower 5", "Tower 6", "Tower 7", "Tower 8", "Tower 9", "Tower 10",
];

const FLOORS = [
  "Ground", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th",
  "9th", "10th", "11th", "12th", "13th", "14th", "15th", "16th",
  "17th", "18th", "19th", "20th",
];

export default function ProfilePage() {
  const { user, profile, loading, supabase, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [societies, setSocieties] = useState<Society[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Local form state
  const [form, setForm] = useState({
    full_name: "",
    society_id: "",
    flat_no: "",
    block: "",
    floor: "",
    mobile: "",
    aadhaar_last4: "",
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [idCardUrl, setIdCardUrl] = useState<string | null>(null);

  // Load societies from DB
  useEffect(() => {
    async function loadSocieties() {
      try {
        const { data, error } = await supabase
          .from("societies")
          .select("*")
          .order("name");
        if (error) {
          console.error("Error loading societies:", error.message);
        }
        if (data) setSocieties(data);
      } catch (err) {
        console.error("Failed to load societies:", err);
      }
    }
    loadSocieties();
  }, [supabase]);

  // Sync profile into form when loaded
  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        society_id: profile.society_id || "",
        flat_no: profile.flat_no || "",
        block: profile.block || "",
        floor: profile.floor || "",
        mobile: profile.mobile || "",
        aadhaar_last4: profile.aadhaar_last4 || "",
      });
      setAvatarUrl(profile.avatar_url);
      setIdCardUrl(profile.id_card_url);
      // Auto-enter edit mode if profile is incomplete
      if (!profile.full_name || !profile.society_id) {
        setEditing(true);
      }
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setError("");

    const { error: saveError } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        society_id: form.society_id || null,
        flat_no: form.flat_no || null,
        block: form.block || null,
        floor: form.floor || null,
        mobile: form.mobile || null,
        aadhaar_last4: form.aadhaar_last4 || null,
        avatar_url: avatarUrl,
        id_card_url: idCardUrl,
      })
      .eq("id", user.id);

    setSaving(false);

    if (saveError) {
      console.error("Error saving profile:", saveError.message);
      setError(saveError.message);
    } else {
      setSaved(true);
      setEditing(false);
      await refreshProfile();
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Show local preview
    const reader = new FileReader();
    reader.onload = (ev) => setIdPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setExtracting(true);

    // Upload to Supabase Storage
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("id-cards")
      .upload(filePath, file);

    if (!error) {
      setIdCardUrl(filePath);
    }
    setExtracting(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    const filePath = `${user.id}/${Date.now()}-avatar.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, file);

    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted">Redirecting to sign in...</p>
      </div>
    );
  }

  const societyName = societies.find((s) => s.id === form.society_id)?.name || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <a
              href="/dashboard"
              className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-foreground"
            >
              <ArrowLeft size={20} />
            </a>
            <h1 className="text-lg font-bold text-foreground">My Profile</h1>
          </div>
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              <Edit3 size={14} />
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-success px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Save size={14} />
              )}
              Save
            </button>
          )}
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-4 py-6">
        {/* Success Toast */}
        {saved && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-3 text-sm font-medium text-success">
            <CheckCircle size={16} />
            Profile saved successfully!
          </div>
        )}

        {/* Error Toast */}
        {error && (
          <div className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to save profile: {error}
          </div>
        )}

        {/* Avatar Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {form.full_name
                    ? form.full_name.charAt(0).toUpperCase()
                    : user.email?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {editing && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-md transition-colors hover:bg-primary-hover"
              >
                <Camera size={14} />
              </button>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <p className="mt-2 text-sm text-muted">{user.email}</p>
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          {/* Full Name */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
              <UserIcon size={14} />
              Full Name
            </label>
            {editing ? (
              <input
                value={form.full_name}
                onChange={(e) => handleChange("full_name", e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {form.full_name || "Not set"}
              </p>
            )}
          </div>

          {/* Society Name (Dropdown from DB) */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
              <Building2 size={14} />
              Society / Apartment Name
            </label>
            {editing ? (
              <select
                value={form.society_id}
                onChange={(e) => handleChange("society_id", e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select your society</option>
                {societies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}{s.city ? `, ${s.city}` : ""}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {societyName || "Not set"}
              </p>
            )}
          </div>

          {/* Flat, Block/Tower & Floor */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                <Home size={14} />
                Flat No.
              </label>
              {editing ? (
                <input
                  value={form.flat_no}
                  onChange={(e) => handleChange("flat_no", e.target.value)}
                  placeholder="e.g., 204"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {form.flat_no || "Not set"}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                <Building2 size={14} />
                Block / Tower
              </label>
              {editing ? (
                <select
                  value={form.block}
                  onChange={(e) => handleChange("block", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select</option>
                  {BLOCKS_TOWERS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {form.block || "Not set"}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                <Home size={14} />
                Floor
              </label>
              {editing ? (
                <select
                  value={form.floor}
                  onChange={(e) => handleChange("floor", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Select</option>
                  {FLOORS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {form.floor || "Not set"}
                </p>
              )}
            </div>
          </div>

          {/* Mobile Number */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
              <Phone size={14} />
              Mobile Number
            </label>
            {editing ? (
              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-border bg-surface-hover px-3 py-2.5 text-sm text-muted">
                  +91
                </span>
                <input
                  value={form.mobile}
                  onChange={(e) =>
                    handleChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="98765 43210"
                  type="tel"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {form.mobile ? `+91 ${form.mobile}` : "Not set"}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
              <Mail size={14} />
              Email Address
            </label>
            <p className="text-sm font-medium text-foreground">
              {user.email}
            </p>
            <p className="mt-1 text-[10px] text-muted">
              Email is linked to your login and cannot be changed here.
            </p>
          </div>

          {/* ID Card Section */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="mb-3 flex items-center gap-2 text-xs font-medium text-muted">
              <CreditCard size={14} />
              ID Verification
            </label>

            {idPreview || idCardUrl ? (
              <div className="relative">
                {idPreview ? (
                  <img
                    src={idPreview}
                    alt="ID Card"
                    className="w-full rounded-lg border border-border object-contain"
                  />
                ) : (
                  <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                    <CheckCircle size={14} />
                    ID card uploaded and stored securely.
                  </div>
                )}
                {editing && (
                  <button
                    onClick={() => {
                      setIdPreview(null);
                      setIdCardUrl(null);
                    }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white shadow-md"
                  >
                    <X size={14} />
                  </button>
                )}
                {extracting && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                    <Loader2 size={14} className="animate-spin" />
                    Uploading ID card...
                  </div>
                )}
              </div>
            ) : editing ? (
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border py-8 text-muted transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <Upload size={24} />
                  <span className="text-sm font-medium">Upload ID Card Photo</span>
                  <span className="text-[10px]">
                    Aadhaar, PAN, Driving License, or Voter ID
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleIdUpload}
                />
                <p className="mt-2 text-center text-[10px] text-muted">
                  Your ID is stored securely and only visible to society admins for verification.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                No ID uploaded.{" "}
                <button
                  onClick={() => setEditing(true)}
                  className="text-primary hover:underline"
                >
                  Edit profile
                </button>{" "}
                to upload.
              </p>
            )}
          </div>

          {/* Aadhaar Last 4 */}
          {editing && (
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                <CreditCard size={14} />
                Aadhaar (Last 4 Digits)
              </label>
              <input
                value={form.aadhaar_last4}
                onChange={(e) =>
                  handleChange("aadhaar_last4", e.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="XXXX"
                maxLength={4}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="mt-1 text-[10px] text-muted">
                Only last 4 digits stored for verification. Full Aadhaar is never saved.
              </p>
            </div>
          )}
        </div>

        {/* Save Button (bottom) */}
        {editing && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setEditing(false);
                // Reset form to saved profile values
                if (profile) {
                  setForm({
                    full_name: profile.full_name || "",
                    society_id: profile.society_id || "",
                    flat_no: profile.flat_no || "",
                    block: profile.block || "",
                    floor: profile.floor || "",
                    mobile: profile.mobile || "",
                    aadhaar_last4: profile.aadhaar_last4 || "",
                  });
                  setAvatarUrl(profile.avatar_url);
                  setIdCardUrl(profile.id_card_url);
                }
              }}
              className="flex-1 rounded-lg border border-border py-3 text-sm font-medium text-muted transition-colors hover:bg-surface"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
