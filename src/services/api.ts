import { 
  CampusResource, 
  EventResourceRequest, 
  ActivityLogItem, 
  NotificationItem, 
  AiEvaluation 
} from '../types';

export async function fetchHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function fetchResources(): Promise<CampusResource[]> {
  const res = await fetch('/api/resources');
  if (!res.ok) throw new Error('Failed to fetch resources');
  const data = await res.json();
  return data.resources;
}

export async function createResource(resourceData: Partial<CampusResource>): Promise<CampusResource> {
  const res = await fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(resourceData),
  });
  if (!res.ok) throw new Error('Failed to create resource');
  const data = await res.json();
  return data.resource;
}

export async function fetchRequests(params?: { status?: string; department?: string; search?: string }): Promise<EventResourceRequest[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.department) query.set('department', params.department);
  if (params?.search) query.set('search', params.search);

  const res = await fetch(`/api/requests?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch requests');
  const data = await res.json();
  return data.requests;
}

export async function fetchRequestById(id: string): Promise<EventResourceRequest> {
  const res = await fetch(`/api/requests/${id}`);
  if (!res.ok) throw new Error('Request not found');
  const data = await res.json();
  return data.request;
}

export async function parseNaturalLanguageRequest(prompt: string) {
  const res = await fetch('/api/agent/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error('Failed to parse request');
  return res.json();
}

export async function evaluateRequestWithAgent(requestData: Partial<EventResourceRequest>): Promise<{ evaluation: AiEvaluation }> {
  const res = await fetch('/api/agent/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });
  if (!res.ok) throw new Error('Failed to evaluate request');
  return res.json();
}

export async function executeAutonomousWorkflow(requestData: Partial<EventResourceRequest>): Promise<{ request: EventResourceRequest }> {
  const res = await fetch('/api/agent/execute-workflow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestData),
  });
  if (!res.ok) throw new Error('Failed to execute workflow');
  return res.json();
}

export async function submitApproverAction(requestId: string, payload: {
  action: 'approved' | 'rejected' | 'modification_requested';
  comments: string;
  approverName: string;
  approverRole: string;
}): Promise<{ success: boolean; request: EventResourceRequest }> {
  const res = await fetch(`/api/requests/${requestId}/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit approval decision');
  return res.json();
}

export async function fetchActivities(): Promise<ActivityLogItem[]> {
  const res = await fetch('/api/activities');
  if (!res.ok) throw new Error('Failed to fetch activities');
  const data = await res.json();
  return data.activities;
}

export async function fetchNotifications(email?: string): Promise<NotificationItem[]> {
  const url = email ? `/api/notifications?email=${encodeURIComponent(email)}` : '/api/notifications';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch notifications');
  const data = await res.json();
  return data.notifications;
}

export async function markNotificationAsRead(id: string) {
  await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
}

export async function resetDatabase() {
  const res = await fetch('/api/admin/reset-data', { method: 'POST' });
  return res.json();
}
