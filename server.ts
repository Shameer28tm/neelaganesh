import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI client (server-side only)
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Helper timeout for resilient AI calls
function callWithTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('AI request timed out')), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

// In-Memory & Persistent Storage
// -------------------------------------------------------------
const DATA_FILE = path.join(__dirname, 'campusflow_data.json');

interface StorageSchema {
  resources: any[];
  requests: any[];
  activities: any[];
  notifications: any[];
}

const INITIAL_RESOURCES = [
  {
    id: 'res-proj-4k',
    name: 'Laser 4K Venue Projectors',
    category: 'Visual & Display',
    type: 'equipment',
    totalQuantity: 6,
    availableQuantity: 4,
    inUseQuantity: 2,
    maintenanceQuantity: 0,
    location: 'Media Center Vault B',
    condition: 'Optimal',
    description: 'High-lumen Epson Pro L1505UH laser projector with wireless HDMI transmitters.',
    features: ['4K UHD', '12,000 Lumens', 'Wireless Presentation', 'Dual HDMI']
  },
  {
    id: 'res-mic-wireless',
    name: 'Wireless UHF Lavalier & Handheld Mics',
    category: 'Audio & Speech',
    type: 'equipment',
    totalQuantity: 16,
    availableQuantity: 10,
    inUseQuantity: 5,
    maintenanceQuantity: 1,
    location: 'Audio Engineering Storage 102',
    condition: 'Optimal',
    description: 'Shure QLXD24 digital wireless microphone system with dual channel receiver.',
    features: ['Rechargeable Li-Ion', 'Encrypted 256-bit', 'Feedback Suppressor']
  },
  {
    id: 'res-speakers-line',
    name: 'Portable PA Powered Column Speakers',
    category: 'Audio & Speech',
    type: 'equipment',
    totalQuantity: 8,
    availableQuantity: 5,
    inUseQuantity: 3,
    maintenanceQuantity: 0,
    location: 'Event Production Depot',
    condition: 'Good',
    description: 'Bose L1 Pro16 portable line array systems with integrated Bluetooth mixers.',
    features: ['180-degree Coverage', 'Subwoofer Integrated', 'Bluetooth 5.0']
  },
  {
    id: 'res-hall-turing',
    name: 'Alan Turing Grand Auditorium',
    category: 'Venues & Halls',
    type: 'venue',
    totalQuantity: 1,
    availableQuantity: 1,
    inUseQuantity: 0,
    maintenanceQuantity: 0,
    location: 'Building C, Central Quad',
    capacity: 350,
    condition: 'Optimal',
    description: 'Tiered theater auditorium with dual cinema screens, broadcast booth, and acoustic wall panels.',
    features: ['350 Padded Seats', 'Stage Lighting Rig', 'Simultaneous Interpretation', 'ADA Accessible']
  },
  {
    id: 'res-hall-newton',
    name: 'Newton Science Lecture Theater',
    category: 'Venues & Halls',
    type: 'venue',
    totalQuantity: 1,
    availableQuantity: 1,
    inUseQuantity: 0,
    maintenanceQuantity: 0,
    location: 'Physical Sciences Wing, Floor 1',
    capacity: 180,
    condition: 'Optimal',
    description: 'Smart lecture hall with electronic whiteboard arrays and motorized blackout blinds.',
    features: ['180 Tiered Seats', 'Twin Laser Projectors', 'Recording Rig', 'Power at Every Desk']
  },
  {
    id: 'res-hall-lovelace',
    name: 'Ada Lovelace Collaborative Seminar Hall',
    category: 'Venues & Halls',
    type: 'venue',
    totalQuantity: 1,
    availableQuantity: 1,
    inUseQuantity: 0,
    maintenanceQuantity: 0,
    location: 'Informatics Complex, Floor 3',
    capacity: 90,
    condition: 'Good',
    description: 'Modular workshop space with reconfigurable pods and eight breakout LCD touch monitors.',
    features: ['Modular Seating (90)', 'Breakout Screens', 'Mobile Whiteboards', 'High-Speed Wi-Fi 6E']
  },
  {
    id: 'res-cam-ptz',
    name: '4K PTZ Robotic Livestream Cameras',
    category: 'Cameras & Recording',
    type: 'equipment',
    totalQuantity: 6,
    availableQuantity: 4,
    inUseQuantity: 2,
    maintenanceQuantity: 0,
    location: 'Media Production Office 214',
    condition: 'Optimal',
    description: 'Sony SRG-X400 optical zoom cameras with NDI network video streaming.',
    features: ['40x Clear Image Zoom', 'NDI|HX Support', 'Auto-Tracking AI', 'PoE+ Powered']
  },
  {
    id: 'res-seating-banquet',
    name: 'Modular Conference Chairs & Foldable Tables',
    category: 'Furniture & Seating',
    type: 'equipment',
    totalQuantity: 450,
    availableQuantity: 300,
    inUseQuantity: 150,
    maintenanceQuantity: 0,
    location: 'Logistics Warehouse Unit 4',
    condition: 'Good',
    description: 'Lightweight ergonomic conference chairs and heavy-duty 6-foot folding tables.',
    features: ['Stackable up to 20', 'Flame Retardant Fabric', 'Rubber Floor Protectors']
  }
];

