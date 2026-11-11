import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Cpu, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  ShieldAlert, 
  MessageSquare,
  Sparkles,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { EventResourceRequest, UserProfile } from '../types';
import { submitApproverAction } from '../services/api';
import { USERS } from '../data/users';

interface ApprovalCenterViewProps {
  requests: EventResourceRequest[];
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  onRequestUpdated: (updated: EventResourceRequest) => void;
  onSelectRequest: (req: EventResourceRequest) => void;
}

export const ApprovalCenterView: React.FC<ApprovalCenterViewProps> = ({
  requests,
  currentUser,
  onChangeUser,
  onRequestUpdated,
  onSelectRequest
}) => {
  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager';

  // Action Dialog state
  const [selectedReq, setSelectedReq] = useState<EventResourceRequest | null>(null);
  const [actionType, setActionType] = useState<'approved' | 'rejected' | 'modification_requested' | null>(null);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const recentlyDecided = requests.filter(r => r.status !== 'pending');

  const handleOpenAction = (req: EventResourceRequest, type: 'approved' | 'rejected' | 'modification_requested') => {
    setSelectedReq(req);
    setActionType(type);
    if (type === 'approved') {
      setComments('Approved. Equipment inventory allocated and setup technician notified.');
    } else if (type === 'modification_requested') {
      const alt = req.aiEvaluation?.alternatives?.[0]?.suggestion;
      setComments(alt ? `Please revise request: ${alt}` : 'Please adjust start time or venue to eliminate scheduling conflict.');
    } else {
      setComments('Request cannot be accommodated due to severe conflict/policy constraints.');
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedReq || !actionType) return;
    setIsSubmitting(true);

    try {
      const res = await submitApproverAction(selectedReq.id, {
        action: actionType,
        comments,
        approverName: currentUser.name,
        approverRole: currentUser.roleTitle
      });

      onRequestUpdated(res.request);
      setSelectedReq(null);
      setActionType(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Administrator Approval Center</h1>
          <p className="text-xs text-slate-500">Autonomous AI recommendations with human-in-the-loop governance</p>
        </div>

        <div className="text-xs text-slate-600 bg-white/70 px-3 py-1.5 rounded-xl border border-slate-200/60 shadow-xs flex items-center gap-2">
          <span>Active Role:</span>
          <span className="font-semibold text-slate-900">{currentUser.roleTitle}</span>
          {isAuthorized ? (
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-medium">Authorized</span>
          ) : (
            <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium">Read Only</span>
          )}
        </div>
      </div>

      {/* Role Authorization Notice if Student */}
      {!isAuthorized && (
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/70 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold">Student Access Mode</p>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Students can view approval statuses, but signing off requires administrative credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeUser(USERS[1])}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              Switch to Dr. Sarah (Admin)
            </button>
            <button
              onClick={() => onChangeUser(USERS[2])}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs shadow-xs transition-colors cursor-pointer"
            >
              Switch to Marcus (Manager)
            </button>
          </div>
        </div>
      )}

      {/* Pending Approval Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Pending Review Queue</h2>
            <span className="text-xs font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
              {pendingRequests.length}
            </span>
          </div>
          <span className="text-xs text-slate-400">Sorted by submission priority</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-12 text-center rounded-2xl liquid-glass border border-slate-200/60">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">Inbox Zero: All Requests Processed</h3>
            <p className="text-xs text-slate-500 mt-1">No pending campus resource approvals in queue.</p>
          </div>
        ) : (
          pendingRequests.map(req => {
            const aiRec = req.aiEvaluation?.recommendation;
            return (
              <div 
                key={req.id}
                className="p-5 sm:p-6 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                      <span className="font-mono text-slate-700 font-semibold">{req.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{req.department}</span>
                      <span aria-hidden="true">·</span>
                      <span>Requester: {req.requesterName}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{req.eventName}</h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-slate-800 block">
                      {new Date(req.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {req.startTime} - {req.endTime}
                    </span>
                  </div>
                </div>

                {/* Details strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 bg-slate-50/60 p-3 rounded-xl border border-slate-200/60">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Venue & Capacity</span>
                    <span className="font-medium text-slate-900">{req.venue}</span> ({req.expectedAttendees} attendees)
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Requested Equipment</span>
                    <span className="font-medium text-slate-900">
                      {req.resources.map(r => `${r.resourceName} (×${r.quantity})`).join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Special Technical Instructions</span>
                    <span className="italic text-slate-700">{req.additionalInstructions || 'None'}</span>
                  </div>
                </div>

                {/* AI Agent Recommendation Spotlight */}
                {req.aiEvaluation && (
                  <div className={`p-4 rounded-xl border text-xs space-y-2 ${
                    aiRec === 'RECOMMEND_APPROVE' 
                      ? 'bg-emerald-50/80 border-emerald-200/80' 
                      : aiRec === 'RECOMMEND_REVISE' 
                      ? 'bg-amber-50/80 border-amber-200/80' 
                      : 'bg-red-50/80 border-red-200/80'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Cpu className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-900">AI Agent Recommendation:</span>
                        <span className={
                          aiRec === 'RECOMMEND_APPROVE' ? 'text-emerald-800' :
                          aiRec === 'RECOMMEND_REVISE' ? 'text-amber-800' :
                          'text-red-800'
                        }>
                          {aiRec === 'RECOMMEND_APPROVE' ? 'APPROVE REQUEST' :
                           aiRec === 'RECOMMEND_REVISE' ? 'REQUEST REVISIONS' :
                           'REJECT REQUEST'}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-slate-500">
                        {req.aiEvaluation.confidenceScore}% Confidence · {req.aiEvaluation.agentModel}
                      </span>
                    </div>

                    <p className="text-slate-700 leading-relaxed">{req.aiEvaluation.summary}</p>

                    {/* Conflict indicators if any */}
                    {req.aiEvaluation.conflicts.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[11px] font-semibold text-red-700">Identified Conflicts:</span>
                        {req.aiEvaluation.conflicts.map((c, i) => (
                          <p key={i} className="text-[11px] text-red-800">
                            • <strong>{c.title}:</strong> {c.description}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Suggested alternatives */}
                    {req.aiEvaluation.alternatives.length > 0 && (
                      <div className="pt-1 space-y-1">
                        <span className="text-[11px] font-semibold text-blue-700">Autonomous Alternative Options:</span>
                        {req.aiEvaluation.alternatives.map((a, i) => (
                          <p key={i} className="text-[11px] text-blue-900">
                            • <strong>{a.suggestion}:</strong> {a.rationale}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Approver Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => onSelectRequest(req)}
                    className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <span>View complete audit history & 12 steps</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={!isAuthorized}
                      onClick={() => handleOpenAction(req, 'rejected')}
                      className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      disabled={!isAuthorized}
                      onClick={() => handleOpenAction(req, 'modification_requested')}
                      className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                    >
                      Request Modifications
                    </button>
                    <button
                      disabled={!isAuthorized}
                      onClick={() => handleOpenAction(req, 'approved')}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs disabled:opacity-40 cursor-pointer"
                    >
                      Approve & Allocate
                    </button>
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Action Dialog Modal */}
      {selectedReq && actionType && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full liquid-glass rounded-2xl p-6 shadow-2xl border border-white/80 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <h3 className="text-sm font-semibold text-slate-900">
                Confirm Decision: {actionType === 'approved' ? 'Approve Request' : actionType === 'rejected' ? 'Reject Request' : 'Request Modifications'}
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Recording administrator decision for <strong>"{selectedReq.eventName}"</strong> ({selectedReq.id}).
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Official Feedback / Allocation Directives
              </label>
              <textarea
                rows={3}
                value={comments}
                onChange={e => setComments(e.target.value)}
                placeholder="Enter instructions for the requester and warehouse facilities..."
                className="w-full text-xs p-2.5 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={`px-4 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ${
                  actionType === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  actionType === 'modification_requested' ? 'bg-amber-600 hover:bg-amber-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Confirm {actionType.replace('_', ' ')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recently Decided History */}
      <div className="space-y-3 pt-6 border-t border-slate-200/60">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Completed Approval Audits ({recentlyDecided.length})
        </h2>

        <div className="space-y-2">
          {recentlyDecided.slice(0, 4).map(req => (
            <div
              key={req.id}
              onClick={() => onSelectRequest(req)}
              className="p-3 rounded-xl bg-white/60 border border-slate-200/60 flex items-center justify-between text-xs hover:bg-white cursor-pointer transition-colors"
            >
              <div>
                <span className="font-mono text-slate-500 font-semibold">{req.id}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="font-medium text-slate-900">{req.eventName}</span>
                <span className="mx-2 text-slate-300">·</span>
                <span className="text-slate-500">{req.requesterName}</span>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                  req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                  req.status === 'modification_requested' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {req.status === 'approved' ? 'Approved' :
                   req.status === 'modification_requested' ? 'Revision Requested' :
                   'Rejected'}
                </span>
                <span className="text-slate-400 font-mono text-[11px]">
                  {req.approvalAudit ? req.approvalAudit.decidedBy : 'Audited'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
