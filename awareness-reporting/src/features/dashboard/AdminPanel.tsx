import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { invitationApi, gdprApi } from '../../services/api';
import type { Invitation, GDPRSettings } from '../../types';
import { Button, Card, Input } from '../../components/ui';

export function AdminPanel() {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [gdprSettings, setGdprSettings] = useState<GDPRSettings | null>(null);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'organizer' | 'team_member'>('team_member');
  const [isLoading, setIsLoading] = useState(false);
  const [retentionDays, setRetentionDays] = useState('');
  const [inviteExpHours, setInviteExpHours] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invites, settings] = await Promise.all([
        invitationApi.getAll(),
        gdprApi.getSettings(),
      ]);
      setInvitations(invites);
      setGdprSettings(settings);
      setRetentionDays(settings.defaultRetentionDays.toString());
      setInviteExpHours(settings.inviteExpirationHours.toString());
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      await invitationApi.create(email, role, user.id);
      setEmail('');
      alert(`Invitation sent to ${email}! Share this link:\n${window.location.origin}/accept-invitation?token=[token]`);
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGDPR = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await gdprApi.updateSettings({
        defaultRetentionDays: parseInt(retentionDays),
        inviteExpirationHours: parseInt(inviteExpHours),
      });
      alert('GDPR settings updated successfully!');
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <p className="text-red-600">Access denied. Admin privileges required.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>

      <Card title="Send Invitation">
        <form onSubmit={handleSendInvite} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'organizer' | 'team_member')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="team_member">Team Member</option>
              <option value="organizer">Organizer</option>
            </select>
          </div>

          <Button type="submit" isLoading={isLoading}>
            Send Invitation
          </Button>
        </form>
      </Card>

      <Card title="GDPR Settings">
        <form onSubmit={handleUpdateGDPR} className="space-y-4">
          <Input
            label="Default Retention Period (days)"
            type="number"
            min="1"
            required
            value={retentionDays}
            onChange={(e) => setRetentionDays(e.target.value)}
            helperText="Reports will be deleted this many days after the event date"
          />

          <Input
            label="Invitation Expiration (hours)"
            type="number"
            min="1"
            required
            value={inviteExpHours}
            onChange={(e) => setInviteExpHours(e.target.value)}
            helperText="Invitation links will expire after this duration"
          />

          <Button type="submit" isLoading={isLoading}>
            Update Settings
          </Button>
        </form>
      </Card>

      <Card 
        title="Recent Invitations" 
        subtitle={`${invitations.length} invitation${invitations.length !== 1 ? 's' : ''}`}
      >
        {invitations.length === 0 ? (
          <p className="text-gray-600 text-center py-4">No invitations sent yet</p>
        ) : (
          <div className="space-y-3">
            {invitations.slice(0, 10).map((inv) => (
              <div key={inv.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{inv.email}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Role: {inv.role.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Expires: {new Date(inv.expiresAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {inv.accepted && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Accepted
                      </span>
                    )}
                    {inv.declined && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Declined
                      </span>
                    )}
                    {!inv.accepted && !inv.declined && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {!inv.accepted && !inv.declined && (
                  <div className="mt-3 bg-gray-50 rounded p-2">
                    <p className="text-xs text-gray-600 break-all">
                      Link: {window.location.origin}/accept-invitation?token={inv.token}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
