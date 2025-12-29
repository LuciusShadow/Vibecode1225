import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { eventApi, gdprApi } from '../../services/api';
import { Input, Button, Card } from '../../components/ui';

interface CreateEventFormProps {
  onSuccess: () => void;
}

export function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [retentionDays, setRetentionDays] = useState('');
  const [useDefault, setUseDefault] = useState(true);
  const [defaultRetention, setDefaultRetention] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    gdprApi.getSettings().then(settings => {
      setDefaultRetention(settings.defaultRetentionDays);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setIsLoading(true);

    try {
      const retention = useDefault ? undefined : parseInt(retentionDays);
      await eventApi.create(name, date, user.id, retention);
      setName('');
      setDate('');
      setRetentionDays('');
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card title="Create New Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Input
          label="Event Name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Summer Festival 2025"
        />

        <Input
          label="Event Date"
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />

        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={useDefault}
              onChange={(e) => setUseDefault(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              Use default retention period ({defaultRetention} days)
            </span>
          </label>

          {!useDefault && (
            <Input
              label="Custom Retention Period (days)"
              type="number"
              min="1"
              required
              value={retentionDays}
              onChange={(e) => setRetentionDays(e.target.value)}
              helperText="Reports will be automatically deleted after this many days from the event date"
            />
          )}
        </div>

        <Button type="submit" isLoading={isLoading} className="w-full">
          Create Event
        </Button>
      </form>
    </Card>
  );
}
