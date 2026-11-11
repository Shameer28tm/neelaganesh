import React, { useState } from 'react';
import { 
  Search, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Cpu, 
  ChevronRight, 
  Filter,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { EventResourceRequest, RequestStatus, UserProfile } from '../types';

interface RequestManagementViewProps {
  requests: EventResourceRequest[];
  currentUser: UserProfile;
  onSelectRequest: (req: EventResourceRequest) => void;
  onNavigate: (tab: string) => void;
}

export const RequestManagementView: React.FC<RequestManagementViewProps> = ({
  requests,
  currentUser,
  onSelectRequest,
  onNavigate
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const departments = Array.from(new Set(requests.map(r => r.department)));

  const filtered = requests.filter(r => {
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchesDept = departmentFilter === 'all' || r.department === departmentFilter;
    const matchesSearch = searchQuery === '' ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.requesterName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.venue.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesDept && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Campus Resource Requests</h1>
          <p className="text-xs text-slate-500">Autonomous intake, conflict analysis, and administrator sign-off ledger</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('new-request')}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            + New Request
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Search input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by event, request ID, requester, or venue..."
              className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-white/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full sm:w-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:inline">Department:</span>
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full sm:w-auto text-xs p-2 rounded-xl bg-white/90 border border-slate-200 text-slate-700 cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tab Filter (Segmented control) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-200/50">
          {[
            { label: 'All Requests', value: 'all', count: requests.length },
            { label: 'Pending Approvals', value: 'pending', count: requests.filter(r => r.status === 'pending').length },
            { label: 'Approved', value: 'approved', count: requests.filter(r => r.status === 'approved').length },
            { label: 'Needs Modification', value: 'modification_requested', count: requests.filter(r => r.status === 'modification_requested').length },
            { label: 'Rejected', value: 'rejected', count: requests.filter(r => r.status === 'rejected').length }
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.value 
                  ? 'bg-slate-900 text-white shadow-xs font-semibold' 
                  : 'bg-white/60 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table / Grid */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl liquid-glass border border-slate-200/60">
            <p className="text-xs text-slate-500">No requests match the selected criteria.</p>
          </div>
        ) : (
          filtered.map(req => {
            const aiRec = req.aiEvaluation?.recommendation;
            return (
              <div
                key={req.id}
                onClick={() => onSelectRequest(req)}
                className="p-5 rounded-2xl liquid-glass border border-slate-200/60 hover:border-blue-400/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Left Column: ID, Event, Dept, Requester */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono text-slate-800 font-semibold">{req.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.department}</span>
                      <span aria-hidden="true">·</span>
                      <span>By {req.requesterName}</span>
                    </div>

                    <h2 className="text-base font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {req.eventName}
                    </h2>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(req.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono">{req.startTime} - {req.endTime}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{req.venue}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono tabular-nums">{req.expectedAttendees} Attendees</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: AI Agent Badge & Status */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/50">
                    
                    {/* Status badge */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        req.status === 'modification_requested' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {req.status === 'approved' ? 'Approved' :
                         req.status === 'pending' ? 'Pending Approval' :
                         req.status === 'modification_requested' ? 'Modification Requested' :
                         'Rejected'}
                      </span>
                    </div>

                    {/* AI Agent Recommendation Indicator */}
                    {req.aiEvaluation && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        <span>AI:</span>
                        <span className={`font-semibold ${
                          aiRec === 'RECOMMEND_APPROVE' ? 'text-emerald-700' :
                          aiRec === 'RECOMMEND_REVISE' ? 'text-amber-700' :
                          'text-red-700'
                        }`}>
                          {aiRec === 'RECOMMEND_APPROVE' ? 'Recommend Approve' :
                           aiRec === 'RECOMMEND_REVISE' ? 'Suggest Revision' :
                           'Recommend Reject'}
                        </span>
                        <span className="font-mono text-[11px] text-slate-400">({req.aiEvaluation.confidenceScore}%)</span>
                      </div>
                    )}

                    <div className="hidden lg:flex items-center gap-1 text-xs text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      <span>View details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>

                  </div>

                </div>

                {/* Resource Allocation Preview Chips */}
                <div className="mt-3 pt-3 border-t border-slate-200/50 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-slate-400 font-medium">Resources:</span>
                  {req.resources.map((item, idx) => (
                    <span 
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-white/80 border border-slate-200/60 text-slate-700"
                    >
                      {item.resourceName} <strong className="font-mono">×{item.quantity}</strong>
                    </span>
                  ))}
                </div>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
