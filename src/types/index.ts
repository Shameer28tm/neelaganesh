export type UserRole = 'student' | 'admin' | 'manager';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatarUrl: string;
}

export type ResourceCategory = 
  | 'Audio & Speech' 
  | 'Visual & Display' 
  | 'Venues & Halls' 
  | 'Furniture & Seating' 
  | 'Cameras & Recording';

export interface CampusResource {
  id: string;
  name: string;
  category: ResourceCategory;
  type: 'venue' | 'equipment';
  totalQuantity: number;
  availableQuantity: number;
  inUseQuantity: number;
  maintenanceQuantity: number;
  location: string;
  capacity?: number;
  condition: 'Optimal' | 'Good' | 'Maintenance Required';
  description: string;
  features: string[];
}

export interface RequestedResourceItem {
  resourceId: string;
  resourceName: string;
  quantity: number;
  notes?: string;
}

export type RequestStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'modification_requested';

export interface ConflictItem {
  type: 'resource_exhaustion' | 'venue_overlap' | 'capacity_exceeded' | 'maintenance_lock';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  conflictingRequestId?: string;
  conflictingEventName?: string;
}

export interface AlternativeItem {
  type: 'substitute_resource' | 'alternative_venue' | 'alternative_timeslot' | 'quantity_adjustment';
  suggestion: string;
  rationale: string;
  impact: string;
}

export interface PolicyCheckItem {
  rule: string;
  passed: boolean;
  notes: string;
}

export interface AiEvaluation {
  recommendation: 'RECOMMEND_APPROVE' | 'RECOMMEND_REVISE' | 'RECOMMEND_REJECT';
  confidenceScore: number;
  summary: string;
  conflicts: ConflictItem[];
  alternatives: AlternativeItem[];
  policyChecks: PolicyCheckItem[];
  reasoning: string[];
  evaluatedAt: string;
  agentModel: string;
}

export interface ApprovalAudit {
  action: 'approved' | 'rejected' | 'modification_requested';
  decidedBy: string;
  decidedByRole: string;
  decidedAt: string;
  comments: string;
}

export interface WorkflowStep {
  stepNumber: number;
  title: string;
  status: 'pending' | 'processing' | 'completed' | 'warning' | 'failed';
  message: string;
  completedAt?: string;
  dataSnippet?: Record<string, unknown>;
}

export interface EventResourceRequest {
  id: string;
  eventName: string;
  department: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: UserRole;
  eventDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  venue: string;
  resources: RequestedResourceItem[];
  expectedAttendees: number;
  additionalInstructions?: string;
  status: RequestStatus;
  priority: 'standard' | 'high' | 'urgent';
  createdAt: string;
  updatedAt: string;
  aiEvaluation?: AiEvaluation;
  approvalAudit?: ApprovalAudit;
  workflowSteps?: WorkflowStep[];
  isDemo?: boolean;
}

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  targetId?: string;
  details: string;
  type: 'agent' | 'user' | 'system';
}

export interface NotificationItem {
  id: string;
  recipientEmail: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'approval' | 'conflict' | 'system' | 'update';
  requestId?: string;
}
