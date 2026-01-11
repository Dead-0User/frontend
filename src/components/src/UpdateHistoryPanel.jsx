import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown, Plus, Minus, User, Smartphone, ChevronDown, ChevronUp } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL + "/api";

const UpdateHistoryPanel = ({ orderId, history: providedHistory }) => {
  const [history, setHistory] = useState(providedHistory || []);
  const [loading, setLoading] = useState(!providedHistory);
  const [expandedSessions, setExpandedSessions] = useState(new Set([0]));

  useEffect(() => {
    if (providedHistory) {
      setHistory(providedHistory);
      setLoading(false);
    } else if (orderId) {
      fetchHistory();
    }
  }, [orderId, providedHistory]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching update history:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupHistoryIntoSessions = () => {
    if (history.length === 0) return [];

    const sessions = [];
    let currentSession = [];
    let sessionTimestamp = history[0].timestamp;
    let sessionChangedBy = history[0].changedBy;

    history.forEach((entry, index) => {
      const timeDiff = index > 0
        ? new Date(entry.timestamp).getTime() - new Date(history[index - 1].timestamp).getTime()
        : 0;

      if (timeDiff > 2000 && currentSession.length > 0) {
        sessions.push({
          sessionNumber: sessions.length + 1,
          timestamp: sessionTimestamp,
          changedBy: sessionChangedBy,
          changes: [...currentSession]
        });
        currentSession = [];
        sessionTimestamp = entry.timestamp;
        sessionChangedBy = entry.changedBy;
      }

      currentSession.push(entry);
    });

    if (currentSession.length > 0) {
      sessions.push({
        sessionNumber: sessions.length + 1,
        timestamp: sessionTimestamp,
        changedBy: sessionChangedBy,
        changes: currentSession
      });
    }

    return sessions.reverse();
  };

  const toggleSession = (sessionNumber) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionNumber)) {
        newSet.delete(sessionNumber);
      } else {
        newSet.add(sessionNumber);
      }
      return newSet;
    });
  };

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'item_added':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'item_removed':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'quantity_increased':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'quantity_decreased':
        return <TrendingDown className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getChangeColor = (changeType) => {
    switch (changeType) {
      case 'item_added':
        return 'bg-green-100 dark:bg-green-900/20 border-green-300';
      case 'item_removed':
        return 'bg-red-100 dark:bg-red-900/20 border-red-300';
      case 'quantity_increased':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300';
      case 'quantity_decreased':
        return 'bg-orange-100 dark:bg-orange-900/20 border-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 border-gray-300';
    }
  };

  const getUserIcon = (changedBy) => {
    return changedBy === 'customer' ? (
      <Smartphone className="h-3 w-3" />
    ) : (
      <User className="h-3 w-3" />
    );
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const formatFullTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // NEW: Format the change description to show quantity changes
  const formatChangeDescription = (entry) => {
    switch (entry.changeType) {
      case 'item_added':
        return `Added ${entry.newQuantity}× ${entry.itemName}`;
      case 'item_removed':
        return `Removed ${entry.oldQuantity}× ${entry.itemName}`;
      case 'quantity_increased':
        return `${entry.itemName}: increased from ${entry.oldQuantity} to ${entry.newQuantity}`;
      case 'quantity_decreased':
        return `${entry.itemName}: decreased from ${entry.oldQuantity} to ${entry.newQuantity}`;
      default:
        return entry.details;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Update History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-4">
            Loading history...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Update History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-4">
            No updates yet
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessions = groupHistoryIntoSessions();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Update History ({history.length} {history.length === 1 ? 'change' : 'changes'} in {sessions.length} {sessions.length === 1 ? 'update' : 'updates'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {sessions.map((session) => {
            const isExpanded = expandedSessions.has(session.sessionNumber);

            return (
              <div
                key={session.sessionNumber}
                className="border rounded-lg overflow-hidden bg-card shadow-sm"
              >
                <button
                  onClick={() => toggleSession(session.sessionNumber)}
                  className="w-full p-3 bg-muted/50 hover:bg-muted/70 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="bg-primary/10 rounded-full p-2">
                      {getUserIcon(session.changedBy)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">
                          Update #{sessions.length - session.sessionNumber + 1}
                        </span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 gap-1">
                          {getUserIcon(session.changedBy)}
                          <span className="capitalize">{session.changedBy}</span>
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatFullTime(session.timestamp)} • {formatTimeAgo(session.timestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {session.changes.length} {session.changes.length === 1 ? 'change' : 'changes'}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 space-y-2 bg-background">
                    {session.changes.map((entry, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${getChangeColor(entry.changeType)}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 flex-1">
                            <div className="mt-0.5">
                              {getChangeIcon(entry.changeType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">
                                {formatChangeDescription(entry)}
                              </p>
                            </div>
                          </div>
                          {entry.oldQuantity !== null && entry.newQuantity !== null && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-semibold text-muted-foreground line-through">
                                ×{entry.oldQuantity}
                              </div>
                              <div className="text-sm font-bold text-primary">
                                ×{entry.newQuantity}
                              </div>
                            </div>
                          )}
                          {entry.oldQuantity !== null && entry.newQuantity === null && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold text-red-600">
                                ×{entry.oldQuantity}
                              </div>
                            </div>
                          )}
                          {entry.oldQuantity === null && entry.newQuantity !== null && (
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-bold text-green-600">
                                ×{entry.newQuantity}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpdateHistoryPanel;