import React, { useState } from 'react';
import {
  ChefHat,
  Sparkles,
  Globe2,
  UtensilsCrossed,
  Check,
  Flame,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { DietType, CookingLevelType, VideoLanguageType } from '../types';

const DIET_OPTIONS: { type: DietType; label: string; desc: string; icon: string }[] = [
  { type: 'Vegetarian', label: 'Vegetarian', desc: 'Plant-forward, dairy & greens', icon: '🥦' },
  { type: 'Non-Vegetarian', label: 'Non-Vegetarian', desc: 'Poultry, meats, seafood & eggs', icon: '🍗' },
  { type: 'Eggetarian', label: 'Eggetarian', desc: 'Vegetarian with eggs included', icon: '🍳' },
  { type: 'Vegan', label: 'Vegan', desc: '100% plant-based, cruelty free', icon: '🌱' },
];

const COOKING_LEVELS: { level: CookingLevelType; label: string; desc: string; time: string }[] = [
  { level: 'Beginner', label: 'Beginner', desc: 'Simple steps, everyday ingredients, foolproof recipes', time: '15-30m' },
  { level: 'Intermediate', label: 'Intermediate', desc: 'Layered spices, wok techniques, balanced complexity', time: '25-45m' },
  { level: 'Advanced', label: 'Advanced Master', desc: 'Artisanal reductions, precision braising, gourmet mastery', time: '40m+' },
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

export const OnboardingModal: React.FC = () => {
  const { userPreferences, updateUserPreferences, setOnboardingOpen, currentUser } = useAppStore();

  const [diet, setDiet] = useState<DietType>(userPreferences.diet || 'Non-Vegetarian');
  const [skillLevel, setSkillLevel] = useState<CookingLevelType>(userPreferences.skillLevel || 'Intermediate');
  const [videoLanguages, setVideoLanguages] = useState<VideoLanguageType[]>(
    userPreferences.videoLanguages && userPreferences.videoLanguages.length > 0
      ? userPreferences.videoLanguages
      : ['English', 'Hindi']
  );
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(
    userPreferences.favoriteCuisines && userPreferences.favoriteCuisines.length > 0
      ? userPreferences.favoriteCuisines
      : ['Indian', 'Italian']
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleLanguage = (lang: VideoLanguageType) => {
    if (videoLanguages.includes(lang)) {
      if (videoLanguages.length > 1) {
        setVideoLanguages(videoLanguages.filter(l => l !== lang));
      }
    } else {
      setVideoLanguages([...videoLanguages, lang]);
    }
  };

  const toggleCuisine = (cuisine: string) => {
    if (favoriteCuisines.includes(cuisine)) {
      if (favoriteCuisines.length > 1) {
        setFavoriteCuisines(favoriteCuisines.filter(c => c !== cuisine));
      }
    } else {
      setFavoriteCuisines([...favoriteCuisines, cuisine]);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      await updateUserPreferences({
        diet,
        skillLevel,
        videoLanguages,
        favoriteCuisines,
        onboardingCompleted: true,
      });
      setOnboardingOpen(false);
    } catch (e) {
      console.warn('Failed saving onboarding prefs:', e);
      setOnboardingOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="onboarding-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-[#FAF7F2] w-full max-w-lg rounded-[32px] border border-[#EBE6DC] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 bg-white border-b border-[#F0ECE4] text-center relative">
          <div className="w-12 h-12 bg-[#FF5A3C]/10 text-[#FF5A3C] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <ChefHat size={26} />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#FF5A3C] block mb-1">
            Personalize Your Kitchen
          </span>
          <h2 className="text-2xl font-serif italic text-[#171717]">
            Tailored Culinary Intelligence
          </h2>
          <p className="text-xs text-[#737373] mt-1 max-w-sm mx-auto">
            Gemini and YouTube will personalize every recipe, video masterclass, and pantry recommendation to your exact preferences.
          </p>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
          {/* 1. Diet Preference */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <UtensilsCrossed size={14} className="text-[#FF5A3C]" />
                <span>1. Dietary Lifestyle</span>
              </label>
              <span className="text-[11px] text-[#A3A3A3] font-medium">Single selection</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {DIET_OPTIONS.map((opt) => {
                const isSelected = diet === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setDiet(opt.type)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                        : 'bg-white text-[#171717] border-[#E8E3DA] hover:border-[#FF5A3C]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg">{opt.icon}</span>
                      {isSelected && <Check size={14} className="text-[#FF5A3C]" />}
                    </div>
                    <div className="mt-2">
                      <h4 className="text-xs font-bold leading-tight">{opt.label}</h4>
                      <p className={`text-[10px] mt-0.5 leading-snug line-clamp-2 ${isSelected ? 'text-[#D4D4D4]' : 'text-[#737373]'}`}>
                        {opt.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Cooking Skill Level */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Flame size={14} className="text-[#FF5A3C]" />
                <span>2. Cooking Skill Level</span>
              </label>
              <span className="text-[11px] text-[#A3A3A3] font-medium">Calibrates technique complexity</span>
            </div>
            <div className="space-y-2">
              {COOKING_LEVELS.map((lvl) => {
                const isSelected = skillLevel === lvl.level;
                return (
                  <button
                    key={lvl.level}
                    type="button"
                    onClick={() => setSkillLevel(lvl.level)}
                    className={`w-full p-3 rounded-2xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#171717] text-white border-[#171717] shadow-sm'
                        : 'bg-white text-[#171717] border-[#E8E3DA] hover:border-[#FF5A3C]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold">{lvl.label}</h4>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'}`}>
                          {lvl.time}
                        </span>
                      </div>
                      <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-[#D4D4D4]' : 'text-[#737373]'}`}>
                        {lvl.desc}
                      </p>
                    </div>
                    {isSelected && <Check size={16} className="text-[#FF5A3C] flex-shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. YouTube Video Languages */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Globe2 size={14} className="text-[#FF5A3C]" />
                <span>3. Video Masterclass Languages</span>
              </label>
              <span className="text-[11px] text-[#A3A3A3] font-medium">Multi-select</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {VIDEO_LANGUAGES.map((item) => {
                const isChecked = videoLanguages.includes(item.lang);
                return (
                  <button
                    key={item.lang}
                    type="button"
                    onClick={() => toggleLanguage(item.lang)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-[#FF5A3C] text-white border-[#FF5A3C] font-bold shadow-2xs'
                        : 'bg-white text-[#171717] border-[#E8E3DA] hover:border-[#FF5A3C]'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{item.lang}</div>
                    <div className={`text-[10px] ${isChecked ? 'text-white/80' : 'text-[#737373]'}`}>{item.native}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Favorite Cuisines */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#171717] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#FF5A3C]" />
                <span>4. Favorite Cuisines</span>
              </label>
              <span className="text-[11px] text-[#A3A3A3] font-medium">Select favorites</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CUISINE_OPTIONS.map((c) => {
                const isSelected = favoriteCuisines.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCuisine(c)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#171717] text-white border-[#171717] shadow-xs'
                        : 'bg-white text-[#737373] border-[#E8E3DA] hover:border-[#FF5A3C]'
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-white border-t border-[#F0ECE4] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setOnboardingOpen(false)}
            className="text-xs font-bold text-[#737373] hover:text-[#171717] px-3 py-2 cursor-pointer transition-colors"
          >
            Skip for now
          </button>
          <button
            id="complete-onboarding-btn"
            type="button"
            disabled={isSaving}
            onClick={handleComplete}
            className="flex-1 py-3.5 px-5 bg-[#FF5A3C] hover:bg-[#E2482B] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#FF5A3C]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Personalizing Atelier...</span>
            ) : (
              <>
                <span>Save Preferences & Explore</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
