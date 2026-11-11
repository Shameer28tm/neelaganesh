import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  CalendarPlus, 
  ClipboardCheck, 
  Cpu, 
  CheckCircle2, 
  Bell, 
  ChevronDown, 
  RefreshCw,
  X
} from 'lucide-react';
import { UserProfile, NotificationItem } from '../types';
import { USERS } from '../data/users';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  notifications: NotificationItem[];
  onNotificationClick: (notif: NotificationItem) => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  onChangeUser,
  notifications,
  onNotificationClick,
  onResetData
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Layers },
    { id: 'new-request', label: 'New Request', icon: CalendarPlus },
    { id: 'requests', label: 'Requests', icon: ClipboardCheck },
    { id: 'resources', label: 'Resources', icon: Sparkles },
    { id: 'agent', label: 'AI Agent', icon: Cpu },
    { id: 'approvals', label: 'Approval Center', icon: CheckCircle2 }
  ];

  return (
    <header className="sticky top-0 z-40 w-full liquid-glass-toolbar">
      {/* Top macOS chrome line with window controls & brand */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-6">
        
        {/* Zone 1: macOS Traffic Lights + Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 mr-1 hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 inline-block shadow-xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 inline-block shadow-xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 inline-block shadow-xs" />
          </div>

          <button 
            onClick={() => onSelectTab('dashboard')}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-[#0071e3] to-[#0055b3] text-white flex items-center justify-center shadow-xs">
              <Cpu className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
              CampusFlow AI
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Single Line, macOS style) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl backdrop-blur-md">
          {navItems.map(item => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions + Notification Bell + User Role Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Quick Demo Reset */}
          <button
            onClick={onResetData}
            title="Reset to fresh demo campus data"
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifMenu(!showNotifMenu);
                setShowUserMenu(false);
              }}
              className="relative p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 liquid-glass rounded-2xl shadow-xl p-3 z-50 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
                  <span className="text-xs font-semibold text-slate-800">Notifications</span>
                  <button 
                    onClick={() => setShowNotifMenu(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No recent alerts</p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNotificationClick(n);
                          setShowNotifMenu(false);
                        }}
                        className={`p-2.5 rounded-xl text-left cursor-pointer transition-colors ${
                          n.read ? 'bg-white/40 hover:bg-white/70' : 'bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60'
                        }`}
                      >
                        <p className="text-xs font-semibold text-slate-900 leading-snug">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Selector (Simulates Role-based Authentication) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifMenu(false);
              }}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-200/60 transition-colors border border-slate-200/60 bg-white/60 cursor-pointer"
            >
              <img 
                src={currentUser.avatarUrl} 
                alt={currentUser.name} 
                className="w-6 h-6 rounded-lg object-cover ring-1 ring-black/5"
              />
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-slate-900 leading-none">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 leading-none mt-0.5">{currentUser.roleTitle}</p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-72 liquid-glass rounded-2xl shadow-xl p-2 z-50 border border-slate-200/80 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-200/60">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Switch Campus Persona</p>
                  <p className="text-xs text-slate-600 mt-0.5">Test role permissions and approval views</p>
                </div>
                <div className="py-1 space-y-1">
                  {USERS.map(user => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onChangeUser(user);
                        setShowUserMenu(false);
                      }}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                        currentUser.id === user.id ? 'bg-blue-500/10 text-blue-900 font-medium' : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <img 
                        src={user.avatarUrl} 
                        alt={user.name} 
                        className="w-7 h-7 rounded-lg object-cover shrink-0 ring-1 ring-black/5" 
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold leading-tight">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.roleTitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-1.5 gap-1 border-t border-slate-200/50 bg-white/70">
        {navItems.map(item => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg whitespace-nowrap cursor-pointer ${
                isActive ? 'bg-blue-600 text-white font-medium shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3 h-3" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
