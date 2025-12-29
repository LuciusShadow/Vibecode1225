import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { EventList } from '../events/EventList';
import { CreateEventForm } from '../events/CreateEventForm';

export function HomePage() {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = React.useState(0);

  const handleEventCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  const canCreateEvents = user?.role === 'admin' || user?.role === 'organizer';

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
        <p className="mt-2 text-gray-600">
          {user?.role === 'admin' && 'Manage events, users, and system settings.'}
          {user?.role === 'organizer' && 'Create events, manage shifts, and view reports.'}
          {user?.role === 'team_member' && 'View your assigned shifts and submit incident reports.'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <EventList key={refreshKey} />
        </div>
        {canCreateEvents && (
          <div>
            <CreateEventForm onSuccess={handleEventCreated} />
          </div>
        )}
      </div>
    </div>
  );
}