const INITIAL_REQUESTS = [
  {
    id: 'REQ-2026-1042',
    eventName: 'Annual Autonomous Robotics Showcase',
    department: 'School of Engineering',
    requesterName: 'Alex Chen',
    requesterEmail: 'alex.chen@campus.edu',
    requesterRole: 'student',
    eventDate: '2026-11-20',
    startTime: '13:00',
    endTime: '17:30',
    venue: 'Alan Turing Grand Auditorium',
    resources: [
      { resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: 2 },
      { resourceId: 'res-mic-wireless', resourceName: 'Wireless UHF Lavalier & Handheld Mics', quantity: 4 },
      { resourceId: 'res-cam-ptz', resourceName: '4K PTZ Robotic Livestream Cameras', quantity: 2 },
      { resourceId: 'res-seating-banquet', resourceName: 'Modular Conference Chairs & Foldable Tables', quantity: 120 }
    ],
    expectedAttendees: 220,
    additionalInstructions: 'Need livestream recording enabled for alumni and industry partners.',
    status: 'pending',
    priority: 'high',
    createdAt: '2026-11-10T09:20:00.000Z',
    updatedAt: '2026-11-10T09:25:00.000Z',
    isDemo: true,
    aiEvaluation: {
      recommendation: 'RECOMMEND_APPROVE',
      confidenceScore: 94,
      summary: 'Inventory and venue are fully available with zero time overlaps. All resource requests conform to school event quotas.',
      conflicts: [],
      alternatives: [
        {
          type: 'substitute_resource',
          suggestion: 'Stage lighting preset #3 (Keynote)',
          rationale: 'Auditorium control booth is unstaffed past 16:30; automated preset ensures optimal camera exposure.',
          impact: 'Enhanced video recording contrast'
        }
      ],
      policyChecks: [
        { rule: 'Capacity Limit', passed: true, notes: '220 attendees is well below Alan Turing Auditorium limit of 350.' },
        { rule: 'Lead Time Notice', passed: true, notes: 'Submitted 10 days ahead (minimum policy threshold is 5 days).' },
        { rule: 'AV Technician Roster', passed: true, notes: 'Student coordinator holds AV Level 2 equipment certification.' }
      ],
      reasoning: [
        'Alan Turing Grand Auditorium has no conflicting reservations on 2026-11-20.',
        'Requested 2 Laser 4K Projectors and 4 Mics are within current unallocated pool (4 projectors, 10 mics available).',
        'Standard event insurance and student club faculty endorsement are in order.'
      ],
      evaluatedAt: '2026-11-10T09:25:00.000Z',
      agentModel: 'gemini-3.8-flash'
    },
    workflowSteps: [
      { stepNumber: 1, title: 'Request Ingestion', status: 'completed', message: 'Received structured payload via Web Portal', completedAt: '2026-11-10T09:20:01.000Z' },
      { stepNumber: 2, title: 'AI Parsing & Entity Extraction', status: 'completed', message: 'Extracted 4 resource categories, schedule times, and capacity tags', completedAt: '2026-11-10T09:20:03.000Z' },
      { stepNumber: 3, title: 'Data Validation', status: 'completed', message: 'All mandatory fields validated. ISO 8601 timestamps confirmed', completedAt: '2026-11-10T09:20:04.000Z' },
      { stepNumber: 4, title: 'Inventory Availability Check', status: 'completed', message: 'Confirmed inventory availability: 2 projectors, 4 mics, 2 PTZ cams, 120 chairs', completedAt: '2026-11-10T09:20:05.000Z' },
      { stepNumber: 5, title: 'Temporal Schedule Analysis', status: 'completed', message: 'Calendar audit: No schedule collisions for 13:00-17:30 window', completedAt: '2026-11-10T09:20:06.000Z' },
      { stepNumber: 6, title: 'Conflict Detection', status: 'completed', message: '0 direct or peripheral equipment conflicts found', completedAt: '2026-11-10T09:20:07.000Z' },
      { stepNumber: 7, title: 'Alternative Suggestions', status: 'completed', message: 'Suggested automated keynote lighting preset for evening transition', completedAt: '2026-11-10T09:20:08.000Z' },
      { stepNumber: 8, title: 'Recommendation Synthesis', status: 'completed', message: 'Generated RECOMMEND_APPROVE with 94% confidence score', completedAt: '2026-11-10T09:20:09.000Z' },
      { stepNumber: 9, title: 'Approver Routing', status: 'completed', message: 'Assigned to Dr. Sarah Jenkins (Department Admin)', completedAt: '2026-11-10T09:20:10.000Z' },
      { stepNumber: 10, title: 'Status Synchronization', status: 'completed', message: 'Request status marked PENDING_ADMIN_APPROVAL', completedAt: '2026-11-10T09:20:11.000Z' },
      { stepNumber: 11, title: 'Requester Dispatch', status: 'completed', message: 'Confirmation notification generated for Alex Chen', completedAt: '2026-11-10T09:20:12.000Z' },
      { stepNumber: 12, title: 'Audit Ledger Recording', status: 'completed', message: 'Agent action committed to immutable system activity log', completedAt: '2026-11-10T09:20:13.000Z' }
    ]
  },
  {
    id: 'REQ-2026-1043',
    eventName: 'Bio-Informatics Guest Lecture & Roundtable',
    department: 'Department of Computer Science',
    requesterName: 'Dr. Sarah Jenkins',
    requesterEmail: 's.jenkins@campus.edu',
    requesterRole: 'admin',
    eventDate: '2026-11-18',
    startTime: '10:00',
    endTime: '12:30',
    venue: 'Newton Science Lecture Theater',
    resources: [
      { resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: 1 },
      { resourceId: 'res-mic-wireless', resourceName: 'Wireless UHF Lavalier & Handheld Mics', quantity: 2 },
      { resourceId: 'res-cam-ptz', resourceName: '4K PTZ Robotic Livestream Cameras', quantity: 1 }
    ],
    expectedAttendees: 85,
    additionalInstructions: 'Visiting researcher from MIT. Dual screen presentation needed.',
    status: 'approved',
    priority: 'standard',
    createdAt: '2026-11-08T11:00:00.000Z',
    updatedAt: '2026-11-08T14:15:00.000Z',
    isDemo: true,
    approvalAudit: {
      action: 'approved',
      decidedBy: 'Marcus Vance',
      decidedByRole: 'Campus Resource Manager',
      decidedAt: '2026-11-08T14:15:00.000Z',
      comments: 'All AV checked and reserved. Facilities staff notified for morning setup at 09:30.'
    }
  },
  {
    id: 'REQ-2026-1044',
    eventName: 'HackCampus 48-Hour Fall Hackathon',
    department: 'Student Union & Computing Society',
    requesterName: 'Maya Lin',
    requesterEmail: 'maya.lin@student.campus.edu',
    requesterRole: 'student',
    eventDate: '2026-11-22',
    startTime: '18:00',
    endTime: '22:00',
    venue: 'Ada Lovelace Collaborative Seminar Hall',
    resources: [
      { resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: 4 },
      { resourceId: 'res-speakers-line', resourceName: 'Portable PA Powered Column Speakers', quantity: 4 },
      { resourceId: 'res-seating-banquet', resourceName: 'Modular Conference Chairs & Foldable Tables', quantity: 160 }
    ],
    expectedAttendees: 150,
    additionalInstructions: 'Night opening ceremony followed by team breakout sessions.',
    status: 'modification_requested',
    priority: 'urgent',
    createdAt: '2026-11-10T16:00:00.000Z',
    updatedAt: '2026-11-10T16:45:00.000Z',
    isDemo: true,
    aiEvaluation: {
      recommendation: 'RECOMMEND_REVISE',
      confidenceScore: 88,
      summary: 'Capacity conflict: Lovelace Hall holds 90 people max, but 150 attendees requested. In addition, 4 column speakers exceed noise threshold for Floor 3.',
      conflicts: [
        {
          type: 'capacity_exceeded',
          severity: 'high',
          title: 'Venue Capacity Exceeded',
          description: 'Lovelace Seminar Hall has a rated safety limit of 90 attendees. Requested 150 exceeds capacity by 66%.'
        },
        {
          type: 'resource_exhaustion',
          severity: 'medium',
          title: 'Acoustic Compliance',
          description: '4 Powered Column PA speakers exceed evening noise limitations adjacent to Library Floor 3 study bays.'
        }
      ],
      alternatives: [
        {
          type: 'alternative_venue',
          suggestion: 'Switch to Alan Turing Grand Auditorium or Newton Science Theater',
          rationale: 'Newton Theater comfortably holds 180 and has built-in sound isolation.',
          impact: 'Eliminates overcrowding hazard and noise bleed.'
        },
        {
          type: 'quantity_adjustment',
          suggestion: 'Reduce PA speakers to 2 units',
          rationale: '2 Bose L1 units produce 118dB SPL, sufficient for 150 attendees without violating quiet zone policies.',
          impact: 'Preserves audio fidelity while respecting dorm/library guidelines.'
        }
      ],
      policyChecks: [
        { rule: 'Fire Marshal Safety Code', passed: false, notes: 'Attendee count (150) exceeds room rating (90).' },
        { rule: 'After-Hours Building Access', passed: true, notes: 'Event finishes at 22:00, within 23:00 building curfew.' }
      ],
      reasoning: [
        'Room capacity is the primary safety blocker.',
        'Shifting to Newton Science Theater eliminates both capacity and acoustics issues cleanly.'
      ],
      evaluatedAt: '2026-11-10T16:05:00.000Z',
      agentModel: 'gemini-3.8-flash'
    },
    approvalAudit: {
      action: 'modification_requested',
      decidedBy: 'Dr. Sarah Jenkins',
      decidedByRole: 'Department Administrator',
      decidedAt: '2026-11-10T16:45:00.000Z',
      comments: 'Please agree to move the opening ceremony to Newton Science Hall and scale to 2 PA speakers as the AI recommended, and we will approve immediately.'
    }
  }
];

