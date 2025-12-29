import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { eventApi, shiftApi, reportApi, userApi } from '../../services/api';
import type { Event, Shift } from '../../types';
import { Button, Card, TextArea } from '../../components/ui';
import { detectPII, getPIIWarningMessage } from '../../utils/piiDetection';

export function SubmitReport() {
  const { eventId } = useParams<{ eventId: string }>();
  const [searchParams] = useSearchParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedShift, setSelectedShift] = useState('');
  const [memberId, setMemberId] = useState('');
  const [memberName, setMemberName] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [piiWarning, setPiiWarning] = useState('');
  const [hasPII, setHasPII] = useState(false);
  const [acknowledgedPII, setAcknowledgedPII] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId) return;

    // Get shift and member from URL params (required for public access)
    const shiftParam = searchParams.get('shift');
    const memberParam = searchParams.get('member');

    if (!shiftParam || !memberParam) {
      setError('Invalid report link. Please use the link provided by your event organizer.');
      setIsLoading(false);
      return;
    }

    setMemberId(memberParam);

    Promise.all([
      eventApi.getById(eventId),
      shiftApi.getByEvent(eventId),
      userApi.getAll(),
    ]).then(([eventData, shiftsData, usersData]) => {
      setEvent(eventData);
      setShifts(shiftsData);
      
      // Verify shift exists and member is assigned
      const shift = shiftsData.find(s => s.id === shiftParam);
      if (!shift) {
        setError('Shift not found.');
        setIsLoading(false);
        return;
      }

      if (!shift.teamMembers.includes(memberParam)) {
        setError('You are not assigned to this shift.');
        setIsLoading(false);
        return;
      }

      const member = usersData.find(u => u.id === memberParam);
      if (member) {
        setMemberName(member.name);
      }

      setSelectedShift(shiftParam);
      setIsLoading(false);
    }).catch(err => {
      setError('Failed to load event details.');
      setIsLoading(false);
    });
  }, [eventId, searchParams]);

  useEffect(() => {
    // Check for PII whenever description changes
    if (incidentDescription.trim().length > 10) {
      const result = detectPII(incidentDescription);
      setHasPII(result.hasPII);
      setPiiWarning(getPIIWarningMessage(result));
      setAcknowledgedPII(false);
    } else {
      setHasPII(false);
      setPiiWarning('');
      setAcknowledgedPII(false);
    }
  }, [incidentDescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventId || !memberId || !selectedShift) return;

    if (hasPII && !acknowledgedPII) {
      alert('Please acknowledge the PII warning before submitting');
      return;
    }

    setIsSubmitting(true);
    try {
      await reportApi.submit(eventId, selectedShift, memberId, incidentDescription, hasPII);
      alert('Report submitted successfully! Thank you.');
      setIncidentDescription('');
      setPiiWarning('');
      setHasPII(false);
      setAcknowledgedPII(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card>
          <div className="text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Report Form</h2>
            <p className="text-red-600">{error || 'Event not found'}</p>
            <p className="text-sm text-gray-500 mt-4">
              Please contact your event organizer for a valid report link.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const selectedShiftData = shifts.find(s => s.id === selectedShift);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <p className="text-gray-600 mt-1">
            📅 {new Date(event.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          {selectedShiftData && (
            <p className="text-sm text-gray-500 mt-2">
              Shift: <span className="font-medium">{selectedShiftData.name}</span>
              {selectedShiftData.startTime && ` • ${selectedShiftData.startTime}`}
              {selectedShiftData.endTime && ` - ${selectedShiftData.endTime}`}
            </p>
          )}
          {memberName && (
            <p className="text-sm text-gray-500 mt-1">
              Submitting as: <span className="font-medium">{memberName}</span>
            </p>
          )}
        </div>

        <Card title="Submit Incident Report">
          <form onSubmit={handleSubmit} className="space-y-6">
            <TextArea
              label="Incident Description"
              required
              rows={8}
              value={incidentDescription}
              onChange={(e) => setIncidentDescription(e.target.value)}
              placeholder="Describe the incident that occurred. Focus on factual observations and avoid including unnecessary personal information."
              helperText="Be objective and factual. Only include necessary details for incident documentation."
            />

            {piiWarning && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">{piiWarning}</p>
                    <label className="flex items-center gap-2 mt-3">
                      <input
                        type="checkbox"
                        checked={acknowledgedPII}
                        onChange={(e) => setAcknowledgedPII(e.target.checked)}
                        className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-yellow-800 font-medium">
                        I acknowledge this warning and confirm the information is necessary
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-800">
                <strong>GDPR Notice:</strong> Your report will be stored for {event.retentionDays} days from the event date and then automatically deleted. Only the event organizer and you can view this report.
              </p>
            </div>

            <div>
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={hasPII && !acknowledgedPII}
                className="w-full"
              >
                Submit Report
              </Button>
            </div>
          </form>
        </Card>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This form is private and secure. Only the event organizer and you can view your submission.
          </p>
        </div>
      </div>
    </div>
  );
}
