import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  Loader2,
  Cpu,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CampusResource, EventResourceRequest, RequestedResourceItem, UserProfile, AiEvaluation } from '../types';
import { parseNaturalLanguageRequest, evaluateRequestWithAgent, executeAutonomousWorkflow } from '../services/api';

interface NewRequestViewProps {
  resources: CampusResource[];
  currentUser: UserProfile;
  onRequestSubmitted: (newReq: EventResourceRequest) => void;
  onNavigate: (tab: string) => void;
}

export const NewRequestView: React.FC<NewRequestViewProps> = ({
  resources,
  currentUser,
  onRequestSubmitted,
  onNavigate
}) => {
  // Input mode: 'natural' vs 'structured'
  const [naturalPrompt, setNaturalPrompt] = useState('');
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [parseNotice, setParseNotice] = useState<string | null>(null);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [department, setDepartment] = useState(currentUser.department || 'School of Engineering');
  const [eventDate, setEventDate] = useState('2026-11-25');
  const [startTime, setStartTime] = useState('14:00');
  const [endTime, setEndTime] = useState('17:00');
  const [venue, setVenue] = useState('Alan Turing Grand Auditorium');
  const [expectedAttendees, setExpectedAttendees] = useState(120);
  const [priority, setPriority] = useState<'standard' | 'high' | 'urgent'>('standard');
  const [additionalInstructions, setAdditionalInstructions] = useState('');
  
  // Selected Resources
  const [selectedResources, setSelectedResources] = useState<RequestedResourceItem[]>([
    { resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: 2 },
    { resourceId: 'res-mic-wireless', resourceName: 'Wireless UHF Lavalier & Handheld Mics', quantity: 2 },
    { resourceId: 'res-seating-banquet', resourceName: 'Modular Conference Chairs & Foldable Tables', quantity: 100 }
  ]);

  // Pre-flight check state
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [preflightEvaluation, setPreflightEvaluation] = useState<AiEvaluation | null>(null);

  // Submission pipeline state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStep, setSubmissionStep] = useState<number>(0);

  // Handle Natural Language Extraction
  const handleParseNatural = async (promptToParse?: string) => {
    const text = promptToParse || naturalPrompt;
    if (!text.trim()) return;

    setIsParsingAi(true);
    setParseNotice(null);
    try {
      const res = await parseNaturalLanguageRequest(text);
      if (res.success && res.parsed) {
        const p = res.parsed;
        if (p.eventName) setEventName(p.eventName);
        if (p.department) setDepartment(p.department);
        if (p.eventDate) setEventDate(p.eventDate);
        if (p.startTime) setStartTime(p.startTime);
        if (p.endTime) setEndTime(p.endTime);
        if (p.venue) setVenue(p.venue);
        if (p.expectedAttendees) setExpectedAttendees(p.expectedAttendees);
        if (p.additionalInstructions) setAdditionalInstructions(p.additionalInstructions);
        if (p.priority && ['standard', 'high', 'urgent'].includes(p.priority)) {
          setPriority(p.priority);
        }
        if (Array.isArray(p.resources) && p.resources.length > 0) {
          setSelectedResources(p.resources);
        }

        setParseNotice(`AI parsed successfully using ${res.agentModel || 'Gemini 3.8 Flash'}. Form populated.`);
      }
    } catch (err: any) {
      setParseNotice(`Notice: Auto-extraction applied standard template.`);
    } finally {
      setIsParsingAi(false);
    }
  };

  // Quick prompt presets
  const samplePrompts = [
    "Need 2 projectors, 4 mics, and 150 chairs for the CS Department Annual Hackathon at Newton Hall on Nov 26th from 2 PM to 6 PM with livestream cameras",
    "Department faculty meeting in Ada Lovelace Seminar Hall on Nov 24 from 10:00 to 11:30 for 30 attendees with 1 laser projector and 2 mics",
    "Robotics Club demo day in Alan Turing Grand Auditorium on Nov 28 from 13:00 to 18:00 for 250 students with dual 4K projectors and recording cameras"
  ];

  // Resource items handlers
  const handleAddResource = (resourceId: string) => {
    const target = resources.find(r => r.id === resourceId);
    if (!target) return;
    if (selectedResources.some(r => r.resourceId === resourceId)) return;

    setSelectedResources([...selectedResources, {
      resourceId: target.id,
      resourceName: target.name,
      quantity: 1
    }]);
  };

  const handleUpdateQuantity = (resourceId: string, qty: number) => {
    setSelectedResources(selectedResources.map(item => 
      item.resourceId === resourceId ? { ...item, quantity: Math.max(1, qty) } : item
    ));
  };

  const handleRemoveResource = (resourceId: string) => {
    setSelectedResources(selectedResources.filter(item => item.resourceId !== resourceId));
  };

  // Run Pre-flight Conflict Check
  const handlePreflightCheck = async () => {
    if (!eventName.trim()) {
      alert('Please enter an event name first');
      return;
    }

    setIsCheckingConflicts(true);
    setPreflightEvaluation(null);

    try {
      const draftReq = {
        eventName,
        department,
        eventDate,
        startTime,
        endTime,
        venue,
        expectedAttendees,
        resources: selectedResources,
        additionalInstructions
      };

      const res = await evaluateRequestWithAgent(draftReq);
      setPreflightEvaluation(res.evaluation);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingConflicts(false);
    }
  };

  // Submit via Autonomous 12-Step Agent Pipeline
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventName.trim()) return;

    setIsSubmitting(true);
    setSubmissionStep(1);

    const payload: Partial<EventResourceRequest> = {
      eventName,
      department,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      requesterRole: currentUser.role,
      eventDate,
      startTime,
      endTime,
      venue,
      expectedAttendees,
      resources: selectedResources,
      priority,
      additionalInstructions: additionalInstructions || 'Standard reservation',
      status: 'pending'
    };

    try {
      // Step through animation visually
      for (let i = 2; i <= 12; i++) {
        await new Promise(r => setTimeout(r, 120));
        setSubmissionStep(i);
      }

      const res = await executeAutonomousWorkflow(payload);
      onRequestSubmitted(res.request);
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Banner with Natural Language AI Assistant */}
      <div className="p-6 rounded-2xl liquid-glass border border-blue-200/60 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600/10 text-blue-600 flex items-center justify-center">
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <h2 className="text-sm font-semibold text-slate-900">AI Natural Language Assistant</h2>
          <span className="text-[10px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-md font-mono">
            gemini-3.8-flash
          </span>
        </div>

        <p className="text-xs text-slate-600 mb-3">
          Describe your campus event in everyday language. The autonomous agent extracts the schedule, attendee count, venue, and equipment inventory instantly.
        </p>

        <div className="space-y-2">
          <div className="relative">
            <textarea
              rows={2}
              value={naturalPrompt}
              onChange={(e) => setNaturalPrompt(e.target.value)}
              placeholder="e.g. Need 2 projectors, 4 mics, and 120 chairs for the CS Department Annual Hackathon at Newton Hall on Nov 25th from 2 PM to 6 PM with audio recording"
              className="w-full text-xs p-3 pr-24 rounded-xl bg-white/90 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder:text-slate-400 transition-all resize-none"
            />
            <button
              type="button"
              onClick={() => handleParseNatural()}
              disabled={isParsingAi || !naturalPrompt.trim()}
              className="absolute right-2.5 bottom-3.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isParsingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>Extract Details</span>
            </button>
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <span className="text-slate-400">Try sample prompt:</span>
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setNaturalPrompt(p);
                  handleParseNatural(p);
                }}
                className="px-2 py-0.5 rounded-md bg-white/70 hover:bg-white text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-colors truncate max-w-xs cursor-pointer"
              >
                {idx === 0 ? 'Hackathon at Newton' : idx === 1 ? 'Faculty Meeting' : 'Robotics Demo'}
              </button>
            ))}
          </div>

          {parseNotice && (
            <p className="text-xs text-blue-700 bg-blue-50/70 p-2 rounded-lg border border-blue-200/50">
              {parseNotice}
            </p>
          )}
        </div>
      </div>

      {/* Main Request Form */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-6">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div>
            <h1 className="text-base font-semibold text-slate-900">Event Resource Request Form</h1>
            <p className="text-xs text-slate-500">Autonomous availability screening and conflict routing</p>
          </div>
          <div className="text-xs text-slate-500">
            Requester: <span className="font-medium text-slate-800">{currentUser.name}</span>
          </div>
        </div>

        {/* Section 1: Basic Event Details */}
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">01. Event Overview</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Event Name *
              </label>
              <input
                type="text"
                required
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                placeholder="e.g. Annual Autonomous Robotics Showcase"
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Department / Student Organization *
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              >
                <option value="School of Engineering">School of Engineering</option>
                <option value="Department of Computer Science">Department of Computer Science</option>
                <option value="Student Union & Computing Society">Student Union & Computing Society</option>
                <option value="School of Management">School of Management</option>
                <option value="Department of Physics & Astronomy">Department of Physics & Astronomy</option>
                <option value="Robotics & Autonomous Systems Lab">Robotics & Autonomous Systems Lab</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Priority Tier
              </label>
              <div className="flex items-center gap-2">
                {(['standard', 'high', 'urgent'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 text-xs rounded-lg capitalize font-medium transition-colors cursor-pointer ${
                      priority === p 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-white/80 text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Section 2: Date, Time & Venue */}
        <div className="space-y-4 pt-4 border-t border-slate-200/60">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">02. Schedule & Venue</h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Event Date *
              </label>
              <input
                type="date"
                required
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                End Time *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Expected Attendees *
              </label>
              <input
                type="number"
                min={5}
                max={500}
                required
                value={expectedAttendees}
                onChange={e => setExpectedAttendees(Number(e.target.value))}
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 font-mono"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Campus Venue *
              </label>
              <select
                value={venue}
                onChange={e => setVenue(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
              >
                <option value="Alan Turing Grand Auditorium">Alan Turing Grand Auditorium (Capacity: 350)</option>
                <option value="Newton Science Lecture Theater">Newton Science Lecture Theater (Capacity: 180)</option>
                <option value="Ada Lovelace Collaborative Seminar Hall">Ada Lovelace Collaborative Seminar Hall (Capacity: 90)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 3: Requested Resources & Inventory */}
        <div className="space-y-4 pt-4 border-t border-slate-200/60">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">03. Equipment & Resources</h3>
            
            {/* Quick add dropdown */}
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddResource(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="text-xs p-1.5 rounded-lg bg-white/90 border border-slate-200 text-slate-700 cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>+ Add equipment from catalog</option>
                {resources.filter(r => r.type === 'equipment').map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.availableQuantity} available)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            {selectedResources.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 bg-slate-50/60 rounded-xl text-center">
                No equipment requested yet. Add from the catalog dropdown above.
              </p>
            ) : (
              selectedResources.map(item => {
                const resItem = resources.find(r => r.id === item.resourceId);
                return (
                  <div 
                    key={item.resourceId}
                    className="p-3 rounded-xl bg-white/70 border border-slate-200/70 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900">{item.resourceName}</p>
                      <p className="text-[11px] text-slate-500">
                        {resItem ? `${resItem.category} · In warehouse: ${resItem.availableQuantity} unreserved` : 'Campus inventory item'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-slate-500">Qty:</span>
                        <input
                          type="number"
                          min={1}
                          max={resItem ? resItem.totalQuantity : 500}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQuantity(item.resourceId, Number(e.target.value))}
                          className="w-16 text-xs p-1 text-center font-mono rounded-lg bg-white border border-slate-200"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveResource(item.resourceId)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove resource"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Section 4: Instructions */}
        <div className="space-y-2 pt-4 border-t border-slate-200/60">
          <label className="block text-xs font-medium text-slate-700">
            Additional Instructions or Audio/Visual Technical Requirements
          </label>
          <textarea
            rows={2}
            value={additionalInstructions}
            onChange={e => setAdditionalInstructions(e.target.value)}
            placeholder="e.g. Need podium connection for MacBook Pro USB-C, extra technician check at 13:30, ADA ramp access"
            className="w-full text-xs p-2.5 rounded-xl bg-white/80 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
          />
        </div>

        {/* Pre-flight conflict inspection results if triggered */}
        {preflightEvaluation && (
          <div className="p-4 rounded-xl liquid-glass border border-slate-300 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-semibold text-slate-900">Pre-Flight Conflict Report</span>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                preflightEvaluation.recommendation === 'RECOMMEND_APPROVE' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {preflightEvaluation.recommendation.replace('_', ' ')} ({preflightEvaluation.confidenceScore}% confidence)
              </span>
            </div>

            <p className="text-xs text-slate-600">{preflightEvaluation.summary}</p>

            {preflightEvaluation.conflicts.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-red-700">Detected Constraints:</p>
                {preflightEvaluation.conflicts.map((c, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-red-50/80 border border-red-200/60 text-xs text-red-800">
                    <span className="font-semibold">{c.title}:</span> {c.description}
                  </div>
                ))}
              </div>
            )}

            {preflightEvaluation.alternatives.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-blue-700">Autonomous Agent Recommendations:</p>
                {preflightEvaluation.alternatives.map((alt, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-blue-50/80 border border-blue-200/60 text-xs text-blue-900">
                    <span className="font-semibold">{alt.suggestion}</span> — {alt.rationale}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200/60">
          <button
            type="button"
            onClick={handlePreflightCheck}
            disabled={isCheckingConflicts || isSubmitting}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isCheckingConflicts ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
            <span>Run Pre-Flight Conflict Check</span>
          </button>

          <button
            type="submit"
            disabled={isSubmitting || !eventName.trim()}
            className="w-full sm:w-auto px-5 py-2.5 text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Submit to Autonomous Agent</span>
          </button>
        </div>

      </form>

      {/* Submission Modal: 12-Step Autonomous Workflow In Action */}
      {isSubmitting && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full liquid-glass rounded-2xl p-6 shadow-2xl border border-white/80 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Autonomous Workflow Pipeline</h3>
                <p className="text-xs text-slate-500">Step {submissionStep} of 12 executing</p>
              </div>
            </div>

            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-200 rounded-full"
                style={{ width: `${(submissionStep / 12) * 100}%` }}
              />
            </div>

            <div className="text-xs text-slate-600 font-medium">
              {submissionStep === 1 && "Ingesting event parameters into central registry..."}
              {submissionStep === 2 && "Analyzing natural request entities with Gemini 3.8 Flash..."}
              {submissionStep === 3 && "Verifying mandatory safety & time thresholds..."}
              {submissionStep === 4 && "Checking real-time warehouse inventory pools..."}
              {submissionStep === 5 && "Auditing schedule calendar for concurrent overlaps..."}
              {submissionStep === 6 && "Executing conflict detection matrix..."}
              {submissionStep === 7 && "Synthesizing optimal equipment alternatives..."}
              {submissionStep === 8 && "Synthesizing AI recommendation & confidence score..."}
              {submissionStep === 9 && "Routing request to Department Administrator queue..."}
              {submissionStep === 10 && "Committing status PENDING to system ledger..."}
              {submissionStep === 11 && "Generating user notifications and email alert..."}
              {submissionStep === 12 && "Done! Finalizing immutable audit record..."}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