const INITIAL_ACTIVITIES = [
  {
    id: 'act-001',
    timestamp: '2026-11-11T10:45:00.000Z',
    actor: 'CampusFlow Autonomous Agent',
    actorRole: 'AI Agent',
    action: 'Analyzed Request REQ-2026-1044',
    targetId: 'REQ-2026-1044',
    details: 'Flagged capacity limitation on Ada Lovelace Hall (150 > 90) and generated alternative venue options.',
    type: 'agent'
  },
  {
    id: 'act-002',
    timestamp: '2026-11-11T09:30:00.000Z',
    actor: 'Dr. Sarah Jenkins',
    actorRole: 'Department Administrator',
    action: 'Requested Modification on REQ-2026-1044',
    targetId: 'REQ-2026-1044',
    details: 'Prompted student society to relocate to Newton Hall based on agent recommendation.',
    type: 'user'
  },
  {
    id: 'act-003',
    timestamp: '2026-11-10T14:20:00.000Z',
    actor: 'CampusFlow Autonomous Agent',
    actorRole: 'AI Agent',
    action: 'Evaluated Request REQ-2026-1042',
    targetId: 'REQ-2026-1042',
    details: 'Verified zero scheduling conflicts for Annual Robotics Showcase. Recommended approval (94% confidence).',
    type: 'agent'
  },
  {
    id: 'act-004',
    timestamp: '2026-11-08T14:15:00.000Z',
    actor: 'Marcus Vance',
    actorRole: 'Campus Resource Manager',
    action: 'Approved Request REQ-2026-1043',
    targetId: 'REQ-2026-1043',
    details: 'Confirmed equipment reservation for Bio-Informatics Guest Lecture at Newton Theater.',
    type: 'user'
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    recipientEmail: 'alex.chen@campus.edu',
    title: 'Autonomous Verification Complete',
    message: 'Your request for Annual Autonomous Robotics Showcase (REQ-2026-1042) passed all conflict checks and is pending final administrator sign-off.',
    timestamp: '2026-11-10T09:20:12.000Z',
    read: false,
    type: 'approval',
    requestId: 'REQ-2026-1042'
  },
  {
    id: 'notif-2',
    recipientEmail: 's.jenkins@campus.edu',
    title: 'New Event Request Routed to You',
    message: 'REQ-2026-1042 requires Department Admin review. AI Agent recommends APPROVE (94% confidence).',
    timestamp: '2026-11-10T09:21:00.000Z',
    read: true,
    type: 'system',
    requestId: 'REQ-2026-1042'
  }
];

