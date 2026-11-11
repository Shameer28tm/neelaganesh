import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { NewRequestView } from './components/NewRequestView';
import { ResourceManagementView } from './components/ResourceManagementView';
import { RequestManagementView } from './components/RequestManagementView';
import { AiAgentView } from './components/AiAgentView';
import { ApprovalCenterView } from './components/ApprovalCenterView';
import { RequestDetailModal } from './components/RequestDetailModal';
import { USERS } from './data/users';
import { 
  UserProfile, 
  CampusResource, 
  EventResourceRequest, 
  ActivityLogItem, 
  NotificationItem 
} from './types';
import { 
  fetchResources, 
  fetchRequests, 
  fetchActivities, 
  fetchNotifications, 
  markNotificationAsRead, 
  resetDatabase 
} from './services/api';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS[0]);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  const [resources, setResources] = useState<CampusResource[]>([]);
  const [requests, setRequests] = useState<EventResourceRequest[]>([]);
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRequest, setSelectedRequest] = useState<EventResourceRequest | null>(null);

  // Load initial data
  const loadAppData = async () => {
    try {
      const [resData, reqData, actData, notifData] = await Promise.all([
        fetchResources(),
        fetchRequests(),
        fetchActivities(),
        fetchNotifications(currentUser.email)
      ]);
      setResources(resData);
      setRequests(reqData);
      setActivities(actData);
      setNotifications(notifData);
    } catch (err) {
      console.error('Error fetching initial campus data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, [currentUser]);

  // Handle new request submitted
  const handleRequestSubmitted = (newReq: EventResourceRequest) => {
    setRequests(prev => [newReq, ...prev]);
    loadAppData();
    setSelectedRequest(newReq);
    setCurrentTab('requests');
  };

  // Handle request updated (approved / modified / rejected)
  const handleRequestUpdated = (updatedReq: EventResourceRequest) => {
    setRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    if (selectedRequest?.id === updatedReq.id) {
      setSelectedRequest(updatedReq);
    }
    loadAppData();
  };

  // Handle resource created
  const handleResourceCreated = (newRes: CampusResource) => {
    setResources(prev => [...prev, newRes]);
  };

  // Handle notification click
  const handleNotificationClick = async (notif: NotificationItem) => {
    await markNotificationAsRead(notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    if (notif.requestId) {
      const target = requests.find(r => r.id === notif.requestId);
      if (target) {
        setSelectedRequest(target);
      }
    }
  };

  // Handle demo data reset
  const handleResetData = async () => {
    if (confirm('Reset campus database to clean initial demonstration state?')) {
      setIsLoading(true);
      await resetDatabase();
      await loadAppData();
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-800 flex flex-col font-sans selection:bg-blue-500/15 selection:text-blue-900">
      
      {/* Top macOS Liquid Glass Toolbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        currentUser={currentUser}
        onChangeUser={setCurrentUser}
        notifications={notifications}
        onNotificationClick={handleNotificationClick}
        onResetData={handleResetData}
      />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Synchronizing CampusFlow AI ledger...</p>
          </div>
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardView
                requests={requests}
                resources={resources}
                activities={activities}
                currentUser={currentUser}
                onNavigate={setCurrentTab}
                onSelectRequest={setSelectedRequest}
              />
            )}

            {currentTab === 'new-request' && (
              <NewRequestView
                resources={resources}
                currentUser={currentUser}
                onRequestSubmitted={handleRequestSubmitted}
                onNavigate={setCurrentTab}
              />
            )}

            {currentTab === 'requests' && (
              <RequestManagementView
                requests={requests}
                currentUser={currentUser}
                onSelectRequest={setSelectedRequest}
                onNavigate={setCurrentTab}
              />
            )}

            {currentTab === 'resources' && (
              <ResourceManagementView
                resources={resources}
                currentUser={currentUser}
                onResourceCreated={handleResourceCreated}
              />
            )}

            {currentTab === 'agent' && (
              <AiAgentView
                resources={resources}
                requests={requests}
                onWorkflowCompleted={handleRequestSubmitted}
              />
            )}

            {currentTab === 'approvals' && (
              <ApprovalCenterView
                requests={requests}
                currentUser={currentUser}
                onChangeUser={setCurrentUser}
                onRequestUpdated={handleRequestUpdated}
                onSelectRequest={setSelectedRequest}
              />
            )}
          </>
        )}
      </main>

      {/* Detail & Audit Modal */}
      {selectedRequest && (
        <RequestDetailModal
          request={selectedRequest}
          currentUser={currentUser}
          onClose={() => setSelectedRequest(null)}
          onRequestUpdated={handleRequestUpdated}
        />
      )}

      {/* Minimal Apple-Style Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200/60 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">CampusFlow AI</span>
            <span aria-hidden="true">·</span>
            <span>Autonomous Campus Resource Management</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Powered by Gemini 3.8 Flash</span>
            <span aria-hidden="true">·</span>
            <span>Liquid Glass Interface</span>
            <span aria-hidden="true">·</span>
            <span>Human-in-the-Loop Safe</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
