'use client';

import { useState, useEffect } from 'react';
import {
  Instagram,
  Linkedin,
  Pin,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Link,
  Unlink,
  RefreshCw,
  Shield,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Platform, ConnectionStatus, PlatformConnection } from '@/types';
import { cn } from '@/lib/utils';

const PLATFORM_CONFIG = {
  INSTAGRAM: { name: 'Instagram', icon: Instagram, color: 'text-[hsl(var(--instagram))]', bg: 'bg-[hsl(var(--instagram-light))]' },
  LINKEDIN: { name: 'LinkedIn', icon: Linkedin, color: 'text-[hsl(var(--linkedin))]', bg: 'bg-[hsl(var(--linkedin-light))]' },
  PINTEREST: { name: 'Pinterest', icon: Pin, color: 'text-[hsl(var(--pinterest))]', bg: 'bg-[hsl(var(--pinterest-light))]' },
};

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; icon: React.ReactNode; color: string }> = {
  CONNECTED: { label: 'Connected', icon: <CheckCircle className="h-4 w-4 text-green-600" />, color: 'text-green-600' },
  EXPIRED: { label: 'Expired', icon: <AlertCircle className="h-4 w-4 text-yellow-600" />, color: 'text-yellow-600' },
  DISCONNECTED: { label: 'Disconnected', icon: <XCircle className="h-4 w-4 text-muted-foreground" />, color: 'text-muted-foreground' },
  PENDING: { label: 'Pending', icon: <Loader2 className="h-4 w-4 animate-spin text-blue-600" />, color: 'text-blue-600' },
  FAILED: { label: 'Failed', icon: <AlertCircle className="h-4 w-4 text-red-600" />, color: 'text-red-600' },
};

interface PlatformConnectionsProps {
  userId: string;
  connections: PlatformConnection[];
  onConnect: (platform: Platform) => void;
  onDisconnect: (platform: Platform) => void;
  onRefresh: (platform: Platform) => void;
}

export function PlatformConnections({
  userId,
  connections = [],
  onConnect,
  onDisconnect,
  onRefresh,
}: PlatformConnectionsProps) {
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [refreshing, setRefreshing] = useState<Platform | null>(null);

  const safeConnections = Array.isArray(connections) ? connections.filter(Boolean) : [];

  const getConnection = (platform: Platform) =>
    safeConnections.find((c) => c?.platform === platform);

  const handleConnect = async (platform: Platform) => {
    setConnecting(platform);
    try {
      await onConnect(platform);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: Platform) => {
    if (!confirm(`Disconnect ${platform}? This will remove your account connection.`)) return;
    try {
      await onDisconnect(platform);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleRefresh = async (platform: Platform) => {
    setRefreshing(platform);
    try {
      await onRefresh(platform);
    } finally {
      setRefreshing(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Platform Connections</h2>
        <Badge variant="outline" className="text-sm">
          {safeConnections.filter((c) => c?.status === 'CONNECTED').length} of 3 connected
        </Badge>
      </div>

      <p className="text-muted-foreground text-sm">
        Connect your social media accounts to schedule and publish posts directly. Each platform uses
        secure OAuth via Composio - we never store your credentials.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(['INSTAGRAM', 'LINKEDIN', 'PINTEREST'] as Platform[]).map((platform) => {
          const config = PLATFORM_CONFIG[platform];
          const connection = getConnection(platform);
          const status = connection?.status || 'DISCONNECTED';
          const statusConfig = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <Card
              key={platform}
              className={cn(
                'relative rounded-none border border-border transition-all duration-150',
                status === 'CONNECTED' ? 'border-primary bg-surface' : 'bg-card'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn('p-2.5 rounded-none border border-border bg-background')}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>
                    <div>
                      <CardTitle className="font-display text-base font-bold">{config.name}</CardTitle>
                      <CardDescription className="text-xs font-mono text-muted-foreground">
                        {status === 'CONNECTED'
                          ? ((connection?.metadata as Record<string, unknown>)?.username
                              ? `@${String((connection?.metadata as Record<string, unknown>)?.username)}`
                              : 'Connected via Composio')
                          : status === 'PENDING'
                          ? 'Connection pending'
                          : 'Not connected'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-mono font-medium px-2 py-0.5 rounded-none border flex items-center gap-1.5',
                        status === 'CONNECTED' ? 'badge-posted' : statusConfig.color
                      )}
                    >
                      {statusConfig.icon}
                      <span>{statusConfig.label}</span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {connection?.expiresAt && (
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {new Date(connection.expiresAt).toLocaleDateString()}
                  </div>
                )}

                <Separator />

                <div className="flex items-center gap-2">
                  {status === 'CONNECTED' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRefresh(platform)}
                        disabled={refreshing === platform}
                      >
                        {refreshing === platform ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Refresh
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDisconnect(platform)}
                        className="flex-1"
                      >
                        <Unlink className="h-4 w-4 mr-1" />
                        Disconnect
                      </Button>
                    </>
                  ) : status === 'PENDING' ? (
                    <div className="flex items-center gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleRefresh(platform)}
                        disabled={refreshing === platform}
                      >
                        {refreshing === platform ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-4 w-4 mr-1" />
                        )}
                        Check Status
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleConnect(platform)}
                        disabled={connecting === platform}
                      >
                        {connecting === platform ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Link className="h-4 w-4 mr-1" />
                        )}
                        Retry Connect
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleConnect(platform)}
                      disabled={connecting === platform}
                    >
                      {connecting === platform ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Link className="h-4 w-4 mr-1" />
                          Connect {config.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {status === 'EXPIRED' && (
                  <div className="p-2 bg-surface border border-yellow-500 rounded-none text-xs font-mono text-yellow-500">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Token expired. Reconnect to continue publishing.
                  </div>
                )}

                {status === 'FAILED' && connection?.errorMessage && (
                  <div className="p-2 bg-surface border border-destructive rounded-none text-xs font-mono text-destructive">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    {connection.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• All connections use OAuth 2.0 via Composio - we never see your passwords</p>
          <p>• Tokens are encrypted at rest and only used for publishing your posts</p>
          <p>• You can revoke access anytime from this page or the platform's settings</p>
          <p>• Each platform connection is isolated per user account</p>
        </CardContent>
      </Card>
    </div>
  );
}