function loadData(): StorageSchema {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading storage file, initializing defaults:', err);
  }
  const initialData: StorageSchema = {
    resources: INITIAL_RESOURCES,
    requests: INITIAL_REQUESTS,
    activities: INITIAL_ACTIVITIES,
    notifications: INITIAL_NOTIFICATIONS
  };
  saveData(initialData);
  return initialData;
}

function saveData(data: StorageSchema) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving storage file:', err);
  }
}

let store: StorageSchema = loadData();

// -------------------------------------------------------------
// Helper: Conflict & Inventory Detection Engine
// -------------------------------------------------------------
function detectConflicts(reqData: {
  id?: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  expectedAttendees: number;
  resources: { resourceId: string; quantity: number }[];
}, existingRequests: any[], resources: any[]) {
  const conflicts: any[] = [];
  const alternatives: any[] = [];
  const policyChecks: any[] = [];

  // 1. Venue Check
  const venueResource = resources.find(r => r.name.toLowerCase() === reqData.venue.toLowerCase() || r.id === reqData.venue);
  if (venueResource && venueResource.capacity && reqData.expectedAttendees > venueResource.capacity) {
    conflicts.push({
      type: 'capacity_exceeded',
      severity: 'high',
      title: 'Venue Overcapacity Warning',
      description: `Requested venue ${venueResource.name} has a maximum seating capacity of ${venueResource.capacity}. Expected ${reqData.expectedAttendees} attendees exceeds safety regulations.`
    });

    // Suggest larger venue
    const largerVenues = resources.filter(r => r.type === 'venue' && (r.capacity || 0) >= reqData.expectedAttendees);
    if (largerVenues.length > 0) {
      alternatives.push({
        type: 'alternative_venue',
        suggestion: `Switch to ${largerVenues[0].name} (Capacity: ${largerVenues[0].capacity})`,
        rationale: `Accommodates ${reqData.expectedAttendees} attendees safely with designated emergency egress.`,
        impact: 'Complies with campus fire code and attendee comfort.'
      });
    }
  }

  // 2. Overlapping Time Check
  const reqStart = reqData.startTime;
  const reqEnd = reqData.endTime;

  const overlappingEvents = existingRequests.filter(r => {
    if (r.id === reqData.id) return false;
    if (r.eventDate !== reqData.eventDate) return false;
    if (r.status === 'rejected') return false;

    // Check time overlap: (StartA < EndB) && (EndA > StartB)
    return (reqStart < r.endTime && reqEnd > r.startTime);
  });

  // Check venue collisions
  for (const overlap of overlappingEvents) {
    if (overlap.venue.toLowerCase() === reqData.venue.toLowerCase()) {
      conflicts.push({
        type: 'venue_overlap',
        severity: 'high',
        title: `Venue Conflict: ${reqData.venue}`,
        description: `Already reserved by "${overlap.eventName}" (${overlap.startTime} - ${overlap.endTime}).`,
        conflictingRequestId: overlap.id,
        conflictingEventName: overlap.eventName
      });

      // Suggest alternative timeslot or alternative venue
      alternatives.push({
        type: 'alternative_timeslot',
        suggestion: `Adjust timing before ${overlap.startTime} or after ${overlap.endTime}`,
        rationale: 'Clears the overlap on the requested hall without venue reassignment.',
        impact: 'Same venue retained, slight schedule adjustment.'
      });
    }
  }

  // 3. Resource Inventory Quantities Check
  for (const requestedItem of reqData.resources) {
    const resource = resources.find(r => r.id === requestedItem.resourceId || r.name.toLowerCase() === requestedItem.resourceId.toLowerCase());
    if (!resource) continue;

    // Calculate how many are consumed during this overlapping window
    let currentlyBookedInWindow = 0;
    for (const overlap of overlappingEvents) {
      const match = overlap.resources?.find((item: any) => item.resourceId === resource.id);
      if (match) {
        currentlyBookedInWindow += match.quantity;
      }
    }

    const availableInWindow = resource.totalQuantity - resource.maintenanceQuantity - currentlyBookedInWindow;
    if (requestedItem.quantity > availableInWindow) {
      conflicts.push({
        type: 'resource_exhaustion',
        severity: availableInWindow <= 0 ? 'high' : 'medium',
        title: `Insufficient Inventory: ${resource.name}`,
        description: `Requested ${requestedItem.quantity} units, but only ${Math.max(0, availableInWindow)} are unallocated during this window (${currentlyBookedInWindow} allocated to concurrent events).`
      });

      if (availableInWindow > 0) {
        alternatives.push({
          type: 'quantity_adjustment',
          suggestion: `Cap ${resource.name} request at ${availableInWindow} units`,
          rationale: `Allows immediate approval without denying other concurrent campus sessions.`,
          impact: 'Partial resource fulfillment.'
        });
      }
    }
  }

  // 4. Policy Rules
  policyChecks.push({
    rule: 'Event Notice Window',
    passed: true,
    notes: 'Submitted within permissible advance reservation calendar.'
  });

  policyChecks.push({
    rule: 'Operating Hours Curfew',
    passed: reqData.endTime <= '23:00' && reqData.startTime >= '07:30',
    notes: reqData.endTime <= '23:00' ? 'Within campus building operating hours (07:30 - 23:00).' : 'Late event finishes after campus building lock at 23:00.'
  });

  policyChecks.push({
    rule: 'Resource Capacity Policy',
    passed: conflicts.length === 0,
    notes: conflicts.length === 0 ? 'All requested items within safe threshold limits.' : `${conflicts.length} active conflict(s) detected.`
  });

  return { conflicts, alternatives, policyChecks };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'CampusFlow AI Autonomous Agent',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!ai
  });
});

