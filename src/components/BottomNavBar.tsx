import React from 'react';
import { Home, Compass, Refrigerator, Bookmark, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TabType } from '../types';

export const BottomNavBar: React.FC = () => {
  const activeTab = useAppStore((state) => state.activeTab);
  const setActiveTab = useAppStore((state) => state.setActiveTab);
  const savedCount = useAppStore((state) => state.savedRecipes.length);
  const pantryCount = useAppStore((state) => state.pantryItems.length);

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string; size?: number }>; badge?: number }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'pantry', label: 'Kitchen', icon: Refrigerator, badge: pantryCount },
    { id: 'saved', label: 'Saved', icon: Bookmark, badge: savedCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#171717]/5 px-4 pt-2.5 pb-6 sm:pb-3 max-w-md mx-auto shadow-sm"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer ${
                isActive ? 'text-[#FF5A3C]' : 'text-[#737373] opacity-60 hover:opacity-100'
              }`}
            >
              <div className="relative">
                <Icon size={21} className={`transition-transform duration-200 ${isActive ? 'scale-105 stroke-[2.2]' : 'stroke-[1.6]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    id={`badge-${item.id}`}
                    className={`absolute -top-1.5 -right-2.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-tight ${
                      isActive ? 'bg-[#FF5A3C] text-white shadow-xs' : 'bg-[#171717]/10 text-[#171717]'
                    }`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-bold mt-1 uppercase tracking-tighter ${isActive ? 'text-[#FF5A3C]' : 'text-[#737373]'}`}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-[#FF5A3C]" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
