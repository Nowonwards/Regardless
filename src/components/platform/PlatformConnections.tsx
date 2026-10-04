'use client';

import { useState, useEffect } from 'react';
import {
  Instagram,
  Linkedin,
  CheckCircle2,
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
  INSTAGRAM: {
    name: 'Instagram',
    icon: (props: { className?: string }) => <Instagram className={props.className} />,
    color: 'text-[#E1306C]',
  },
  LINKEDIN: {
    name: 'LinkedIn',
    icon: (props: { className?: string }) => <Linkedin className={props.className} />,
    color: 'text-[#0A66C2]',
  },
  PINTEREST: {
    name: 'Pinterest',
    icon: (props: { className?: string }) => (
      <span className={cn('inline-flex items-center justify-center border border-current font-mono font-bold text-[11px] leading-none', props.className)}>
        P
      </span>
    ),
    color: 'text-[#E60023]',
  },
};

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; icon: React.ReactNode; badgeClass: string }> = {
  CONNECTED: { label: 'CONNECTED', icon: <CheckCircle2 className="h-3.5 w-3.5" />, badgeClass: 'badge-posted border' },
  EXPIRED: { label: 'EXPIRED', icon: <AlertCircle className="h-3.5 w-3.5" />, badgeClass: 'badge-in_revision border' },
  DISCONNECTED: { label: 'DISCONNECTED', icon: <XCircle className="h-3.5 w-3.5" />, badgeClass: 'badge-drafted border' },
  PENDING: { label: 'PENDING', icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, badgeClass: 'badge-scheduled border' },
  FAILED: { label: 'FAILED', icon: <AlertCircle className="h-3.5 w-3.5" />, badgeClass: 'badge-failed border' },
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
        <h2 className="text-xl font-bold font-display">Platform Connections</h2>
        <Badge variant="outline" className="text-xs font-mono border">
          {safeConnections.filter((c) => c?.status === 'CONNECTED').length} of 3 connected
        </Badge>
      </div>

      <p className="text-muted-foreground text-xs font-mono">
        Connect your social media accounts to schedule and publish posts directly. Each platform uses
        secure OAuth via Composio - credentials are never stored locally.
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
                'relative rounded-none border border-border transition-all duration-100 hover:shadow-[4px_4px_0_0_var(--border)]',
                status === 'CONNECTED' ? 'bg-surface' : 'bg-card'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-none border border-border bg-card">
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
                        'text-[10px] font-mono font-bold px-2 py-0.5 rounded-none flex items-center gap-1.5',
                        statusConfig.badgeClass
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
                  <div className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Expires: {new Date(connection.expiresAt).toLocaleDateString()}
                  </div>
                )}

                <Separator className="border-border/60" />

                <div className="flex items-center gap-2">
                  {status === 'CONNECTED' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-none border border-border font-mono text-xs font-semibold"
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
                        className="flex-1 rounded-none border border-border font-mono text-xs font-semibold"
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
                        className="flex-1 rounded-none border border-border font-mono text-xs font-semibold"
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
                        className="flex-1 rounded-none border border-border bg-primary text-primary-foreground font-mono text-xs font-bold"
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
                      className="w-full rounded-none border border-border bg-primary text-primary-foreground font-mono text-xs font-bold hover:shadow-[2px_2px_0_0_var(--border)]"
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
                  <div className="p-2 bg-highlight text-ink border border-border rounded-none text-xs font-mono font-semibold">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    Token expired. Reconnect to continue publishing.
                  </div>
                )}

                {status === 'FAILED' && connection?.errorMessage && (
                  <div className="p-2 bg-destructive text-white border border-border rounded-none text-xs font-mono">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1" />
                    {connection.errorMessage}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-none border border-border shadow-[4px_4px_0_0_var(--border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-base font-bold">
            <Shield className="h-5 w-5 text-accent" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1.5 text-xs font-mono text-muted-foreground">
          <p>• All connections use OAuth 2.0 via Composio - we never see your passwords</p>
          <p>• Tokens are encrypted at rest and only used for publishing your posts</p>
          <p>• You can revoke access anytime from this page or the platform settings</p>
          <p>• Each platform connection is isolated per user account</p>
        </CardContent>
      </Card>
    </div>
  );
}