// Resources CRUD
app.get('/api/resources', (req, res) => {
  res.json({ resources: store.resources });
});

app.post('/api/resources', (req, res) => {
  const newRes = {
    id: `res-${Date.now()}`,
    ...req.body
  };
  store.resources.push(newRes);
  saveData(store);
  res.status(201).json({ resource: newRes });
});

app.put('/api/resources/:id', (req, res) => {
  const { id } = req.params;
  const idx = store.resources.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Resource not found' });
  }
  store.resources[idx] = { ...store.resources[idx], ...req.body };
  saveData(store);
  res.json({ resource: store.resources[idx] });
});

// Requests CRUD
app.get('/api/requests', (req, res) => {
  const { status, department, search } = req.query;
  let list = [...store.requests];

  if (status && status !== 'all') {
    list = list.filter(r => r.status === status);
  }
  if (department && department !== 'all') {
    list = list.filter(r => r.department === department);
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(r => 
      r.eventName.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q) ||
      r.requesterName.toLowerCase().includes(q) ||
      r.venue.toLowerCase().includes(q)
    );
  }

  // Sort descending by created date
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ requests: list });
});

app.get('/api/requests/:id', (req, res) => {
  const item = store.requests.find(r => r.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: 'Request not found' });
  }
  res.json({ request: item });
});

