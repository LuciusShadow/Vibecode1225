import { useState, useEffect } from 'react';
import { eventApi } from '../../services/api';
import type { Event } from '../../types';
import { Card } from '../../components/ui';
import { useNavigate } from 'react-router-dom';

export function EventList() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadEvents = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await eventApi.getAll();
      setEvents(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  if (isLoading) {
    return (
      <Card title="Events">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading events...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Events">
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card title="Events">
        <p className="text-gray-600 text-center py-8">No events yet. Create your first event!</p>
      </Card>
    );
  }

  return (
    <Card title="Events" subtitle={`${events.length} event${events.length !== 1 ? 's' : ''}`}>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            onClick={() => navigate(`/events/${event.id}`)}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-gray-900">{event.name}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Organized by {event.organizerName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  📅 {new Date(event.date).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {event.retentionDays} day retention
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
