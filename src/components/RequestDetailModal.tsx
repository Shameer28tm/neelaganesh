import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  Check, 
  FileText,
  User,
  Building,
  Loader2
} from 'lucide-react';
import { EventResourceRequest, UserProfile } from '../types';
import { submitApproverAction } from '../services/api';

interface RequestDetailModalProps {
  request: EventResourceRequest;
  currentUser: UserProfile;
  onClose: () => void;
  onRequestUpdated: (updated: EventResourceRequest) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({
  request,
  currentUser,
  onClose,
  onRequestUpdated
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'ai_eval' | 'workflow_steps'>('overview');
  const [actionComments, setActionComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthorized = currentUser.role === 'admin' || currentUser.role === 'manager';
  const ai = request.aiEvaluation;

  const handleAction = async (action: 'approved' | 'rejected' | 'modification_requested') => {
    setIsSubmitting(true);
    try {
      const res = await submitApproverAction(request.id, {
        action,
        comments: actionComments || (action === 'approved' ? 'Approved by administrator' : 'Processed via Request Detail Drawer'),
        approverName: currentUser.name,
        approverRole: currentUser.roleTitle
      });
      onRequestUpdated(res.request);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col liquid-glass rounded-3xl shadow-2xl border border-white/80 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200/60 flex items-start justify-between gap-4 bg-white/70">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="font-mono text-slate-800 font-semibold">{request.id}</span>
              <span aria-hidden="true">·</span>
              <span>{request.department}</span>
              <span aria-hidden="true">·</span>
              <span className={`font-semibold px-2 py-0.5 rounded-md ${
                request.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                request.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                request.status === 'modification_requested' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {request.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{request.eventName}</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers (Segmented controls) */}
        <div className="px-6 py-2 border-b border-slate-200/60 bg-slate-50/50 flex items-center gap-2">
          {[
            { id: 'overview', label: 'Overview & Resources' },
            { id: 'ai_eval', label: 'AI Agent Evaluation' },
            { id: 'workflow_steps', label: '12-Step Autonomous Audit' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-xs font-semibold' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              
              {/* Event Metadata Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/70 border border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Date</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(request.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Time</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {request.startTime} - {request.endTime}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Venue</span>
                  <span className="font-semibold text-slate-800 truncate block">
                    {request.venue}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Expected Attendance</span>
                  <span className="font-semibold text-slate-800 font-mono tabular-nums">
                    {request.expectedAttendees} Guests
                  </span>
                </div>
              </div>

              {/* Requester Contact */}
              <div className="p-4 rounded-2xl bg-white/70 border border-slate-200/60 text-xs flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{request.requesterName}</p>
                    <p className="text-[11px] text-slate-500">{request.requesterEmail} · {request.requesterRole}</p>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Submitted {new Date(request.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* Resources Allocated */}
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Allocated Equipment Inventory ({request.resources.length})
                </h3>
                <div className="space-y-2">
                  {request.resources.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-3 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{item.resourceName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">ID: {item.resourceId}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 font-mono text-sm">×{item.quantity}</span>
                        <span className="text-[10px] text-slate-400 block">units reserved</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical instructions */}
              {request.additionalInstructions && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Technical Instructions
                  </h3>
                  <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 text-xs text-slate-700 italic">
                    "{request.additionalInstructions}"
                  </div>
                </div>
              )}

              {/* Approval Audit History if decided */}
              {request.approvalAudit && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Audit Decision: {request.approvalAudit.action.toUpperCase().replace('_', ' ')}</span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {new Date(request.approvalAudit.decidedAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    By {request.approvalAudit.decidedBy} ({request.approvalAudit.decidedByRole})
                  </p>
                  <p className="text-slate-800 bg-white p-2 rounded-lg border border-slate-200 mt-2">
                    Note: "{request.approvalAudit.comments}"
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AI AGENT EVALUATION */}
          {activeTab === 'ai_eval' && (
            <div className="space-y-4">
              {!ai ? (
                <p className="text-xs text-slate-500 p-8 text-center">No AI evaluation attached.</p>
              ) : (
                <>
                  {/* AI Recommendation Banner */}
                  <div className={`p-5 rounded-2xl border text-xs space-y-2 ${
                    ai.recommendation === 'RECOMMEND_APPROVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' :
                    ai.recommendation === 'RECOMMEND_REVISE' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                    'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-bold">
                          {ai.recommendation.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-semibold">
                        {ai.confidenceScore}% Confidence · {ai.agentModel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed pt-1">
                      {ai.summary}
                    </p>
                  </div>

                  {/* Detected Conflicts */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Conflict Matrix ({ai.conflicts.length})
                    </h3>
                    {ai.conflicts.length === 0 ? (
                      <div className="p-3 rounded-xl bg-white/70 border border-slate-200/60 text-xs text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Zero direct scheduling collisions or resource shortages detected.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ai.conflicts.map((c, i) => (
                          <div key={i} className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-0.5">
                            <span className="font-bold">{c.title}</span>
                            <p className="text-red-800 text-[11px]">{c.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Smart Alternatives */}
                  {ai.alternatives.length > 0 && (
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        Autonomous Suggested Alternatives ({ai.alternatives.length})
                      </h3>
                      <div className="space-y-2">
                        {ai.alternatives.map((alt, i) => (
                          <div key={i} className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                            <p className="font-bold">{alt.suggestion}</p>
                            <p className="text-blue-800 text-[11px]">{alt.rationale}</p>
                            <p className="text-[10px] text-blue-600 font-mono">Impact: {alt.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Policy Checks */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Safety & Operational Policy Checklist
                    </h3>
                    <div className="space-y-1.5">
                      {ai.policyChecks.map((chk, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-white/70 border border-slate-200/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {chk.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-4 h-4 text-amber-600" />
                            )}
                            <span className="font-medium text-slate-800">{chk.rule}</span>
                          </div>
                          <span className="text-[11px] text-slate-500">{chk.notes}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Reasoning Bullets */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Agent Synthesis & Justifications
                    </h3>
                    <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside bg-white/70 p-3 rounded-xl border border-slate-200/60">
                      {ai.reasoning.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: 12-STEP AUTONOMOUS AUDIT */}
          {activeTab === 'workflow_steps' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-semibold text-slate-800">12-Step Autonomous Orchestration Trace</span>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono">
                  All 12 Steps Recorded
                </span>
              </div>

              <div className="space-y-2">
                {(request.workflowSteps || []).map((step) => (
                  <div 
                    key={step.stepNumber}
                    className="p-3 rounded-xl bg-white/70 border border-slate-200/60 flex items-start gap-3 text-xs"
                  >
                    <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">
                          Step {step.stepNumber}. {step.title}
                        </span>
                        {step.completedAt && (
                          <span className="font-mono text-[10px] text-slate-400">
                            {new Date(step.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{step.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls (Human Approver Action) */}
        {request.status === 'pending' && isAuthorized && (
          <div className="p-4 border-t border-slate-200/60 bg-white/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <input
              type="text"
              value={actionComments}
              onChange={e => setActionComments(e.target.value)}
              placeholder="Add optional decision note or allocation instructions..."
              className="w-full sm:flex-1 text-xs p-2 rounded-xl bg-white border border-slate-200 text-slate-900"
            />

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleAction('rejected')}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors cursor-pointer"
              >
                Reject
              </button>
              <button
                onClick={() => handleAction('modification_requested')}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors cursor-pointer"
              >
                Request Edit
              </button>
              <button
                onClick={() => handleAction('approved')}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Approve & Reserve</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