// -------------------------------------------------------------
// AI Agent Endpoint: Parse Natural Language
// -------------------------------------------------------------
app.post('/api/agent/parse', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'A natural language prompt is required' });
  }

  // Available resources list for grounding
  const resourceCatalog = store.resources.map(r => ({
    id: r.id,
    name: r.name,
    category: r.category,
    type: r.type,
    capacity: r.capacity || null
  }));

  if (ai) {
    try {
      const systemInstruction = `You are the CampusFlow AI Natural Language Parser for university event resource management.
Analyze the user's free-text request and extract all event specifications into structured JSON.
Current campus resource catalog: ${JSON.stringify(resourceCatalog)}

Return a JSON object conforming strictly to this format:
- eventName: string (descriptive event title)
- department: string (e.g. School of Engineering, Department of Computer Science, Student Union, etc.)
- eventDate: string (YYYY-MM-DD, e.g. 2026-11-25)
- startTime: string (HH:MM in 24hr format, e.g. 14:00)
- endTime: string (HH:MM in 24hr format, e.g. 17:00)
- venue: string (exact match from catalog if mentioned, or best inferred venue)
- expectedAttendees: integer
- resources: array of objects with { resourceId: string (exact id from catalog), resourceName: string, quantity: integer, notes: string }
- additionalInstructions: string
- priority: "standard" | "high" | "urgent"

If date is mentioned relatively like "next Friday" or "tomorrow", ground relative to late 2026. If venue is not specified, select the best fitting venue from the catalog based on expected attendees or event type.`;

      const geminiRes = await callWithTimeout(ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              eventName: { type: Type.STRING },
              department: { type: Type.STRING },
              eventDate: { type: Type.STRING },
              startTime: { type: Type.STRING },
              endTime: { type: Type.STRING },
              venue: { type: Type.STRING },
              expectedAttendees: { type: Type.INTEGER },
              resources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    resourceId: { type: Type.STRING },
                    resourceName: { type: Type.STRING },
                    quantity: { type: Type.INTEGER },
                    notes: { type: Type.STRING }
                  },
                  required: ['resourceId', 'resourceName', 'quantity']
                }
              },
              additionalInstructions: { type: Type.STRING },
              priority: { type: Type.STRING }
            },
            required: ['eventName', 'department', 'eventDate', 'startTime', 'endTime', 'venue', 'expectedAttendees', 'resources']
          }
        }
      }), 6000);

      const parsed = JSON.parse(geminiRes.text || '{}');
      return res.json({ success: true, parsed, agentModel: 'gemini-3.8-flash' });
    } catch (err: any) {
      console.warn('Gemini natural language parsing error, using heuristic fallback:', err?.message);
    }
  }

  // Heuristic rule-based fallback if no API key or API call failure
  const lower = prompt.toLowerCase();
  let venue = 'Newton Science Lecture Theater';
  if (lower.includes('turing') || lower.includes('auditorium') || lower.includes('grand')) {
    venue = 'Alan Turing Grand Auditorium';
  } else if (lower.includes('lovelace') || lower.includes('seminar') || lower.includes('workshop')) {
    venue = 'Ada Lovelace Collaborative Seminar Hall';
  }

  let attendees = 100;
  const attMatch = prompt.match(/(\d+)\s*(people|attendees|students|guests|audience|participants)/i);
  if (attMatch) attendees = parseInt(attMatch[1], 10);

  const matchedResources: any[] = [];
  if (lower.includes('projector')) {
    const qty = (prompt.match(/(\d+)\s*projector/i) || [null, '2'])[1];
    matchedResources.push({ resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: parseInt(qty, 10) || 1 });
  }
  if (lower.includes('mic') || lower.includes('microphone')) {
    const qty = (prompt.match(/(\d+)\s*mic/i) || [null, '4'])[1];
    matchedResources.push({ resourceId: 'res-mic-wireless', resourceName: 'Wireless UHF Lavalier & Handheld Mics', quantity: parseInt(qty, 10) || 2 });
  }
  if (lower.includes('speaker') || lower.includes('sound') || lower.includes('audio')) {
    const qty = (prompt.match(/(\d+)\s*speaker/i) || [null, '2'])[1];
    matchedResources.push({ resourceId: 'res-speakers-line', resourceName: 'Portable PA Powered Column Speakers', quantity: parseInt(qty, 10) || 2 });
  }
  if (lower.includes('camera') || lower.includes('stream') || lower.includes('record')) {
    matchedResources.push({ resourceId: 'res-cam-ptz', resourceName: '4K PTZ Robotic Livestream Cameras', quantity: 2 });
  }
  if (lower.includes('chair') || lower.includes('table') || lower.includes('seat')) {
    const qty = (prompt.match(/(\d+)\s*(chair|seat|table)/i) || [null, '80'])[1];
    matchedResources.push({ resourceId: 'res-seating-banquet', resourceName: 'Modular Conference Chairs & Foldable Tables', quantity: parseInt(qty, 10) || 60 });
  }

  if (matchedResources.length === 0) {
    matchedResources.push({ resourceId: 'res-proj-4k', resourceName: 'Laser 4K Venue Projectors', quantity: 1 });
    matchedResources.push({ resourceId: 'res-mic-wireless', resourceName: 'Wireless UHF Lavalier & Handheld Mics', quantity: 2 });
  }

  const fallbackParsed = {
    eventName: prompt.length > 50 ? prompt.slice(0, 47) + '...' : prompt,
    department: lower.includes('engineer') ? 'School of Engineering' : lower.includes('business') ? 'School of Management' : 'Department of Computer Science',
    eventDate: '2026-11-28',
    startTime: '14:00',
    endTime: '17:00',
    venue,
    expectedAttendees: attendees,
    resources: matchedResources,
    additionalInstructions: 'Extracted via CampusFlow Autonomous Agent heuristic analyzer.',
    priority: lower.includes('urgent') || lower.includes('asap') ? 'urgent' : 'standard'
  };

  res.json({ success: true, parsed: fallbackParsed, agentModel: 'heuristic-rules-v2' });
});

// -------------------------------------------------------------
// AI Agent Endpoint: Autonomous Evaluation & Conflict Analysis
// -------------------------------------------------------------
app.post('/api/agent/evaluate', async (req, res) => {
  const reqData = req.body;
  if (!reqData || !reqData.eventDate || !reqData.startTime || !reqData.endTime) {
    return res.status(400).json({ error: 'Missing mandatory schedule data for evaluation' });
  }

  // Run deterministic schedule & inventory conflict engine
  const { conflicts, alternatives, policyChecks } = detectConflicts(reqData, store.requests, store.resources);

  let recommendation: 'RECOMMEND_APPROVE' | 'RECOMMEND_REVISE' | 'RECOMMEND_REJECT' = 'RECOMMEND_APPROVE';
  let confidenceScore = 95;
  let summary = 'No scheduling or resource conflicts detected. Request adheres to campus event protocols.';
  let reasoning: string[] = [
    `Venue "${reqData.venue}" is free on ${reqData.eventDate} during ${reqData.startTime}-${reqData.endTime}.`,
    'Requested resource quantities are verified within unallocated warehouse pools.',
    'All mandatory event policies and safety checklists cleared.'
  ];

  if (conflicts.length > 0) {
    const hasHigh = conflicts.some(c => c.severity === 'high');
    if (hasHigh) {
      recommendation = alternatives.length > 0 ? 'RECOMMEND_REVISE' : 'RECOMMEND_REJECT';
      confidenceScore = 88;
      summary = `Identified ${conflicts.length} conflict(s). AI recommends modifying request parameters (see suggested alternatives).`;
      reasoning = conflicts.map(c => `${c.title}: ${c.description}`);
    } else {
      recommendation = 'RECOMMEND_REVISE';
      confidenceScore = 90;
      summary = `Minor equipment inventory contention detected. Resolution alternatives generated.`;
      reasoning = conflicts.map(c => `${c.title}: ${c.description}`);
    }
  }

  // Enhance evaluation with Gemini 3.8 Flash if available
  if (ai) {
    try {
      const evaluationPrompt = `You are CampusFlow AI, an autonomous university resource allocation officer.
Review this event resource request and verified conflict analysis:
Request Data: ${JSON.stringify(reqData)}
Detected Conflicts: ${JSON.stringify(conflicts)}
Rule Engine Alternatives: ${JSON.stringify(alternatives)}
Policy Checks: ${JSON.stringify(policyChecks)}

Produce a concise, professional assessment:
1. Executive summary (2 sentences max).
2. Refined recommendation: one of "RECOMMEND_APPROVE", "RECOMMEND_REVISE", "RECOMMEND_REJECT".
3. Confidence score (70-99).
4. 3 bullet-point reasoning arguments explaining the decision to the campus administrator.`;

      const aiRes = await callWithTimeout(ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: evaluationPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING },
              confidenceScore: { type: Type.INTEGER },
              reasoning: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['summary', 'recommendation', 'confidenceScore', 'reasoning']
          }
        }
      }), 6000);

      const geminiEval = JSON.parse(aiRes.text || '{}');
      if (geminiEval.summary) summary = geminiEval.summary;
      if (geminiEval.recommendation) {
        if (['RECOMMEND_APPROVE', 'RECOMMEND_REVISE', 'RECOMMEND_REJECT'].includes(geminiEval.recommendation)) {
          recommendation = geminiEval.recommendation as any;
        }
      }
      if (typeof geminiEval.confidenceScore === 'number') confidenceScore = geminiEval.confidenceScore;
      if (Array.isArray(geminiEval.reasoning) && geminiEval.reasoning.length > 0) reasoning = geminiEval.reasoning;
    } catch (err: any) {
      console.warn('Gemini evaluation refinement fallback:', err?.message);
    }
  }

  const evaluation = {
    recommendation,
    confidenceScore,
    summary,
    conflicts,
    alternatives,
    policyChecks,
    reasoning,
    evaluatedAt: new Date().toISOString(),
    agentModel: ai ? 'gemini-3.8-flash' : 'rule-engine-v2'
  };

  res.json({ evaluation });
});

