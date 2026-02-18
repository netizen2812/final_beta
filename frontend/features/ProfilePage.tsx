import React, { useState } from "react";
import {
  Users,
  ChevronRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
  Loader2,
  Settings,
  UserCircle,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useChildContext } from "../contexts/ChildContext";
import { Child } from "../types";
import { useUser } from "@clerk/clerk-react";

type ProfileSubView =
  | "overview"
  | "settings"
  | "tarbiyah-mgmt"
  | "add-child"
  | "edit-child";

const ProfilePage: React.FC = () => {
  const { user } = useUser();

  const [subView, setSubView] = useState<ProfileSubView>("overview");
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const { currentUser, updateProfile } = useAuth();
  const {
    children,
    activeChild,
    loading,
    addChild,
    updateChild: editChild,
    deleteChild,
    setActiveChild,
  } = useChildContext();

  const navigateBack = () => {
    if (["add-child", "edit-child"].includes(subView))
      setSubView("tarbiyah-mgmt");
    else setSubView("overview");
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-islamic-green" size={40} />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
          Syncing Profiles...
        </p>
      </div>
    );
  }

  const Overview = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm relative overflow-hidden">
        <div className="relative">
          <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-white shadow-lg overflow-hidden">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <UserCircle size={96} className="text-slate-300" />
            )}
          </div>
        </div>
        <div className="text-center md:text-left flex-1 space-y-1">
          <h1 className="text-2xl font-serif font-bold text-[#052e16]">
            {user?.fullName || currentUser?.name || "Parent"}
          </h1>

          <p className="text-slate-400 font-medium text-sm">
            {user?.primaryEmailAddress?.emailAddress ||
              currentUser?.email ||
              "Clerk Account"}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => setSubView("tarbiyah-mgmt")}
          className="bg-white p-6 rounded-[2rem] border border-emerald-50 flex items-center justify-between group hover:shadow-xl hover:border-emerald-100 transition-all text-left"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-bold">Family Management</h3>
              <p className="text-xs text-gray-400">
                {children.length} profile(s)
              </p>
            </div>
          </div>
          <ChevronRight className="text-gray-300" size={20} />
        </button>
        <button
          onClick={() => setSubView("settings")}
          className="bg-white p-6 rounded-[2rem] border border-emerald-50 flex items-center justify-between group hover:shadow-xl hover:border-emerald-100 transition-all text-left"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-slate-400 text-white rounded-2xl flex items-center justify-center">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-bold">Settings</h3>
              <p className="text-xs text-gray-400">Parent info</p>
            </div>
          </div>
          <ChevronRight className="text-gray-300" size={20} />
        </button>
      </div>
    </div>
  );

  const TarbiyahMgmt = () => (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={navigateBack}
          className="p-2 hover:bg-emerald-50 rounded-full transition-colors text-slate-400"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-serif font-bold text-[#052e16]">
          Child Profiles
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {children.map((child) => {
          const isActive = activeChild?.id === child.id;
          return (
            <div
              key={child.id}
              className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between ${isActive ? "bg-emerald-50/30 border-emerald-500" : "bg-white border-emerald-50"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-2xl border border-emerald-50">
                  {child.gender === "Girl" ? "👧" : "👦"}
                </div>
                <div>
                  <h4 className="font-bold text-[#052e16]">{child.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Lvl {child.child_progress?.[0].level || 1}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingChild(child);
                    setSubView("edit-child");
                  }}
                  className="p-3 bg-slate-50 hover:bg-emerald-50 rounded-xl text-slate-400 hover:text-emerald-600 transition-all border border-slate-100"
                >
                  <Settings size={18} />
                </button>
                {!isActive && (
                  <button
                    onClick={() => setActiveChild(child.id)}
                    className="px-5 py-3 bg-[#052e16] text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Select
                  </button>
                )}
                {isActive && (
                  <div className="p-3 bg-emerald-500 text-white rounded-xl">
                    <Check size={18} strokeWidth={3} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button
          onClick={() => setSubView("add-child")}
          className="p-8 border-2 border-dashed border-emerald-100 rounded-[2rem] flex flex-col items-center justify-center gap-3 text-emerald-300 hover:text-emerald-600 hover:border-emerald-300 transition-all"
        >
          <div className="p-3 bg-emerald-50 rounded-full">
            <Plus size={24} />
          </div>
          <span className="font-black uppercase tracking-widest text-[10px]">
            Add New Profile
          </span>
        </button>
      </div>
    </div>
  );

  const ChildForm = ({ initialData }: { initialData?: Child }) => {
    const [name, setNameInput] = useState(initialData?.name || "");
    const [age, setAge] = useState(initialData?.age || 7);
    const [gender, setGender] = useState<"Boy" | "Girl">(
      initialData?.gender || "Boy",
    );
    const [saving, setSaving] = useState(false);

    const onSave = () => {
      setSaving(true);
      if (initialData) editChild({ ...initialData, name, age, gender });
      else addChild({ name, age, gender });
      setTimeout(() => {
        setSaving(false);
        setSubView("tarbiyah-mgmt");
      }, 500);
    };

    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm">
        <section className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
          />
        </section>
        <div className="grid grid-cols-2 gap-4">
          <section className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
              Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(parseInt(e.target.value))}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl"
            />
          </section>
          <section className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
              Gender
            </label>
            <div className="flex bg-slate-50 p-1 rounded-2xl">
              <button
                onClick={() => setGender("Boy")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold ${gender === "Boy" ? "bg-white shadow-sm" : ""}`}
              >
                Boy
              </button>
              <button
                onClick={() => setGender("Girl")}
                className={`flex-1 py-3 rounded-xl text-xs font-bold ${gender === "Girl" ? "bg-white shadow-sm" : ""}`}
              >
                Girl
              </button>
            </div>
          </section>
        </div>
        <button
          onClick={onSave}
          className="w-full py-5 bg-[#052e16] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg"
        >
          {saving ? (
            <Loader2 className="animate-spin" size={20} />
          ) : initialData ? (
            "Save Changes"
          ) : (
            "Create Profile"
          )}
        </button>
        {initialData && (
          <button
            onClick={() => {
              deleteChild(initialData.id);
              setSubView("tarbiyah-mgmt");
            }}
            className="w-full py-5 text-rose-500 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>
    );
  };

  const SettingsView = () => {
    const [name, setNameInput] = useState(currentUser?.name || "");
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={navigateBack}
            className="p-2 hover:bg-emerald-50 rounded-full text-slate-400"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-serif font-bold text-[#052e16]">
            Settings
          </h2>
        </div>
        <section className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">
            Parent Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setNameInput(e.target.value)}
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none"
          />
        </section>
        <button
          onClick={() => {
            updateProfile(name);
            setSubView("overview");
          }}
          className="w-full py-5 bg-[#052e16] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg"
        >
          Save Settings
        </button>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-20">
      {subView === "overview" && <Overview />}
      {subView === "tarbiyah-mgmt" && <TarbiyahMgmt />}
      {subView === "add-child" && <ChildForm />}
      {subView === "edit-child" && <ChildForm initialData={editingChild!} />}
      {subView === "settings" && <SettingsView />}
    </div>
  );
};

export default ProfilePage;
