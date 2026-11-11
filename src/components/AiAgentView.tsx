import React, { useState } from 'react';
import { 
  Cpu, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Clock, 
  Play, 
  RotateCcw,
  Check,
  FileCheck
} from 'lucide-react';
import { CampusResource, EventResourceRequest, AiEvaluation } from '../types';
import { evaluateRequestWithAgent, executeAutonomousWorkflow } from '../services/api';

interface AiAgentViewProps {
  resources: CampusResource[];
  requests: EventResourceRequest[];
  onWorkflowCompleted: (req: EventResourceRequest) => void;
}

export const AiAgentView: React.FC<AiAgentViewProps> = ({
  resources,
  requests,
  onWorkflowCompleted
}) => {
  // Simulator scenario selection
  const [activeScenario, setActiveScenario] = useState<'clean' | 'conflict_venue' | 'conflict_inventory' | 'custom'>('clean');
  
  // Custom scenario fields
  const [testEventName, setTestEventName] = useState('AI Robotics Hackathon & Keynote');
  const [testVenue, setTestVenue] = useState('Alan Turing Grand Auditorium');
  const [testDate, setTestDate] = useState('2026-11-20');
  const [testStart, setTestStart] = useState('14:00');
  const [testEnd, setTestEnd] = useState('17:00');
  const [testAttendees, setTestAttendees] = useState(200);
  const [testProjectors, setTestProjectors] = useState(2);
  const [testMics, setTestMics] = useState(4);

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [simulationResult, setSimulationResult] = useState<{
    evaluation: AiEvaluation;
    request: EventResourceRequest;
  } | null>(null);

  // Workflow 12 Steps Definition
  const workflowStepLabels = [
    { num: 1, title: 'Receive Resource Request', desc: 'Ingests structured or natural language event payload' },
    { num: 2, title: 'Parse Request using AI', desc: 'Extracts entities, resources, timestamps via Gemini 3.8 Flash' },
    { num: 3, title: 'Validate Required Information', desc: 'Ensures ISO compliance, valid date-times & requester credentials' },
    { num: 4, title: 'Check Resource Inventory', desc: 'Scans central campus warehouse reserves & maintenance locks' },
    { num: 5, title: 'Check Date & Time Availability', desc: 'Audits university calendar for overlapping building bookings' },
    { num: 6, title: 'Detect Scheduling Conflicts', desc: 'Computes venue overlaps, capacity limits, and inventory deficits' },
    { num: 7, title: 'Suggest Alternatives if Unavailable', desc: 'Synthesizes alternative halls, shifted timeslots, or equipment' },
    { num: 8, title: 'Generate AI Recommendation', desc: 'Formulates RECOMMEND_APPROVE, REVISE, or REJECT with confidence' },
    { num: 9, title: 'Submit to Authorized Approver', desc: 'Routes to Department Administrator & Resource Manager queues' },
    { num: 10, title: 'Update Request Status', desc: 'Commits state changes to system registry' },
    { num: 11, title: 'Notify Requester', desc: 'Dispatches real-time confirmation and feedback alerts' },
    { num: 12, title: 'Maintain Activity Log', desc: 'Appends audit record to immutable historical event log' }
  ];

  // Pre-load preset scenarios
  const applyScenario = (type: 'clean' | 'conflict_venue' | 'conflict_inventory' | 'custom') => {
    setActiveScenario(type);
    setSimulationResult(null);
    setCurrentStepIndex(0);

    if (type === 'clean') {
      setTestEventName('Cybersecurity Research Colloquium');
      setTestVenue('Newton Science Lecture Theater');
      setTestDate('2026-11-29');
      setTestStart('13:00');
      setTestEnd('16:00');
      setTestAttendees(90);
      setTestProjectors(1);
      setTestMics(2);
    } else if (type === 'conflict_venue') {
      // Overlaps with REQ-2026-1042 on 2026-11-20 at Turing Auditorium!
      setTestEventName('Biomedical Engineering Symposium');
      setTestVenue('Alan Turing Grand Auditorium');
      setTestDate('2026-11-20');
      setTestStart('14:00');
      setTestEnd('16:30');
      setTestAttendees(150);
      setTestProjectors(2);
      setTestMics(4);
    } else if (type === 'conflict_inventory') {
      // Requests 8 projectors when only 4 are unallocated
      setTestEventName('Multi-Room Media Production Showcase');
      setTestVenue('Ada Lovelace Collaborative Seminar Hall');
      setTestDate('2026-11-24');
      setTestStart('09:00');
      setTestEnd('12:00');
      setTestAttendees(70);
      setTestProjectors(8); // Exceeds total pool!
      setTestMics(12);
    }
  };

  // Run the 12-Step Autonomous Simulation
  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    const testPayload: Partial<EventResourceRequest> = {
      eventName: testEventName,
      department: 'School of Engineering',
      requesterName: 'Alex Chen',
      requesterEmail: 'alex.chen@campus.edu',
      requesterRole: 'student',
      eventDate: testDate,
      startTime: testStart,
      endTime: testEnd,
      venue: testVenue,
      expectedAttendees: testAttendees,
      resources: [
        { resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: testProjectors },
        { resourceId: 'res-mic-wireless', resourceName: 'Wireless UHF Lavalier & Handheld Mics', quantity: testMics }
      ],
      additionalInstructions: 'Generated via Autonomous Agent Simulation Workbench.'
    };

    // Step through the 12 steps visually with realistic pacing
    for (let step = 1; step <= 12; step++) {
      setCurrentStepIndex(step);
      await new Promise(r => setTimeout(r, 140));
    }

    try {
      const res = await executeAutonomousWorkflow(testPayload);
      setSimulationResult({
        evaluation: res.request.aiEvaluation!,
        request: res.request
      });
      onWorkflowCompleted(res.request);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
          <span>CampusFlow AI</span>
          <span aria-hidden="true">·</span>
          <span>Autonomous Triage Engine</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono text-blue-600">Gemini 3.8 Flash</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Autonomous Agent Console & Workflow Pipeline
        </h1>
        <p className="text-xs text-slate-500">
          Inspect and test how the AI orchestrates requests, verifies inventory limits, detects calendar double-bookings, and routes proposals.
        </p>
      </div>

      {/* Main 2-Column Split: Simulation Studio + Live 12-Step Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Interactive Scenario Workbench (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-semibold text-slate-900">Simulation Scenarios</h2>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Interactive Testbed</span>
            </div>

            {/* Scenario buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => applyScenario('clean')}
                className={`p-2.5 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                  activeScenario === 'clean' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-medium' 
                    : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-900">Nominal</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Zero conflicts, instant pass</div>
              </button>

              <button
                type="button"
                onClick={() => applyScenario('conflict_venue')}
                className={`p-2.5 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                  activeScenario === 'conflict_venue' 
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium' 
                    : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-900">Venue Overlap</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Auditorium collision</div>
              </button>

              <button
                type="button"
                onClick={() => applyScenario('conflict_inventory')}
                className={`p-2.5 rounded-xl text-left border text-xs transition-colors cursor-pointer ${
                  activeScenario === 'conflict_inventory' 
                    ? 'bg-red-50 border-red-300 text-red-900 font-medium' 
                    : 'bg-white/70 border-slate-200 hover:bg-white text-slate-700'
                }`}
              >
                <div className="font-semibold text-slate-900">Inventory Cap</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Exceeds warehouse pool</div>
              </button>
            </div>

            {/* Test Request Parameters */}
            <div className="space-y-3 pt-2 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Test Event Name</label>
                <input
                  type="text"
                  value={testEventName}
                  onChange={e => setTestEventName(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Date</label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={e => setTestDate(e.target.value)}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Timeslot</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={testStart}
                      onChange={e => setTestStart(e.target.value)}
                      className="w-1/2 p-2 rounded-xl bg-white border border-slate-200 font-mono text-[11px]"
                    />
                    <input
                      type="time"
                      value={testEnd}
                      onChange={e => setTestEnd(e.target.value)}
                      className="w-1/2 p-2 rounded-xl bg-white border border-slate-200 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">Venue</label>
                <select
                  value={testVenue}
                  onChange={e => setTestVenue(e.target.value)}
                  className="w-full p-2 rounded-xl bg-white border border-slate-200 text-slate-900"
                >
                  <option value="Alan Turing Grand Auditorium">Alan Turing Grand Auditorium (350)</option>
                  <option value="Newton Science Lecture Theater">Newton Science Lecture Theater (180)</option>
                  <option value="Ada Lovelace Collaborative Seminar Hall">Ada Lovelace Collaborative Seminar Hall (90)</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Attendees</label>
                  <input
                    type="number"
                    value={testAttendees}
                    onChange={e => setTestAttendees(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">4K Projectors</label>
                  <input
                    type="number"
                    value={testProjectors}
                    onChange={e => setTestProjectors(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Wireless Mics</label>
                  <input
                    type="number"
                    value={testMics}
                    onChange={e => setTestMics(Number(e.target.value))}
                    className="w-full p-2 rounded-xl bg-white border border-slate-200 font-mono text-center"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full mt-3 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isSimulating ? 'Autonomous Pipeline Running...' : 'Execute 12-Step Autonomous Workflow'}</span>
              </button>
            </div>
          </div>

          {/* Policy Compliance Box */}
          <div className="p-4 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-900 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Campus Policy Enforcement Guardrails</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Autonomous execution enforces strict institutional rules: fire safety codes, noise curfews, advance booking notice, and mandatory human sign-off authorization.
            </p>
          </div>
        </div>

        {/* Right Column: 12-Step Autonomous Workflow Execution Pipeline (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl liquid-glass border border-slate-200/60 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div>
                <h2 className="text-xs font-semibold text-slate-900">Autonomous Execution Pipeline</h2>
                <p className="text-[11px] text-slate-500">End-to-end 12-step resource routing architecture</p>
              </div>
              <span className={`text-[11px] font-mono font-medium px-2 py-0.5 rounded-md ${
                isSimulating ? 'bg-blue-100 text-blue-800 animate-pulse' :
                simulationResult ? 'bg-emerald-100 text-emerald-800' :
                'bg-slate-100 text-slate-600'
              }`}>
                {isSimulating ? `Executing Step ${currentStepIndex}/12` : simulationResult ? 'Execution Complete' : 'Ready'}
              </span>
            </div>

            {/* Step-by-Step Execution List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {workflowStepLabels.map((s) => {
                const isPassed = currentStepIndex > s.num || (simulationResult && !isSimulating);
                const isCurrent = currentStepIndex === s.num && isSimulating;

                return (
                  <div
                    key={s.num}
                    className={`p-3 rounded-xl border text-xs transition-all flex items-start gap-3 ${
                      isCurrent 
                        ? 'bg-blue-50/90 border-blue-300 shadow-xs' 
                        : isPassed 
                        ? 'bg-white/80 border-slate-200/80' 
                        : 'bg-slate-50/40 border-slate-200/40 opacity-60'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-[11px] font-bold font-mono transition-colors ${
                      isPassed 
                        ? 'bg-emerald-600 text-white' 
                        : isCurrent 
                        ? 'bg-blue-600 text-white animate-pulse' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {isPassed ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : s.num}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${isCurrent ? 'text-blue-900' : 'text-slate-900'}`}>
                          {s.title}
                        </span>
                        {isPassed && (
                          <span className="text-[10px] text-emerald-600 font-mono">Passed</span>
                        )}
                        {isCurrent && (
                          <span className="text-[10px] text-blue-600 font-mono">Processing...</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulation Final Evaluation Report */}
            {simulationResult && (
              <div className="mt-4 p-4 rounded-xl liquid-glass border border-slate-300 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-semibold text-slate-900">Agent Recommendation Decision</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    simulationResult.evaluation.recommendation === 'RECOMMEND_APPROVE' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : simulationResult.evaluation.recommendation === 'RECOMMEND_REVISE' 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {simulationResult.evaluation.recommendation.replace('_', ' ')} ({simulationResult.evaluation.confidenceScore}%)
                  </span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {simulationResult.evaluation.summary}
                </p>

                {simulationResult.evaluation.conflicts.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-red-700">Flagged Conflicts:</span>
                    {simulationResult.evaluation.conflicts.map((c, i) => (
                      <div key={i} className="text-xs text-red-800 bg-red-50 p-2 rounded-lg border border-red-200/60">
                        <strong>{c.title}:</strong> {c.description}
                      </div>
                    ))}
                  </div>
                )}

                {simulationResult.evaluation.alternatives.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-blue-700">Synthesized Alternatives:</span>
                    {simulationResult.evaluation.alternatives.map((a, i) => (
                      <div key={i} className="text-xs text-blue-900 bg-blue-50 p-2 rounded-lg border border-blue-200/60">
                        <strong>{a.suggestion}</strong> — {a.rationale}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

    </div>
  );
};