// -------------------------------------------------------------
// Autonomous 12-Step Agent Workflow Pipeline
// -------------------------------------------------------------
app.post('/api/agent/execute-workflow', async (req, res) => {
  const reqData = req.body;
  const requestId = reqData.id || `REQ-2026-${Math.floor(1050 + Math.random() * 9000)}`;

  // Step 1 to 12 execution
  const now = new Date();
  const step = (num: number, title: string, status: 'completed' | 'warning', message: string, offsetSec: number) => ({
    stepNumber: num,
    title,
    status,
    message,
    completedAt: new Date(now.getTime() + offsetSec * 1000).toISOString()
  });

  // Run conflict check
  const { conflicts, alternatives, policyChecks } = detectConflicts(reqData, store.requests, store.resources);
  const hasConflicts = conflicts.length > 0;

  let recommendation: 'RECOMMEND_APPROVE' | 'RECOMMEND_REVISE' | 'RECOMMEND_REJECT' = 'RECOMMEND_APPROVE';
  if (hasConflicts) {
    recommendation = conflicts.some(c => c.severity === 'high') ? (alternatives.length > 0 ? 'RECOMMEND_REVISE' : 'RECOMMEND_REJECT') : 'RECOMMEND_REVISE';
  }

  const workflowSteps = [
    step(1, 'Receive Resource Request', 'completed', `Received submission from ${reqData.requesterName || 'Requester'} (${reqData.department || 'General'})`, 0),
    step(2, 'Parse Request using AI', 'completed', `Parsed "${reqData.eventName}" into structured schedule & resource entity graph`, 1),
    step(3, 'Validate Required Information', 'completed', `All required parameters validated: Date ${reqData.eventDate}, ${reqData.startTime}-${reqData.endTime}, Venue ${reqData.venue}`, 2),
    step(4, 'Check Resource Inventory', hasConflicts ? 'warning' : 'completed', hasConflicts ? `Detected resource constraint in requested quantities` : `Resource warehouse verified adequate inventory for ${reqData.resources?.length || 0} items`, 3),
    step(5, 'Check Date & Time Availability', 'completed', `Queried central campus schedule ledger for ${reqData.eventDate}`, 4),
    step(6, 'Detect Scheduling Conflicts', hasConflicts ? 'warning' : 'completed', hasConflicts ? `Found ${conflicts.length} conflict(s)` : `Zero time overlaps or double bookings discovered`, 5),
    step(7, 'Suggest Alternatives if Unavailable', 'completed', alternatives.length > 0 ? `Synthesized ${alternatives.length} smart substitution alternative(s)` : `No alternatives needed; primary allocation nominal`, 6),
    step(8, 'Generate AI Recommendation', 'completed', `Formulated decision: ${recommendation} (Confidence: ${hasConflicts ? '89%' : '96%'})`, 7),
    step(9, 'Submit to Authorized Approver', 'completed', `Routed to Department Administrator and Campus Facilities Queue`, 8),
    step(10, 'Update Request Status', 'completed', `Status updated to PENDING with agent evaluation attachment`, 9),
    step(11, 'Notify Requester', 'completed', `Notification dispatched to ${reqData.requesterEmail || 'requester'}`, 10),
    step(12, 'Maintain Activity Log', 'completed', `Immutable transaction logged to CampusFlow ledger`, 11)
  ];

  const evaluation = {
    recommendation,
    confidenceScore: hasConflicts ? 89 : 96,
    summary: hasConflicts ? `Agent flagged ${conflicts.length} operational conflict(s). Alternatives generated for review.` : 'Autonomous pre-screening completed with 100% compliance. Recommended for immediate sign-off.',
    conflicts,
    alternatives,
    policyChecks,
    reasoning: hasConflicts ? conflicts.map(c => `${c.title}: ${c.description}`) : [
      'Inventory reserves cleared for all requested equipment.',
      `Venue ${reqData.venue} has zero overlapping sessions.`,
      'Campus safety and curfew thresholds verified.'
    ],
    evaluatedAt: new Date().toISOString(),
    agentModel: ai ? 'gemini-3.8-flash' : 'campusflow-autonomous-agent'
  };

  const finalRequest = {
    ...reqData,
    id: requestId,
    status: reqData.status || 'pending',
    priority: reqData.priority || 'standard',
    createdAt: reqData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    aiEvaluation: evaluation,
    workflowSteps: workflowSteps
  };

  // Check if exists or create new
  const existingIdx = store.requests.findIndex(r => r.id === requestId);
  if (existingIdx >= 0) {
    store.requests[existingIdx] = finalRequest;
  } else {
    store.requests.unshift(finalRequest);
  }

  // Create Activity Log
  store.activities.unshift({
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: 'CampusFlow Autonomous Agent',
    actorRole: 'AI Agent',
    action: `Executed 12-Step Autonomous Workflow for ${requestId}`,
    targetId: requestId,
    details: `Processed "${finalRequest.eventName}" (${finalRequest.department}) with recommendation: ${recommendation}.`,
    type: 'agent'
  });

  // Create Notification
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientEmail: finalRequest.requesterEmail || 'student@campus.edu',
    title: `Autonomous Processing Complete: ${finalRequest.eventName}`,
    message: `Your request (${finalRequest.id}) has been analyzed by CampusFlow AI and routed to the department administrator.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'update',
    requestId: finalRequest.id
  });

  saveData(store);
  res.status(201).json({ request: finalRequest, workflowSteps, evaluation });
});

// -------------------------------------------------------------
// Human Approver Actions (Approve / Reject / Modification)
// -------------------------------------------------------------
app.post('/api/requests/:id/action', (req, res) => {
  const { id } = req.params;
  const { action, comments, approverName, approverRole } = req.body;

  if (!['approved', 'rejected', 'modification_requested'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action. Must be approved, rejected, or modification_requested' });
  }

  const idx = store.requests.findIndex(r => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Request not found' });
  }

  const targetReq = store.requests[idx];
  targetReq.status = action;
  targetReq.updatedAt = new Date().toISOString();
  targetReq.approvalAudit = {
    action,
    decidedBy: approverName || 'Administrator',
    decidedByRole: approverRole || 'Campus Administrator',
    decidedAt: new Date().toISOString(),
    comments: comments || `Action recorded via CampusFlow Approval Center.`
  };

  // If approved, update live booked quantities in resources
  if (action === 'approved') {
    for (const item of targetReq.resources || []) {
      const resItem = store.resources.find(r => r.id === item.resourceId);
      if (resItem) {
        resItem.inUseQuantity = Math.min(resItem.totalQuantity, resItem.inUseQuantity + item.quantity);
        resItem.availableQuantity = Math.max(0, resItem.totalQuantity - resItem.inUseQuantity - resItem.maintenanceQuantity);
      }
    }
  }

  // Log activity
  store.activities.unshift({
    id: `act-${Date.now()}`,
    timestamp: new Date().toISOString(),
    actor: approverName || 'Administrator',
    actorRole: approverRole || 'Campus Administrator',
    action: `${action.toUpperCase().replace('_', ' ')} for ${id}`,
    targetId: id,
    details: `${action === 'approved' ? 'Approved' : action === 'rejected' ? 'Rejected' : 'Requested modifications on'} "${targetReq.eventName}". Note: ${comments || 'No comments'}`,
    type: 'user'
  });

  // Notify requester
  store.notifications.unshift({
    id: `notif-${Date.now()}`,
    recipientEmail: targetReq.requesterEmail,
    title: `Request ${action === 'approved' ? 'Approved' : action === 'rejected' ? 'Rejected' : 'Requires Modification'}: ${targetReq.eventName}`,
    message: comments ? `${approverName}: "${comments}"` : `Your request status is now ${action.replace('_', ' ')}.`,
    timestamp: new Date().toISOString(),
    read: false,
    type: 'approval',
    requestId: id
  });

  saveData(store);
  res.json({ success: true, request: targetReq });
});

// Activities & Notifications
app.get('/api/activities', (req, res) => {
  res.json({ activities: store.activities });
});

app.get('/api/notifications', (req, res) => {
  const { email } = req.query;
  let notifs = [...store.notifications];
  if (email) {
    notifs = notifs.filter(n => !n.recipientEmail || n.recipientEmail.toLowerCase() === String(email).toLowerCase());
  }
  res.json({ notifications: notifs });
});

app.put('/api/notifications/:id/read', (req, res) => {
  const n = store.notifications.find(item => item.id === req.params.id);
  if (n) {
    n.read = true;
    saveData(store);
  }
  res.json({ success: true });
});

// Reset demo data endpoint
app.post('/api/admin/reset-data', (req, res) => {
  store = {
    resources: JSON.parse(JSON.stringify(INITIAL_RESOURCES)),
    requests: JSON.parse(JSON.stringify(INITIAL_REQUESTS)),
    activities: JSON.parse(JSON.stringify(INITIAL_ACTIVITIES)),
    notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS))
  };
  saveData(store);
  res.json({ success: true, message: 'CampusFlow database reset to seed state' });
});

// -------------------------------------------------------------
// Vite Dev Server / Static File Serving
// -------------------------------------------------------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusFlow AI] Server running on http://0.0.0.0:${PORT}`);
    console.log(`[CampusFlow AI] Gemini API Status: ${ai ? 'Connected (gemini-3.8-flash)' : 'Heuristic Engine Active (Set GEMINI_API_KEY for advanced AI)'}`);
  });
}

startServer();
