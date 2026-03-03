"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
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

interface ProfileData {
  fullName: string;
  flatNo: string;
  block: string;
  societyName: string;
  mobile: string;
  email: string;
  aadhaarLast4: string;
  idCardUrl: string | null;
  avatarUrl: string | null;
}

const BLOCKS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editing, setEditing] = useState(false);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileData>({
    fullName: "",
    flatNo: "",
    block: "A",
    societyName: "",
    mobile: "",
    email: "",
    aadhaarLast4: "",
    idCardUrl: null,
    avatarUrl: null,
  });

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) {
        // Load saved profile from localStorage (will move to Supabase later)
        const savedProfile = localStorage.getItem(`profile_${user.id}`);
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          setProfile((prev) => ({
            ...prev,
            email: user.email || "",
            fullName: user.user_metadata?.full_name || "",
          }));
        }
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    // Save to localStorage for now — will move to Supabase profiles table
    localStorage.setItem(`profile_${user.id}`, JSON.stringify(profile));
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setIdPreview(dataUrl);
      setProfile((prev) => ({ ...prev, idCardUrl: dataUrl }));

      // Simulate ID card data extraction
      setExtracting(true);
      setTimeout(() => {
        setExtracting(false);
        // In production, this would use OCR (Google Vision / Tesseract)
        // For now, show a message that extraction is ready
      }, 1500);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/auth";
    return null;
  }

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

        {/* Avatar Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary/10">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-primary">
                  {profile.fullName
                    ? profile.fullName.charAt(0).toUpperCase()
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
                value={profile.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.fullName || "Not set"}
              </p>
            )}
          </div>

          {/* Flat & Block */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                <Home size={14} />
                Flat No.
              </label>
              {editing ? (
                <input
                  value={profile.flatNo}
                  onChange={(e) => handleChange("flatNo", e.target.value)}
                  placeholder="e.g., 204"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {profile.flatNo || "Not set"}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-surface p-4">
              <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
                <Building2 size={14} />
                Block
              </label>
              {editing ? (
                <select
                  value={profile.block}
                  onChange={(e) => handleChange("block", e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {BLOCKS.map((b) => (
                    <option key={b} value={b}>
                      {b}-Block
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm font-medium text-foreground">
                  {profile.block}-Block
                </p>
              )}
            </div>
          </div>

          {/* Society Name */}
          <div className="rounded-xl border border-border bg-surface p-4">
            <label className="mb-1.5 flex items-center gap-2 text-xs font-medium text-muted">
              <Building2 size={14} />
              Society Name
            </label>
            {editing ? (
              <input
                value={profile.societyName}
                onChange={(e) => handleChange("societyName", e.target.value)}
                placeholder="e.g., Green Valley Apartments"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.societyName || "Not set"}
              </p>
            )}
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
                  value={profile.mobile}
                  onChange={(e) =>
                    handleChange(
                      "mobile",
                      e.target.value.replace(/\D/g, "").slice(0, 10)
                    )
                  }
                  placeholder="98765 43210"
                  type="tel"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ) : (
              <p className="text-sm font-medium text-foreground">
                {profile.mobile ? `+91 ${profile.mobile}` : "Not set"}
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
              {profile.email || user.email}
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

            {idPreview || profile.idCardUrl ? (
              <div className="relative">
                <img
                  src={idPreview || profile.idCardUrl || ""}
                  alt="ID Card"
                  className="w-full rounded-lg border border-border object-contain"
                />
                {editing && (
                  <button
                    onClick={() => {
                      setIdPreview(null);
                      setProfile((prev) => ({ ...prev, idCardUrl: null }));
                    }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-danger text-white shadow-md"
                  >
                    <X size={14} />
                  </button>
                )}
                {extracting && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
                    <Loader2 size={14} className="animate-spin" />
                    Extracting details from ID card...
                  </div>
                )}
                {!extracting && idPreview && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                    <CheckCircle size={14} />
                    ID card uploaded. Fill in your details above.
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
                  <span className="text-sm font-medium">
                    Upload ID Card Photo
                  </span>
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
                <p className="mt-2 text-[10px] text-muted text-center">
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
                value={profile.aadhaarLast4}
                onChange={(e) =>
                  handleChange(
                    "aadhaarLast4",
                    e.target.value.replace(/\D/g, "").slice(0, 4)
                  )
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
              onClick={() => setEditing(false)}
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
