import React from 'react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Cpu, 
  Calendar, 
  MapPin, 
  Users, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { EventResourceRequest, CampusResource, ActivityLogItem, UserProfile } from '../types';

interface DashboardViewProps {
  requests: EventResourceRequest[];
  resources: CampusResource[];
  activities: ActivityLogItem[];
  currentUser: UserProfile;
  onNavigate: (tab: string) => void;
  onSelectRequest: (request: EventResourceRequest) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  requests,
  resources,
  activities,
  currentUser,
  onNavigate,
  onSelectRequest
}) => {
  const totalRequests = requests.length;
  const pendingApprovals = requests.filter(r => r.status === 'pending').length;
  const approvedRequests = requests.filter(r => r.status === 'approved').length;
  const modificationRequests = requests.filter(r => r.status === 'modification_requested').length;

  const totalEquipmentUnits = resources.reduce((sum, r) => sum + r.totalQuantity, 0);
  const inUseEquipmentUnits = resources.reduce((sum, r) => sum + r.inUseQuantity, 0);
  const utilizationRate = Math.round((inUseEquipmentUnits / (totalEquipmentUnits || 1)) * 100);

  // Upcoming approved or pending events sorted by eventDate
  const upcomingEvents = [...requests]
    .filter(r => r.status !== 'rejected')
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Hero Welcome Glass Banner */}
      <div className="relative overflow-hidden rounded-2xl liquid-glass border border-white/80 p-6 sm:p-8">
        <div className="absolute inset-0 -z-10 opacity-15 overflow-hidden">
          <img 
            src="/src/assets/images/campus_aerial_minimal_1794423326879.jpg" 
            alt="Campus Innovation Center" 
            className="w-full h-full object-cover filter blur-[2px]"
            referrerPolicy="no-referrer"
          />
        </div>

        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>Autonomous Campus Resource Operations</span>
            <span aria-hidden="true">·</span>
            <span>Active Session: {currentUser.name} ({currentUser.roleTitle})</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-balance">
            Autonomous Campus Event Resource Agent
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
            Streamlining campus venues, AV engineering, and equipment logistics with instant conflict detection, inventory validation, and intelligent approval routing.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('new-request')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Submit Resource Request</span>
            </button>

            {currentUser.role !== 'student' && (
              <button
                onClick={() => onNavigate('approvals')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-800 bg-white/80 hover:bg-white border border-slate-200/80 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Review Approval Queue ({pendingApprovals})</span>
              </button>
            )}

            <button
              onClick={() => onNavigate('agent')}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-purple-600" />
              <span>Inspect AI Agent Pipeline</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Zero-pill, tabular figures) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="p-4 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Requests</span>
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalRequests}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Across all departments</p>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Approvals</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono tabular-nums">
            {pendingApprovals}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting administrator sign-off</p>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Approved & Scheduled</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono tabular-nums">
            {approvedRequests}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Inventory reserved & confirmed</p>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Campus Inventory In-Use</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600 font-mono tabular-nums">
            {utilizationRate}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{inUseEquipmentUnits} of {totalEquipmentUnits} total units active</p>
        </div>

      </div>

      {/* Main Content Split: Upcoming Events + Autonomous Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming Events Column (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Upcoming Campus Events</h2>
              <p className="text-xs text-slate-500">Autonomous calendar bookings & confirmed venues</p>
            </div>
            <button
              onClick={() => onNavigate('requests')}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View all requests</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <div className="p-8 text-center rounded-2xl liquid-glass border border-slate-200/60">
                <p className="text-xs text-slate-500">No scheduled events found.</p>
              </div>
            ) : (
              upcomingEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => onSelectRequest(event)}
                  className="p-4 rounded-2xl liquid-glass border border-slate-200/60 hover:border-blue-400/50 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-mono text-slate-600">{event.id}</span>
                        <span aria-hidden="true">·</span>
                        <span>{event.department}</span>
                        <span aria-hidden="true">·</span>
                        <span className={
                          event.status === 'approved' ? 'text-emerald-600 font-medium' :
                          event.status === 'pending' ? 'text-amber-600 font-medium' :
                          'text-slate-600'
                        }>
                          {event.status === 'approved' ? 'Approved' : event.status === 'pending' ? 'Pending Approval' : 'Revision Requested'}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {event.eventName}
                      </h3>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-slate-800">
                        {new Date(event.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {event.startTime} - {event.endTime}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-200/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{event.venue}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{event.expectedAttendees}</span>
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      {event.resources.length} resource types allocated
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* AI Agent Status & Recent Activities Column (1 col) */}
        <div className="space-y-6">
          
          {/* AI Agent Status Card */}
          <div className="p-5 rounded-2xl liquid-glass border border-blue-200/60 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">CampusFlow Agent</h3>
                  <p className="text-[10px] text-slate-500">Autonomous Orchestrator</p>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md">
                Online
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Autonomous verification pipeline active. Analyzes inventory availability, calendar overlaps, and university policy rules in real time.
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-3 text-center">
              <div className="p-2 rounded-xl bg-slate-50/80">
                <span className="text-[10px] text-slate-500 block">Conflict Catch Rate</span>
                <span className="text-sm font-bold text-slate-900 font-mono">100%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50/80">
                <span className="text-[10px] text-slate-500 block">Avg Triage Speed</span>
                <span className="text-sm font-bold text-slate-900 font-mono">1.2s</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('agent')}
              className="mt-3 w-full py-1.5 px-3 rounded-lg text-xs font-medium text-blue-600 hover:bg-blue-50/80 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Open Agent Workbench</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Recent Activity Log */}
          <div className="p-5 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <h3 className="text-xs font-semibold text-slate-900">Recent Activity</h3>
              <span className="text-[10px] text-slate-400">Live feed</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activities.slice(0, 5).map(act => (
                <div key={act.id} className="text-left text-xs">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-medium text-slate-700">{act.actor}</span>
                    <span>{new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-900 mt-0.5">{act.action}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{act.details}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
