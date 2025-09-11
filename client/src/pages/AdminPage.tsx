import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Users, AlertTriangle, Download, Search } from 'lucide-react';

interface Violation {
  _id: string;
  userId: { username: string; email: string; accountStatus: string };
  violationType: string;
  severity: string;
  violatingMessage: string;
  detectedPatterns: string[];
  timestamp: string;
  actionTaken: string;
}

interface DashboardStats {
  statistics: {
    totalViolations: number;
    violations24h: number;
    violations7d: number;
    violations30d: number;
    ageViolations30d: number;
    bannedUsers: number;
    suspendedUsers: number;
  };
  recentViolations: Violation[];
}

export default function AdminPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [banUserId, setBanUserId] = useState('');
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary');
  const [banReason, setBanReason] = useState<string>('age_violation');
  const [banDuration, setBanDuration] = useState('168'); // 7 days
  const [banMessage, setBanMessage] = useState('');
  const [banEvidence, setBanEvidence] = useState('');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('medusavr_access_token');
      const response = await fetch('/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!banUserId || !banEvidence) {
      setError('User ID and evidence are required');
      return;
    }

    try {
      const token = localStorage.getItem('medusavr_access_token');
      const response = await fetch(`/api/admin/users/${banUserId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          banType,
          banReason,
          customMessage: banMessage,
          banDurationHours: banType === 'temporary' ? parseInt(banDuration) : undefined,
          evidence: {
            violatingMessage: banEvidence,
            detectedPatterns: ['admin_action'],
            endpoint: 'admin_panel'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to ban user');
      }

      alert('User banned successfully');
      setBanUserId('');
      setBanEvidence('');
      setBanMessage('');
      fetchDashboard(); // Refresh stats
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to ban user');
    }
  };

  const downloadComplianceReport = async (userId: string) => {
    try {
      const token = localStorage.getItem('medusavr_access_token');
      const response = await fetch(`/api/admin/users/${userId}/compliance-report`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `compliance_report_${userId}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download report');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading admin dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      </div>

      {stats && (
        <>
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.statistics.totalViolations}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.statistics.violations24h} in last 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Age Violations (30d)</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.statistics.ageViolations30d}</div>
                <p className="text-xs text-muted-foreground">
                  Critical violations requiring immediate action
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Banned Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.statistics.bannedUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Permanent bans
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
                <Users className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.statistics.suspendedUsers}</div>
                <p className="text-xs text-muted-foreground">
                  Temporary bans
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Ban User Form */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Ban User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="banUserId">User ID</Label>
                  <Input
                    id="banUserId"
                    value={banUserId}
                    onChange={(e) => setBanUserId(e.target.value)}
                    placeholder="Enter user ID to ban"
                  />
                </div>

                <div>
                  <Label htmlFor="banType">Ban Type</Label>
                  <Select value={banType} onValueChange={(value: 'temporary' | 'permanent') => setBanType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temporary">Temporary</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="banReason">Ban Reason</Label>
                  <Select value={banReason} onValueChange={setBanReason}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="age_violation">Age Violation</SelectItem>
                      <SelectItem value="repeated_violations">Repeated Violations</SelectItem>
                      <SelectItem value="terms_violation">Terms Violation</SelectItem>
                      <SelectItem value="admin_action">Admin Action</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {banType === 'temporary' && (
                  <div>
                    <Label htmlFor="banDuration">Duration (hours)</Label>
                    <Input
                      id="banDuration"
                      type="number"
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      placeholder="168"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="banMessage">Custom Ban Message (optional)</Label>
                <Input
                  id="banMessage"
                  value={banMessage}
                  onChange={(e) => setBanMessage(e.target.value)}
                  placeholder="Custom message shown to user"
                />
              </div>

              <div>
                <Label htmlFor="banEvidence">Evidence/Reason</Label>
                <Textarea
                  id="banEvidence"
                  value={banEvidence}
                  onChange={(e) => setBanEvidence(e.target.value)}
                  placeholder="Enter the violating content or reason for ban"
                  required
                />
              </div>

              <Button onClick={handleBanUser} className="w-full">
                Ban User
              </Button>
            </CardContent>
          </Card>

          {/* Recent Violations */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Violations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentViolations.map((violation) => (
                  <div key={violation._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={violation.severity === 'critical' ? 'destructive' : 'secondary'}>
                          {violation.violationType}
                        </Badge>
                        <Badge variant="outline">
                          {violation.severity}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {violation.userId.username} ({violation.userId.email})
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={violation.userId.accountStatus === 'banned' ? 'destructive' : 'default'}>
                          {violation.userId.accountStatus}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadComplianceReport(violation.userId.toString())}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>Message:</strong> {violation.violatingMessage.substring(0, 200)}
                      {violation.violatingMessage.length > 200 && '...'}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Patterns:</strong> {violation.detectedPatterns.join(', ')}
                    </p>
                    <p className="text-sm text-gray-500">
                      <strong>Action:</strong> {violation.actionTaken} • 
                      <strong> Time:</strong> {new Date(violation.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
