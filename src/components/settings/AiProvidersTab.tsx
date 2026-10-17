'use client';

import { useState, useEffect } from 'react';
import {
  Sparkles,
  Video,
  Image as ImageIcon,
  Key,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Shield,
  Layers,
  Sliders,
  Check,
  Save,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  ReelProvider,
  SlideProvider,
  TextProvider,
  UserAiConfigResponse,
} from '@/lib/ai-config';

interface ProviderCardProps {
  id: 'ollama' | 'higgsfield' | 'composio';
  name: string;
  tagline: string;
  badgeLabel: string;
  connected: boolean;
  apiKeyInput: string;
  onApiKeyChange: (val: string) => void;
  apiKeyPlaceholder: string;
  extraFieldLabel?: string;
  extraFieldValue?: string;
  onExtraFieldChange?: (val: string) => void;
  extraFieldPlaceholder?: string;
  modelValue?: string;
  onModelChange?: (val: string) => void;
  capabilities: string[];
  testing: boolean;
  onTest: () => void;
  testResult: { success: boolean; message: string } | null;
  onDisconnect: () => void;
}

/**
 * Renders an AI Provider configuration card.
 */
function ProviderCard({
  id,
  name,
  tagline,
  badgeLabel,
  connected,
  apiKeyInput,
  onApiKeyChange,
  apiKeyPlaceholder,
  extraFieldLabel,
  extraFieldValue,
  onExtraFieldChange,
  extraFieldPlaceholder,
  modelValue,
  onModelChange,
  capabilities,
  testing,
  onTest,
  testResult,
  onDisconnect,
}: ProviderCardProps) {
  return (
    <Card
      className={cn(
        'relative rounded-none border border-border transition-all duration-100',
        'hover:shadow-[4px_4px_0_0_var(--border)]',
        connected ? 'bg-surface' : 'bg-card'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-none border border-border bg-card">
              {id === 'ollama' && <span className="font-mono font-bold text-sm">🦙</span>}
              {id === 'higgsfield' && <Sparkles className="h-5 w-5 text-amber-500" />}
              {id === 'composio' && <Layers className="h-5 w-5 text-indigo-500" />}
            </div>
            <div>
              <CardTitle className="text-base font-bold font-display">{name}</CardTitle>
              <CardDescription className="text-xs font-mono">{tagline}</CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              'text-[10px] font-mono font-bold uppercase tracking-wider border px-2 py-0.5',
              connected
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-muted text-muted-foreground border-border'
            )}
          >
            {connected ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> CONNECTED
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <XCircle className="h-3 w-3" /> NOT CONNECTED
              </span>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        <div className="flex flex-wrap gap-1.5">
          {capabilities.map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 bg-accent/40 border border-border font-mono text-[10px] text-muted-foreground"
            >
              {cap}
            </span>
          ))}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-mono font-bold uppercase tracking-wider">
            {badgeLabel}
          </Label>
          <Input
            type="password"
            value={apiKeyInput}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder={apiKeyPlaceholder}
            className="rounded-none border border-border bg-background font-mono text-xs"
          />
        </div>

        {extraFieldLabel && onExtraFieldChange && (
          <div className="space-y-2">
            <Label className="text-xs font-mono font-bold uppercase tracking-wider">
              {extraFieldLabel}
            </Label>
            <Input
              type="text"
              value={extraFieldValue || ''}
              onChange={(e) => onExtraFieldChange(e.target.value)}
              placeholder={extraFieldPlaceholder}
              className="rounded-none border border-border bg-background font-mono text-xs"
            />
          </div>
        )}

        {modelValue !== undefined && onModelChange && (
          <div className="space-y-2">
            <Label className="text-xs font-mono font-bold uppercase tracking-wider">
              Default Model
            </Label>
            <Input
              type="text"
              value={modelValue}
              onChange={(e) => onModelChange(e.target.value)}
              className="rounded-none border border-border bg-background font-mono text-xs"
            />
          </div>
        )}

        {testResult && (
          <div
            className={cn(
              'p-2.5 border text-xs font-mono flex items-start gap-2',
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-destructive/10 border-destructive/30 text-destructive'
            )}
          >
            {testResult.success ? (
              <Check className="h-4 w-4 shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTest}
            disabled={testing}
            className="flex-1 rounded-none border border-border font-mono text-xs font-bold uppercase"
          >
            {testing ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> TESTING...
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> TEST CONNECTION
              </span>
            )}
          </Button>

          {connected && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDisconnect}
              className="rounded-none border border-destructive/30 text-destructive hover:bg-destructive/10 font-mono text-xs font-bold uppercase"
            >
              DISCONNECT
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface RoutingCardOptionProps {
  label: string;
  desc: string;
  tag: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * Renders an option card for task routing.
 */
function RoutingOption({ label, desc, tag, selected, onClick }: RoutingCardOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 border transition-all duration-100 flex items-start justify-between gap-3',
        selected
          ? 'border-primary bg-primary/10 shadow-[2px_2px_0_0_var(--primary)]'
          : 'border-border bg-card hover:bg-accent/40'
      )}
    >
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-bold font-mono text-xs uppercase tracking-wider">{label}</p>
          <span className="px-1.5 py-0.2 border border-border font-mono text-[9px] text-muted-foreground uppercase">
            {tag}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-snug">{desc}</p>
      </div>
      <div
        className={cn(
          'w-4 h-4 rounded-none border flex items-center justify-center shrink-0 mt-0.5',
          selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
        )}
      >
        {selected && <Check className="h-3 w-3 stroke-[3]" />}
      </div>
    </button>
  );
}

/**
 * Main AI Providers and Model Routing component.
 */
export function AiProvidersTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Provider Keys & States
  const [ollamaKey, setOllamaKey] = useState('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('https://api.ollama.com');
  const [ollamaModel, setOllamaModel] = useState('gemma4:31b');
  const [ollamaConnected, setOllamaConnected] = useState(false);

  const [hfKey, setHfKey] = useState('');
  const [hfConnected, setHfConnected] = useState(false);

  const [composioKey, setComposioKey] = useState('');
  const [composioConnected, setComposioConnected] = useState(false);

  // Routing preferences
  const [reelProvider, setReelProvider] = useState<ReelProvider>('higgsfield');
  const [slideProvider, setSlideProvider] = useState<SlideProvider>('composio_gemini');
  const [textProvider, setTextProvider] = useState<TextProvider>('ollama');

  // Test states
  const [testingOllama, setTestingOllama] = useState(false);
  const [testResultOllama, setTestResultOllama] = useState<{ success: boolean; message: string } | null>(null);

  const [testingHf, setTestingHf] = useState(false);
  const [testResultHf, setTestResultHf] = useState<{ success: boolean; message: string } | null>(null);

  const [testingComposio, setTestingComposio] = useState(false);
  const [testResultComposio, setTestResultComposio] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  /**
   * Loads AI configurations from backend.
   */
  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/settings/ai');
      const data = await res.json();
      if (data.config) {
        const c: UserAiConfigResponse = data.config;
        setOllamaKey(c.ollama.apiKeyMasked || '');
        setOllamaBaseUrl(c.ollama.baseUrl || 'https://api.ollama.com');
        setOllamaModel(c.ollama.model || 'gemma4:31b');
        setOllamaConnected(c.ollama.connected);

        setHfKey(c.higgsfield.apiKeyMasked || '');
        setHfConnected(c.higgsfield.connected);

        setComposioKey(c.composio.apiKeyMasked || '');
        setComposioConnected(c.composio.connected);

        if (c.routing) {
          setReelProvider(c.routing.reelProvider || 'higgsfield');
          setSlideProvider(c.routing.slideProvider || 'composio_gemini');
          setTextProvider(c.routing.textProvider || 'ollama');
        }
      }
    } catch (e) {
      console.error('Failed to fetch AI settings:', e);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tests a provider connection.
   */
  const handleTestProvider = async (provider: 'ollama' | 'higgsfield' | 'composio') => {
    if (provider === 'ollama') {
      setTestingOllama(true);
      setTestResultOllama(null);
      try {
        const res = await fetch('/api/settings/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'ollama',
            apiKey: ollamaKey,
            baseUrl: ollamaBaseUrl,
            model: ollamaModel,
          }),
        });
        const data = await res.json();
        setTestResultOllama(data);
        if (data.success) setOllamaConnected(true);
      } catch {
        setTestResultOllama({ success: false, message: 'Network test failed' });
      } finally {
        setTestingOllama(false);
      }
    }

    if (provider === 'higgsfield') {
      setTestingHf(true);
      setTestResultHf(null);
      try {
        const res = await fetch('/api/settings/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'higgsfield', credentials: hfKey }),
        });
        const data = await res.json();
        setTestResultHf(data);
        if (data.success) setHfConnected(true);
      } catch {
        setTestResultHf({ success: false, message: 'Network test failed' });
      } finally {
        setTestingHf(false);
      }
    }

    if (provider === 'composio') {
      setTestingComposio(true);
      setTestResultComposio(null);
      try {
        const res = await fetch('/api/settings/ai/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'composio', apiKey: composioKey }),
        });
        const data = await res.json();
        setTestResultComposio(data);
        if (data.success) setComposioConnected(true);
      } catch {
        setTestResultComposio({ success: false, message: 'Network test failed' });
      } finally {
        setTestingComposio(false);
      }
    }
  };

  /**
   * Saves updated AI provider settings and routing choices.
   */
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ollamaApiKey: ollamaKey,
          ollamaBaseUrl: ollamaBaseUrl,
          ollamaModel: ollamaModel,
          higgsfieldKey: hfKey,
          composioApiKey: composioKey,
          reelProvider,
          slideProvider,
          textProvider,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
        fetchConfig();
      }
    } catch (e) {
      console.error('Failed to save AI configuration:', e);
    } finally {
      setSaving(false);
    }
  };

  const connectedCount = [ollamaConnected, hfConnected, composioConnected].filter(Boolean).length;

  if (loading) {
    return (
      <Card className="rounded-none border border-border">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stat & Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold font-display">AI Provider Connections</h2>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">
            Connect Ollama Cloud, Higgsfield AI, and Composio (Google Gemini & Veo).
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-mono border self-start sm:self-auto">
          {connectedCount} OF 3 CONNECTED
        </Badge>
      </div>

      {/* 3 Provider Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Ollama Cloud */}
        <ProviderCard
          id="ollama"
          name="Ollama Cloud"
          tagline="Text & idea generation, chat streaming"
          badgeLabel="Ollama Cloud API Key"
          connected={ollamaConnected}
          apiKeyInput={ollamaKey}
          onApiKeyChange={setOllamaKey}
          apiKeyPlaceholder="ollama_api_..."
          extraFieldLabel="Ollama Base URL"
          extraFieldValue={ollamaBaseUrl}
          onExtraFieldChange={setOllamaBaseUrl}
          extraFieldPlaceholder="https://api.ollama.com"
          modelValue={ollamaModel}
          onModelChange={setOllamaModel}
          capabilities={['Ideation', 'Post Copy', 'Streaming Chat']}
          testing={testingOllama}
          onTest={() => handleTestProvider('ollama')}
          testResult={testResultOllama}
          onDisconnect={() => {
            setOllamaKey('');
            setOllamaConnected(false);
          }}
        />

        {/* Higgsfield AI */}
        <ProviderCard
          id="higgsfield"
          name="Higgsfield AI"
          tagline="Cinema-grade video reels & slide visuals"
          badgeLabel="Higgsfield Credentials / Key"
          connected={hfConnected}
          apiKeyInput={hfKey}
          onApiKeyChange={setHfKey}
          apiKeyPlaceholder="hf_credentials_..."
          capabilities={['Seedance 2.5 Reels', 'Soul Text2Image', '9:16 Video']}
          testing={testingHf}
          onTest={() => handleTestProvider('higgsfield')}
          testResult={testResultHf}
          onDisconnect={() => {
            setHfKey('');
            setHfConnected(false);
          }}
        />

        {/* Composio & Google Gemini */}
        <ProviderCard
          id="composio"
          name="Composio (Gemini & Veo)"
          tagline="Gemini Flash, Flash Image & Google Veo"
          badgeLabel="Composio API Key"
          connected={composioConnected}
          apiKeyInput={composioKey}
          onApiKeyChange={setComposioKey}
          apiKeyPlaceholder="comp_api_..."
          capabilities={['Gemini 2.5 Flash', 'Gemini Flash Image', 'Google Veo Video']}
          testing={testingComposio}
          onTest={() => handleTestProvider('composio')}
          testResult={testResultComposio}
          onDisconnect={() => {
            setComposioKey('');
            setComposioConnected(false);
          }}
        />
      </div>

      {/* Task Routing Matrix ("Set which one to use for what exactly") */}
      <Card className="rounded-none border border-border bg-card">
        <CardHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold font-display">
              AI Task Routing Matrix
            </CardTitle>
          </div>
          <CardDescription className="text-xs font-mono">
            Specify exactly which connected engine to use for each generation task in Regardless.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* 1. Reel / Video Creation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-amber-500" />
              <Label className="text-xs font-mono font-bold uppercase tracking-wider">
                1. Reel Creation & Video Engine
              </Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RoutingOption
                label="Higgsfield AI"
                tag="Cinematic"
                desc="Seedance 2.5 text-to-video. Cinema-grade photoreal 9:16 motion visuals."
                selected={reelProvider === 'higgsfield'}
                onClick={() => setReelProvider('higgsfield')}
              />
              <RoutingOption
                label="Composio Google Veo"
                tag="Veo Engine"
                desc="Google Veo cinematic video generation via Composio GEMINI_GENERATE_VIDEOS."
                selected={reelProvider === 'composio_gemini'}
                onClick={() => setReelProvider('composio_gemini')}
              />
              <RoutingOption
                label="Local Motion Canvas"
                tag="Instant SVG"
                desc="High-performance programmatic animated canvas. Zero latency."
                selected={reelProvider === 'local_motion'}
                onClick={() => setReelProvider('local_motion')}
              />
            </div>
          </div>

          {/* 2. Slide Images */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-indigo-500" />
              <Label className="text-xs font-mono font-bold uppercase tracking-wider">
                2. Images for Carousel Slides
              </Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RoutingOption
                label="Composio Google Gemini"
                tag="Gemini Image"
                desc="Gemini 2.5 Flash Image. Visual compositions tailored for tech slides."
                selected={slideProvider === 'composio_gemini'}
                onClick={() => setSlideProvider('composio_gemini')}
              />
              <RoutingOption
                label="Higgsfield AI"
                tag="Soul Text2Image"
                desc="Soul Text2Image generation. Hyper-detailed editorial social graphics."
                selected={slideProvider === 'higgsfield'}
                onClick={() => setSlideProvider('higgsfield')}
              />
              <RoutingOption
                label="Typography OG Engine"
                tag="Programmatic"
                desc="High-contrast branded typography cards with sharp editorial aesthetics."
                selected={slideProvider === 'og_typography'}
                onClick={() => setSlideProvider('og_typography')}
              />
            </div>
          </div>

          {/* 3. Text & Copy Generation */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-emerald-500" />
              <Label className="text-xs font-mono font-bold uppercase tracking-wider">
                3. Text, Post Copy & Ideation Chat
              </Label>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <RoutingOption
                label="Ollama Cloud"
                tag="Cloud Gemma / Llama"
                desc="High speed, precision tech drafting via Ollama Cloud API Key."
                selected={textProvider === 'ollama'}
                onClick={() => setTextProvider('ollama')}
              />
              <RoutingOption
                label="Composio Google Gemini"
                tag="Gemini 2.5 Flash"
                desc="Advanced multimodal reasoning and long-context drafting via Composio."
                selected={textProvider === 'composio_gemini'}
                onClick={() => setTextProvider('composio_gemini')}
              />
              <RoutingOption
                label="Smart Hybrid Auto"
                tag="Auto Fallback"
                desc="Intelligently tries primary engine and automatically falls back if unreachable."
                selected={textProvider === 'auto'}
                onClick={() => setTextProvider('auto')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button & Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="text-xs font-mono text-muted-foreground flex items-center gap-2">
          {saveSuccess && (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <Check className="h-4 w-4" /> AI configuration & routing saved!
            </span>
          )}
        </div>

        <Button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-none font-mono uppercase text-xs font-bold px-6 py-2 shadow-[2px_2px_0_0_#000]"
        >
          {saving ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> SAVING...
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Save className="h-3.5 w-3.5" /> SAVE CONFIGURATION & ROUTING
            </span>
          )}
        </Button>
      </div>

      {/* Security notice */}
      <div className="p-4 border border-border bg-card rounded-none space-y-2">
        <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider">
          <Shield className="h-4 w-4 text-primary" />
          <span>Security & API Protection</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">
          • API keys and credentials are encrypted at rest and never shared or logged.
          <br />
          • Each generation request uses the exact provider selected in the Task Routing Matrix.
          <br />
          • You can change, test, or revoke your connections anytime from this panel.
        </p>
      </div>
    </div>
  );
}
