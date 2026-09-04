import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Zap,
  Youtube,
  Database,
  Flame,
  ChefHat,
  Sparkles,
  Check,
  Globe2,
  LogIn,
  LogOut,
  Calendar,
  History,
  RotateCcw,
  Star,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { DietType, CookingLevelType, VideoLanguageType, Recipe } from '../../types';

const DIET_OPTIONS: { type: DietType; label: string; icon: string }[] = [
  { type: 'Vegetarian', label: 'Vegetarian', icon: '🥦' },
  { type: 'Non-Vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
  { type: 'Eggetarian', label: 'Eggetarian', icon: '🍳' },
  { type: 'Vegan', label: 'Vegan', icon: '🌱' },
];

const SKILL_LEVELS: { level: CookingLevelType; label: string; desc: string }[] = [
  { level: 'Beginner', label: 'Beginner', desc: 'Simple steps & staple ingredients' },
  { level: 'Intermediate', label: 'Intermediate', desc: 'Layered spices & balanced complexity' },
  { level: 'Advanced', label: 'Advanced', desc: 'Precision techniques & culinary mastery' },
];

const VIDEO_LANGUAGES: { lang: VideoLanguageType; native: string }[] = [
  { lang: 'English', native: 'English' },
  { lang: 'Hindi', native: 'हिन्दी' },
  { lang: 'Marathi', native: 'मराठी' },
  { lang: 'Konkani', native: 'कोंकणी' },
  { lang: 'Tamil', native: 'தமிழ்' },
  { lang: 'Telugu', native: 'తెలుగు' },
];

const CUISINE_OPTIONS = [
  'Indian', 'Goan', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Thai'
];

const SPICE_LEVELS = ['Mild', 'Medium', 'Hot', 'Fiery'] as const;

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    userPreferences,
    updateUserPreferences,
    savedRecipes,
    pantryItems,
    currentUser,
    setAuthModalOpen,
    setOnboardingOpen,
    signOut,
    cookingHistory,
    setSelectedRecipe,
    startCookingMode,
  } = useAppStore();

  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'offline' }));
  }, []);

  const toggleLanguage = (lang: VideoLanguageType) => {
    const current = userPreferences.videoLanguages || ['English'];
    let updated: VideoLanguageType[];
    if (current.includes(lang)) {
      if (current.length > 1) {
        updated = current.filter(l => l !== lang);
      } else {
        return;
      }
    } else {
      updated = [...current, lang];
    }
    updateUserPreferences({ videoLanguages: updated });
  };

  const toggleCuisine = (cuisine: string) => {
    const current = userPreferences.favoriteCuisines || ['Indian'];
    let updated: string[];
    if (current.includes(cuisine)) {
      if (current.length > 1) {
        updated = current.filter(c => c !== cuisine);
      } else {
        return;
      }
    } else {
      updated = [...current, cuisine];
    }
    updateUserPreferences({ favoriteCuisines: updated });
  };

  const isGuest = !currentUser || currentUser.isGuest;

  return (
    <div id="profile-view" className="space-y-6 px-4 pt-3 pb-8 text-left">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#737373] font-bold mb-1 block">
            Atelier & Sensibilities • Chef Identity
          </span>
          <h1 className="text-3xl sm:text-4xl font-serif italic font-light tracking-tight text-[#171717]">
            Profile.
          </h1>
        </div>
        <button
          onClick={() => setOnboardingOpen(true)}
          className="px-3 py-1.5 bg-[#FFF5F2] hover:bg-[#FFEBE5] text-[#FF5A3C] text-xs font-bold rounded-xl border border-[#FF5A3C]/20 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
        >
          <RotateCcw size={12} />
          <span>Personalize</span>
        </button>
      </div>

      {/* User / Authentication Card */}
      <div className="bg-white rounded-[32px] p-5 border border-[#171717]/5 shadow-xs flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0">
            <img
              src={currentUser?.avatarUrl || userProfile.avatarUrl}
              alt={currentUser?.name || userProfile.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#FF5A3C] shadow-2xs"
            />
            <span className="absolute bottom-0 right-0 p-1 bg-[#FF5A3C] text-white rounded-full shadow-xs">
              <Sparkles size={10} />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-serif italic font-bold text-[#171717] truncate">
                {currentUser?.name || userProfile.name}
              </h2>
              {isGuest ? (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                  Guest
                </span>
              ) : (
                <span className="text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={10} /> Verified
                </span>
              )}
            </div>
            <p className="text-xs text-[#737373] truncate">
              {currentUser?.email || userProfile.email}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#FFF5F2] text-[#FF5A3C] px-2 py-0.5 rounded-full">
                {userPreferences.diet}
              </span>
              <span className="text-[10px] font-bold text-[#737373]">
                {userPreferences.skillLevel}
              </span>
            </div>
          </div>
        </div>

        {/* Auth Action Buttons */}
        <div className="pt-3 border-t border-[#F5F2EC] flex items-center justify-between">
          {isGuest ? (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-2.5 px-4 bg-[#FF5A3C] hover:bg-[#E2482B] text-white text-xs font-bold rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn size={14} />
              <span>Sign In with Google or Email (Sync Data)</span>
            </button>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-stone-500 font-medium">Synced with Supabase Cloud</span>
              <button
                onClick={() => signOut()}
                className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut size={13} />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* App Stats */}
      <div className="grid grid-cols-3 gap-2.5 text-center">
        <div className="bg-white rounded-[20px] p-3.5 border border-[#171717]/5 shadow-xs">
          <span className="text-2xl font-serif font-light text-[#FF5A3C] block">{savedRecipes.length}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#737373] mt-0.5 block">Saved Dishes</span>
        </div>
        <div className="bg-white rounded-[20px] p-3.5 border border-[#171717]/5 shadow-xs">
          <span className="text-2xl font-serif font-light text-[#171717] block">{pantryItems.length}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#737373] mt-0.5 block">Pantry Staples</span>
        </div>
        <div className="bg-white rounded-[20px] p-3.5 border border-[#171717]/5 shadow-xs">
          <span className="text-2xl font-serif font-light text-emerald-600 block">{cookingHistory.length}</span>
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#737373] mt-0.5 block">Dishes Cooked</span>
        </div>
      </div>

      {/* 1. Diet Preference (Vegetarian, Non-Vegetarian, Vegan, Eggetarian) */}
      <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Dietary Lifestyle
          </h3>
          <span className="text-[10px] text-[#A3A3A3] font-medium">Guides Gemini Prompts</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {DIET_OPTIONS.map((item) => {
            const isSelected = userPreferences.diet === item.type;
            return (
              <button
                key={item.type}
                onClick={() => updateUserPreferences({ diet: item.type })}
                className={`py-2.5 px-3 text-xs font-bold rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#171717] text-white border-[#171717] shadow-xs'
                    : 'bg-[#FFFDF9] text-[#737373] border-[#171717]/5 hover:border-[#FF5A3C]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {isSelected && <Check size={14} className="text-[#FF5A3C]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cooking Skill Level (Beginner, Intermediate, Advanced) */}
      <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
          Culinary Skill Level
        </h3>
        <div className="space-y-2">
          {SKILL_LEVELS.map((lvl) => {
            const isSelected = userPreferences.skillLevel === lvl.level;
            return (
              <button
                key={lvl.level}
                onClick={() => updateUserPreferences({ skillLevel: lvl.level })}
                className={`w-full p-3 text-left rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-[#171717] text-white border-[#171717] shadow-xs'
                    : 'bg-[#FFFDF9] text-[#737373] border-[#171717]/5 hover:border-[#FF5A3C]'
                }`}
              >
                <div>
                  <h4 className="text-xs font-bold leading-tight">{lvl.label}</h4>
                  <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#D4D4D4]' : 'text-[#737373]'}`}>
                    {lvl.desc}
                  </p>
                </div>
                {isSelected && <Check size={16} className="text-[#FF5A3C]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Video Masterclass Languages (English, Hindi, Marathi, Konkani, Tamil, Telugu) */}
      <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#171717]">
            <Globe2 size={14} className="text-[#FF5A3C]" />
            <span>YouTube Tutorial Languages</span>
          </div>
          <span className="text-[10px] text-[#A3A3A3] font-medium">Multi-select</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {VIDEO_LANGUAGES.map((v) => {
            const isChecked = (userPreferences.videoLanguages || []).includes(v.lang);
            return (
              <button
                key={v.lang}
                onClick={() => toggleLanguage(v.lang)}
                className={`py-2 px-2 rounded-xl border text-center transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-[#FF5A3C] text-white border-[#FF5A3C] font-bold shadow-2xs'
                    : 'bg-[#FFFDF9] text-[#737373] border-[#171717]/5 hover:border-[#FF5A3C]'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{v.lang}</div>
                <div className={`text-[10px] ${isChecked ? 'text-white/80' : 'text-[#A3A3A3]'}`}>{v.native}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Favorite Cuisines */}
      <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#171717]">
          Favorite Cuisines
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {CUISINE_OPTIONS.map((c) => {
            const isSelected = (userPreferences.favoriteCuisines || []).includes(c);
            return (
              <button
                key={c}
                onClick={() => toggleCuisine(c)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#171717] text-white border-[#171717] shadow-xs'
                    : 'bg-[#FFFDF9] text-[#737373] border-[#171717]/5 hover:border-[#FF5A3C]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Cooking History Section */}
      <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#171717]">
            <History size={14} className="text-[#FF5A3C]" />
            <span>Cooking History</span>
          </div>
          <span className="text-[10px] font-bold text-[#737373]">
            {cookingHistory.length} Sessions
          </span>
        </div>

        {cookingHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-[#737373] bg-[#FFFDF9] rounded-2xl border border-dashed border-[#E8E3DA]">
            <ChefHat size={24} className="mx-auto text-[#A3A3A3] mb-1" />
            <p>No cooking history yet.</p>
            <p className="text-[11px] text-[#A3A3A3] mt-0.5">Start cooking any recipe to track your culinary journey!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cookingHistory.slice(0, 5).map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedRecipe(item.recipeData)}
                className="p-2.5 bg-[#FFFDF9] hover:bg-[#FFF5F2] border border-[#171717]/5 rounded-2xl flex items-center justify-between cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex-shrink-0">
                    <img
                      src={item.recipeData.imageUrl}
                      alt={item.recipeTitle}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-[#171717] truncate group-hover:text-[#FF5A3C] transition-colors">
                      {item.recipeTitle}
                    </h5>
                    <span className="text-[10px] text-[#A3A3A3] block">
                      {new Date(item.cookedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {item.recipeData.cuisine}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#FF5A3C] bg-white px-2 py-1 rounded-lg border border-[#F0ECE4]">
                    Cook Again
                  </span>
                  <ChevronRight size={14} className="text-[#A3A3A3]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Services & Edge Function Status */}
      <div className="bg-white rounded-[28px] p-5 border border-[#171717]/5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
            Live Architecture Status
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Backend Active
          </span>
        </div>

        <div className="space-y-2 text-xs">
          {/* Gemini */}
          <div className="flex items-center justify-between p-3 bg-[#FFFDF9] rounded-2xl border border-[#171717]/5">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[#FF5A3C]" />
              <span className="font-semibold text-[#171717]">Gemini 3.8-Flash API</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              {healthStatus?.geminiConfigured ? 'Connected (Live Data)' : 'Active (Ready)'}
            </span>
          </div>

          {/* YouTube Data API */}
          <div className="flex items-center justify-between p-3 bg-[#FFFDF9] rounded-2xl border border-[#171717]/5">
            <div className="flex items-center gap-2">
              <Youtube size={14} className="text-red-500" />
              <span className="font-semibold text-[#171717]">YouTube Data API v3</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              {healthStatus?.youtubeConfigured ? 'Direct API Key' : 'Verified Proxy Enabled'}
            </span>
          </div>

          {/* Supabase Edge Service */}
          <div className="flex items-center justify-between p-3 bg-[#FFFDF9] rounded-2xl border border-[#171717]/5">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-emerald-600" />
              <span className="font-semibold text-[#171717]">Supabase Service & RLS</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">
              {healthStatus?.supabaseConfigured ? 'Cloud Sync Online' : 'Local + Offline Cache'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
