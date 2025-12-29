import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi, shiftApi, userApi } from '../../services/api';
import type { Event, Shift, User } from '../../types';
import { Button, Card, Input, Modal } from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

export function EventDetail() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateShift, setShowCreateShift] = useState(false);

  // Create shift form state
  const [shiftName, setShiftName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) return;

    Promise.all([
      eventApi.getById(eventId),
      shiftApi.getByEvent(eventId),
      userApi.getAll(),
    ]).then(([eventData, shiftsData, usersData]) => {
      setEvent(eventData);
      setShifts(shiftsData);
      setUsers(usersData.filter(u => u.role === 'team_member'));
      setIsLoading(false);
    });
  }, [eventId]);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId) return;

    setIsSubmitting(true);
    try {
      const newShift = await shiftApi.create(
        eventId,
        shiftName,
        selectedMembers,
        startTime || undefined,
        endTime || undefined
      );
      setShifts([...shifts, newShift]);
      setShowCreateShift(false);
      setShiftName('');
      setSelectedMembers([]);
      setStartTime('');
      setEndTime('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create shift');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <p className="text-red-600">Event not found</p>
        </Card>
      </div>
    );
  }

  const canManage = user?.role === 'admin' || event.organizerId === user?.id;
  const isTeamMember = user?.role === 'team_member';

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate('/')}>
          ← Back to Events
        </Button>
      </div>

      <Card>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="mt-2 text-gray-600">
              📅 {new Date(event.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Organized by {event.organizerName} • Reports retained for {event.retentionDays} days
            </p>
          </div>

          <div className="flex gap-3">
            {canManage && (
              <Button onClick={() => setShowCreateShift(true)}>
                + Create Shift
              </Button>
            )}
            {canManage && (
              <Button 
                variant="secondary" 
                onClick={() => navigate(`/events/${eventId}/reports`)}
              >
                View Reports
              </Button>
            )}
            {isTeamMember && (
              <Button onClick={() => navigate(`/events/${eventId}/submit-report`)}>
                Submit Report
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <Card title="Shifts" subtitle={`${shifts.length} shift${shifts.length !== 1 ? 's' : ''}`}>
          {shifts.length === 0 ? (
            <p className="text-gray-600 text-center py-4">No shifts created yet</p>
          ) : (
            <div className="space-y-3">
              {shifts.map((shift) => {
                const shiftMembers = users.filter(u => shift.teamMembers.includes(u.id));
                const userInShift = shift.teamMembers.includes(user?.id || '');
                
                return (
                  <div key={shift.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{shift.name}</h4>
                        {(shift.startTime || shift.endTime) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {shift.startTime && `From ${shift.startTime}`}
                            {shift.endTime && ` to ${shift.endTime}`}
                          </p>
                        )}
                      </div>
                      {userInShift && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          You're assigned
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-2">
                        {shift.teamMembers.length} team member{shift.teamMembers.length !== 1 ? 's' : ''}
                      </p>
                      {canManage ? (
                        <div className="space-y-2">
                          {shiftMembers.map(member => {
                            const reportLink = `${window.location.origin}/events/${eventId}/submit-report?shift=${shift.id}&member=${member.id}`;
                            return (
                              <div key={member.id} className="bg-gray-50 rounded p-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-gray-900">{member.name}</p>
                                    <p className="text-sm text-gray-600">{member.email}</p>
                                  </div>
                                </div>
                                <div className="mt-2 bg-white border border-gray-200 rounded p-2">
                                  <p className="text-xs text-gray-500 mb-1">Direct report link for this member:</p>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      readOnly
                                      value={reportLink}
                                      className="flex-1 text-xs px-2 py-1 bg-gray-50 border border-gray-300 rounded"
                                      onClick={(e) => e.currentTarget.select()}
                                    />
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(reportLink);
                                        alert('Link copied to clipboard!');
                                      }}
                                      className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                    >
                                      Copy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {shiftMembers.map(member => (
                            <span
                              key={member.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              {member.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Modal
        isOpen={showCreateShift}
        onClose={() => setShowCreateShift(false)}
        title="Create Shift"
        size="lg"
      >
        <form onSubmit={handleCreateShift} className="space-y-4">
          <Input
            label="Shift Name"
            type="text"
            required
            value={shiftName}
            onChange={(e) => setShiftName(e.target.value)}
            placeholder="Evening Shift"
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Time (optional)"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
            <Input
              label="End Time (optional)"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team Members
            </label>
            <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto p-3 space-y-2">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(u.id)}
                    onChange={() => toggleMember(u.id)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{u.name} ({u.email})</span>
                </label>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-2">No team members available</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Create Shift
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateShift(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
