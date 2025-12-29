import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventApi, reportApi, shiftApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import type { Event, Report, Shift } from '../../types';
import { Button, Card } from '../../components/ui';

export function ReportsDashboard() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<Event | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!eventId || !user) return;

    Promise.all([
      eventApi.getById(eventId),
      reportApi.getByEvent(eventId),
      shiftApi.getByEvent(eventId),
    ])
      .then(([eventData, reportsData, shiftsData]) => {
        setEvent(eventData);
        setReports(reportsData);
        setShifts(shiftsData);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load reports');
        setIsLoading(false);
      });
  }, [eventId, user]);

  const getShiftName = (shiftId: string) => {
    return shifts.find(s => s.id === shiftId)?.name || 'Unknown Shift';
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-800">{error}</p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/')} className="mt-4">
            Back to Events
          </Button>
        </Card>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Card>
          <p className="text-red-600">Event not found</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="secondary" onClick={() => navigate(`/events/${eventId}`)}>
          ← Back to Event
        </Button>
      </div>

      <Card>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <h2 className="text-xl text-gray-700 mt-2">Incident Reports Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">
            {reports.length} report{reports.length !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="mt-2 text-gray-600">No reports submitted yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {report.submittedByName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Shift: {getShiftName(report.shiftId)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(report.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {report.hasPotentialPII && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠️ May contain PII
                    </span>
                  )}
                </div>

                <div className="mt-4 bg-gray-50 rounded p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Incident Description:</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {report.incidentDescription}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6">
        <Card>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>GDPR Information:</strong> All reports will be automatically deleted {event.retentionDays} days after the event date ({new Date(event.date).toLocaleDateString()}). Only you (as the event organizer) and the report submitters can view these reports.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
