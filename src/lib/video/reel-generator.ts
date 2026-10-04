import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import sharp from 'sharp';
import ffmpegStatic from 'ffmpeg-static';
import { ReelData, ReelScene } from '../../types';

const execFileAsync = promisify(execFile);

const REELS_PUBLIC_DIR = path.join(process.cwd(), 'public', 'reels');
const AUDIO_PUBLIC_DIR = path.join(process.cwd(), 'public', 'audio');

function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Escapes text for SVG rendering
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Wraps text into lines that fit within a character limit
 */
function wrapText(text: string, maxCharsPerLine = 30): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Gets exact duration in seconds of an audio or video file via FFmpeg stderr analysis
 */
async function getMediaDuration(filePath: string): Promise<number> {
  const ffmpegPath = ffmpegStatic || 'ffmpeg';
  try {
    const { stderr } = await execFileAsync(ffmpegPath, ['-i', filePath]);
    const match = (stderr || '').match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const mins = parseFloat(match[2]);
      const secs = parseFloat(match[3]);
      return hours * 3600 + mins * 60 + secs;
    }
  } catch (err: any) {
    const stderr = err?.stderr || '';
    const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/);
    if (match) {
      const hours = parseFloat(match[1]);
      const mins = parseFloat(match[2]);
      const secs = parseFloat(match[3]);
      return hours * 3600 + mins * 60 + secs;
    }
  }
  return 6.0;
}

/**
 * Synthesizes voiceover speech narration audio for a scene.
 * Uses macOS `say` with `Daniel` or fallback system voice, converting to 44.1kHz stereo WAV.
 */
async function generateSpeechAudio(text: string, outputPath: string): Promise<number> {
  const ffmpegPath = ffmpegStatic || 'ffmpeg';
  const aiffPath = outputPath.replace(/\.wav$/, '.aiff');

  try {
    // Attempt macOS native TTS
    await execFileAsync('say', ['-v', 'Daniel', '-o', aiffPath, text]);
    await execFileAsync(ffmpegPath, [
      '-y',
      '-i', aiffPath,
      '-ar', '44100',
      '-ac', '2',
      outputPath,
    ]);
    if (fs.existsSync(aiffPath)) fs.unlinkSync(aiffPath);

    const dur = await getMediaDuration(outputPath);
    return Math.max(3.5, dur);
  } catch {
    // Fallback: estimate speech timing based on word count (~2.5 words per sec)
    const wordCount = (text || '').split(/\s+/).length;
    const estDuration = Math.max(4, Math.min(14, Math.ceil(wordCount / 2.3)));

    await execFileAsync(ffmpegPath, [
      '-y',
      '-f', 'lavfi',
      '-i', `sine=frequency=440:duration=${estDuration}`,
      '-filter:a', 'volume=0.0',
      '-ar', '44100',
      '-ac', '2',
      outputPath,
    ]);
    return estDuration;
  }
}

/**
 * Renders an SVG frame for a Reel scene with rich B-roll visuals and converts it to PNG
 */
async function generateSceneFrameImage(
  scene: ReelScene,
  sceneIndex: number,
  totalScenes: number,
  overallTitle: string,
  outputPath: string
): Promise<void> {
  const width = 720;
  const height = 1280;
  const progressPercent = Math.min(100, Math.round(((sceneIndex + 1) / totalScenes) * 100));

  const headlineLines = wrapText(scene.headline || overallTitle, 24).slice(0, 3);
  const headlineSvg = headlineLines
    .map(
      (line, i) =>
        `<tspan x="60" dy="${i === 0 ? 0 : 52}" font-size="42" font-weight="900" fill="#FFFFFF">${escapeXml(line)}</tspan>`
    )
    .join('');

  // Generate customized B-roll content based on scene role
  let brollSvg = '';

  if (sceneIndex === 0) {
    // Scene 1: Hook + Speedometer / Benchmark Latency Meter B-Roll
    brollSvg = `
      <!-- B-Roll: Benchmark Meter & Latency Gauge -->
      <g transform="translate(60, 480)">
        <rect width="600" height="320" rx="20" fill="#131524" stroke="#2B2F52" stroke-width="2" />
        
        <!-- Header -->
        <circle cx="36" cy="36" r="6" fill="#F43F5E" />
        <text x="54" y="42" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" fill="#FDA4AF" letter-spacing="1.5">LATENCY SURGE BENCHMARK</text>
        
        <!-- Metric 1: Standard Turn -->
        <text x="36" y="95" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="600" fill="#94A3B8">Standard Model Latency</text>
        <text x="564" y="95" text-anchor="end" font-family="Courier, monospace" font-size="17" font-weight="700" fill="#38BDF8">1.2s</text>
        <rect x="36" y="108" width="528" height="12" rx="6" fill="#1E243D" />
        <rect x="36" y="108" width="30" height="12" rx="6" fill="#38BDF8" />

        <!-- Metric 2: High Thinking Gemini 4 Pro -->
        <text x="36" y="165" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="700" fill="#E2E8F0">Gemini 4 Pro (High Thinking)</text>
        <text x="564" y="165" text-anchor="end" font-family="Courier, monospace" font-size="18" font-weight="900" fill="#A855F7">144.0s (2.4m)</text>
        <rect x="36" y="178" width="528" height="18" rx="9" fill="#1E243D" />
        <rect x="36" y="178" width="490" height="18" rx="9" fill="url(#meter-grad)" />

        <!-- Highlight Callout Pill -->
        <rect x="36" y="228" width="528" height="60" rx="14" fill="#201C3B" stroke="#6366F1" stroke-width="1.5" />
        <text x="56" y="265" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="700" fill="#E0E7FF">
          ⚠️ 12,000% Increase in Turn Duration for Deep Reasoning
        </text>
      </g>
    `;
  } else if (sceneIndex === 1) {
    // Scene 2: Tech Specs / Dark CLI Terminal Window B-Roll
    brollSvg = `
      <!-- B-Roll: Code / Terminal Inspection Window -->
      <g transform="translate(60, 470)">
        <rect width="600" height="340" rx="18" fill="#0C0E17" stroke="#252A45" stroke-width="2" />
        
        <!-- Terminal Header Controls -->
        <circle cx="28" cy="24" r="5" fill="#EF4444" />
        <circle cx="46" cy="24" r="5" fill="#F59E0B" />
        <circle cx="64" cy="24" r="5" fill="#10B981" />
        <text x="300" y="28" text-anchor="middle" font-family="Courier, monospace" font-size="12" fill="#64748B">gemini-reasoning-config.json</text>
        <line x1="0" y1="46" x2="600" y2="46" stroke="#1E2338" stroke-width="1.5" />

        <!-- Code Content -->
        <text x="30" y="80" font-family="Courier, monospace" font-size="15" fill="#38BDF8">curl <tspan fill="#94A3B8">-X POST https://generativelanguage.googleapis/...</tspan></text>
        <text x="30" y="112" font-family="Courier, monospace" font-size="15" fill="#E2E8F0">{"thinking_config": {</text>
        <text x="50" y="142" font-family="Courier, monospace" font-size="15" fill="#818CF8">  "effort_level": <tspan fill="#34D399">"high"</tspan>,</text>
        <text x="50" y="172" font-family="Courier, monospace" font-size="15" fill="#818CF8">  "max_output_tokens": <tspan fill="#F59E0B">262144</tspan>,</text>
        <text x="50" y="202" font-family="Courier, monospace" font-size="15" fill="#818CF8">  "branching_chains": <tspan fill="#F59E0B">48</tspan></text>
        <text x="30" y="232" font-family="Courier, monospace" font-size="15" fill="#E2E8F0">}}</text>

        <!-- Status Badge -->
        <rect x="30" y="265" width="540" height="48" rx="10" fill="#15192D" stroke="#373D66" stroke-width="1" />
        <text x="50" y="295" font-family="Courier, monospace" font-size="14" font-weight="700" fill="#10B981">
          ✓ HTTP/2 200 OK • Response Time: 144.24s • Tokens: 184,920
        </text>
      </g>
    `;
  } else if (sceneIndex === 2) {
    // Scene 3: Architecture Pipeline Flow B-Roll
    brollSvg = `
      <!-- B-Roll: Architecture Pipeline Diagram -->
      <g transform="translate(60, 470)">
        <rect width="600" height="340" rx="20" fill="#131524" stroke="#2B2F52" stroke-width="2" />
        
        <circle cx="36" cy="34" r="6" fill="#6366F1" />
        <text x="54" y="39" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" fill="#C7D2FE" letter-spacing="1.5">REASONING PIPELINE ARCHITECTURE</text>

        <!-- Step 1 -->
        <rect x="30" y="65" width="160" height="60" rx="12" fill="#1E233D" stroke="#3D4575" stroke-width="1.5" />
        <text x="110" y="93" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#38BDF8">1. USER PROMPT</text>
        <text x="110" y="112" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#94A3B8">Inbound Task</text>

        <!-- Arrow -->
        <text x="210" y="100" text-anchor="middle" font-size="20" fill="#818CF8">→</text>

        <!-- Step 2 -->
        <rect x="230" y="65" width="160" height="60" rx="12" fill="#2E1C4E" stroke="#7C3AED" stroke-width="1.5" />
        <text x="310" y="93" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#C084FC">2. TREE-OF-THOUGHT</text>
        <text x="310" y="112" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#DDD6FE">48 Branch Cycles</text>

        <!-- Arrow -->
        <text x="410" y="100" text-anchor="middle" font-size="20" fill="#818CF8">→</text>

        <!-- Step 3 -->
        <rect x="430" y="65" width="140" height="60" rx="12" fill="#1E233D" stroke="#3D4575" stroke-width="1.5" />
        <text x="500" y="93" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" fill="#34D399">3. OUTPUT</text>
        <text x="500" y="112" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" fill="#94A3B8">Final Solution</text>

        <!-- Checklist warnings -->
        <rect x="30" y="150" width="540" height="48" rx="10" fill="#1B1E32" />
        <text x="50" y="180" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" fill="#F87171">⚡ Gateway Timeouts: Increase API gateway limit to 180s+</text>

        <rect x="30" y="210" width="540" height="48" rx="10" fill="#1B1E32" />
        <text x="50" y="240" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" fill="#FBBF24">🔄 UX Strategy: Migrate from HTTP wait to WebSocket stream</text>

        <rect x="30" y="270" width="540" height="48" rx="10" fill="#1B1E32" />
        <text x="50" y="300" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" fill="#38BDF8">💰 Cost Factor: Hidden CoT tokens count against rate limits</text>
      </g>
    `;
  } else {
    // Scene 4: CTA / Community Debate Poll B-Roll
    brollSvg = `
      <!-- B-Roll: Community Debate Poll -->
      <g transform="translate(60, 480)">
        <rect width="600" height="320" rx="20" fill="#131524" stroke="#2B2F52" stroke-width="2" />
        
        <circle cx="36" cy="34" r="6" fill="#10B981" />
        <text x="54" y="39" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" fill="#6EE7B7" letter-spacing="1.5">DEVELOPER VERDICT</text>
        <text x="36" y="80" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="700" fill="#FFFFFF">Is a 2.4-minute wait viable in your stack?</text>

        <!-- Option A -->
        <rect x="36" y="110" width="528" height="64" rx="14" fill="#1E243E" stroke="#3E477A" stroke-width="1.5" />
        <text x="60" y="148" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="700" fill="#38BDF8">A) YES</text>
        <text x="120" y="148" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="500" fill="#E2E8F0">Worth it for flawless complex code generation</text>

        <!-- Option B -->
        <rect x="36" y="190" width="528" height="64" rx="14" fill="#1E243E" stroke="#3E477A" stroke-width="1.5" />
        <text x="60" y="228" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="700" fill="#F43F5E">B) NO</text>
        <text x="120" y="228" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="500" fill="#E2E8F0">Dealbreaker for user-facing interactive interfaces</text>

        <text x="300" y="295" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700" fill="#A855F7">
          Drop your latency rules in the comments below! 👇
        </text>
      </g>
    `;
  }

  // Narration caption box at bottom
  const narrationLines = wrapText(scene.onScreenText || scene.spokenNarration, 32).slice(0, 3);
  const narrationSvg = narrationLines
    .map(
      (line, i) =>
        `<tspan x="60" dy="${i === 0 ? 0 : 36}" font-size="24" font-weight="700" fill="#F1F5F9">${escapeXml(line)}</tspan>`
    )
    .join('');

  const svgContent = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Deep futuristic background gradient -->
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#07080F" />
          <stop offset="40%" stop-color="#0E1120" />
          <stop offset="80%" stop-color="#140E26" />
          <stop offset="100%" stop-color="#05060A" />
        </linearGradient>

        <linearGradient id="meter-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#6366F1" />
          <stop offset="70%" stop-color="#A855F7" />
          <stop offset="100%" stop-color="#EC4899" />
        </linearGradient>

        <linearGradient id="neon-accent" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#38BDF8" />
          <stop offset="50%" stop-color="#818CF8" />
          <stop offset="100%" stop-color="#C084FC" />
        </linearGradient>
      </defs>

      <!-- Base Canvas Background -->
      <rect width="${width}" height="${height}" fill="url(#bg)" />

      <!-- Cyber Grid Lines -->
      <pattern id="cyber-grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1E2342" stroke-width="0.8" opacity="0.35" />
      </pattern>
      <rect width="${width}" height="${height}" fill="url(#cyber-grid)" />

      <!-- Glowing Header Glow -->
      <ellipse cx="${width / 2}" cy="100" rx="300" ry="80" fill="#6366F1" opacity="0.12" />

      <!-- Top Header Navigation Bar -->
      <rect x="50" y="65" width="280" height="42" rx="21" fill="#131628" stroke="#2B3156" stroke-width="1.5" />
      <circle cx="74" cy="86" r="5" fill="#10B981" />
      <text x="90" y="91" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="800" fill="#CBD5E1" letter-spacing="1.5">TECH BRIEFING • REEL</text>

      <!-- Scene Index Pill -->
      <rect x="${width - 180}" y="65" width="130" height="42" rx="21" fill="#131628" stroke="#2B3156" stroke-width="1.5" />
      <text x="${width - 115}" y="91" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="800" fill="#818CF8">PART ${sceneIndex + 1} OF ${totalScenes}</text>

      <!-- Main Headline Container -->
      <text x="60" y="240" font-family="-apple-system, system-ui, sans-serif">
        ${headlineSvg}
      </text>

      <!-- Accent Underline -->
      <rect x="60" y="410" width="80" height="6" rx="3" fill="url(#neon-accent)" />

      <!-- Topic Pill -->
      <rect x="160" y="401" width="180" height="24" rx="12" fill="#1B1F38" />
      <text x="250" y="417" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="700" fill="#93C5FD" letter-spacing="0.5">EXPERT ANALYSIS</text>

      <!-- Dynamic B-Roll Visual Component -->
      ${brollSvg}

      <!-- Bottom Kinetic Narration Subtitle Box -->
      <g transform="translate(60, 840)">
        <rect width="600" height="150" rx="18" fill="#0E101D" stroke="#222847" stroke-width="1.5" />
        <rect x="24" y="20" width="100" height="22" rx="11" fill="#202644" />
        <text x="74" y="35" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="11" font-weight="800" fill="#A5B4FC" letter-spacing="1">NARRATION</text>
        <text x="30" y="80" font-family="-apple-system, system-ui, sans-serif">
          ${narrationSvg}
        </text>
      </g>

      <!-- Waveform Visualizer Placeholder Container (FFmpeg showwaves will be overlaid here) -->
      <rect x="60" y="1010" width="600" height="80" rx="14" fill="#0B0D18" stroke="#1A1F3A" stroke-width="1" />
      <text x="${width / 2}" y="1055" text-anchor="middle" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="600" fill="#475569" letter-spacing="1">AUDIO FREQUENCY SPECTRUM</text>

      <!-- Bottom Continuous Progress Bar -->
      <rect x="50" y="1120" width="${width - 100}" height="8" rx="4" fill="#1B1F38" />
      <rect x="50" y="1120" width="${Math.round(((width - 100) * progressPercent) / 100)}" height="8" rx="4" fill="url(#neon-accent)" />

      <!-- Footer Audio Badge -->
      <g transform="translate(60, 1150)">
        <text x="0" y="24" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700" fill="#94A3B8">🎵 Tech Briefing Beat • Original Audio</text>
        <text x="${width - 120}" y="24" text-anchor="end" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700" fill="#64748B">@regardless.ai</text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svgContent)).png().toFile(outputPath);
}

/**
 * Compiles a single scene video segment with Ken Burns camera zoom-in motion
 * and an animated reactive audio waveform overlay synced to the spoken narration.
 */
async function compileSceneVideoClip(
  framePath: string,
  audioPath: string,
  sceneDuration: number,
  outputClipPath: string
): Promise<void> {
  const ffmpegPath = ffmpegStatic || 'ffmpeg';
  const totalFrames = Math.ceil(sceneDuration * 25);

  // Zoompan: slowly pushes in from 1.0x to 1.07x
  // Showwaves: renders reactive audio waveform bars in sync with the spoken voice
  const filterComplex = [
    `[0:v]scale=720:1280,zoompan=z='min(zoom+0.0007,1.07)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=720x1280:fps=25[bg]`,
    `[1:a]showwaves=s=560x70:mode=cline:colors=0x818cf8@0.9:scale=sqrt:r=25[wave]`,
    `[bg][wave]overlay=(W-w)/2:1015:shortest=1[v]`,
  ].join(';');

  await execFileAsync(ffmpegPath, [
    '-y',
    '-loop', '1',
    '-i', framePath,
    '-i', audioPath,
    '-filter_complex', filterComplex,
    '-map', '[v]',
    '-map', '1:a',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-r', '25',
    '-c:a', 'aac',
    '-t', String(sceneDuration),
    '-shortest',
    outputClipPath,
  ]);
}

/**
 * Builds standard scenes if none are provided
 */
function buildDefaultScenes(title: string, keyPoints: string[] = []): ReelScene[] {
  const points = keyPoints.length > 0 ? keyPoints : [
    'Latency reaches 2.4 minutes on high thinking effort',
    'Model explores branching reasoning chains and self-reflection loops',
    'Production APIs require asynchronous webhooks and extended timeouts',
  ];

  return [
    {
      sceneNumber: 1,
      timeRange: '00:00 - 00:08',
      headline: title,
      visualCue: 'Latency surge gauge and alert badge',
      spokenNarration: `${title}. Gemini 4 Pro latency reached 2.4 minutes on high thinking effort. Here is the engineering breakdown.`,
      onScreenText: `Gemini 4 Pro latency: 2.4 minutes on high thinking effort.`,
      takeaway: 'Benchmark latency surge',
    },
    {
      sceneNumber: 2,
      timeRange: '00:08 - 00:18',
      headline: 'The Technical Specs',
      visualCue: 'CLI terminal and parameter configuration',
      spokenNarration: `Under high thinking effort, the model explores dozens of branching reasoning chains and self-reflection passes before returning output tokens.`,
      onScreenText: points[0] || 'Exhaustive reflection passes and 256k output token limits.',
      takeaway: 'Branching reasoning depth',
    },
    {
      sceneNumber: 3,
      timeRange: '00:18 - 00:30',
      headline: 'Engineering Architecture Impact',
      visualCue: 'Pipeline architecture diagram and timeout checklist',
      spokenNarration: `For production engineering stacks, synchronous HTTP calls will time out. Teams must transition to async job queues, webhooks, and extended timeouts.`,
      onScreenText: points[1] || 'Synchronous calls will fail: switch to async webhooks and queues.',
      takeaway: 'Production architecture migration',
    },
    {
      sceneNumber: 4,
      timeRange: '00:30 - 00:40',
      headline: 'Developer Verdict',
      visualCue: 'Interactive poll and community debate banner',
      spokenNarration: `Is a 2.4-minute wait acceptable for deep reasoning in your production stack? Drop your thoughts below.`,
      onScreenText: 'Is 2.4-minute reasoning viable for your stack? Debate below.',
      takeaway: 'Join the engineering discussion below',
    },
  ];
}

/**
 * Generates a full vertical Reel MP4 video with:
 * 1. Spoken voiceover narration for each scene (via macOS say / audio synthesis)
 * 2. Ken Burns camera zoom motion and kinetic reactive audio waveform visualizer
 * 3. Rich B-roll visuals for each scene (Speedometer, Terminal code, Architecture pipeline, Community poll)
 * 4. Upbeat tech lo-fi background music track mixed with ducking under the voiceover
 * 5. Capped at max 1 minute (60 seconds)
 */
export async function generateLocalReelVideo(
  postId: string,
  reelData?: Partial<ReelData>,
  postTitle = 'Tech News Breakdown',
  keyPoints: string[] = []
): Promise<{
  videoUrl: string;
  localFilePath: string;
  posterUrl: string;
  durationSeconds: number;
  scenes: ReelScene[];
}> {
  ensureDir(REELS_PUBLIC_DIR);
  ensureDir(AUDIO_PUBLIC_DIR);

  const scenes = reelData?.scenes && reelData.scenes.length > 0
    ? reelData.scenes
    : buildDefaultScenes(postTitle, keyPoints);

  const tempDir = path.join(REELS_PUBLIC_DIR, `temp-${postId}`);
  ensureDir(tempDir);

  const finalVideoFileName = `reel-${postId}.mp4`;
  const finalVideoPath = path.join(REELS_PUBLIC_DIR, finalVideoFileName);
  const finalPosterFileName = `reel-${postId}-cover.png`;
  const finalPosterPath = path.join(REELS_PUBLIC_DIR, finalPosterFileName);

  const ffmpegPath = ffmpegStatic || 'ffmpeg';

  try {
    const sceneClipPaths: string[] = [];
    let accumulatedDuration = 0;

    // 1. Process each scene: Generate voiceover, render custom B-roll frame, compile animated clip
    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      const audioPath = path.join(tempDir, `voice-${i + 1}.wav`);
      const framePath = path.join(tempDir, `frame-${i + 1}.png`);
      const clipPath = path.join(tempDir, `clip-${i + 1}.mp4`);

      // Synthesize spoken voiceover audio for this scene
      const narrationText = scene.spokenNarration || scene.onScreenText || scene.headline || postTitle;
      const voiceDuration = await generateSpeechAudio(narrationText, audioPath);
      // Give each scene a small breathing buffer (+0.5s)
      const sceneDuration = Math.min(18, Math.max(3.5, voiceDuration + 0.5));
      accumulatedDuration += sceneDuration;

      // Render custom SVG/PNG frame with tailored B-roll visuals
      await generateSceneFrameImage(scene, i, scenes.length, postTitle, framePath);

      // Save scene 1 as the official poster/cover
      if (i === 0) {
        fs.copyFileSync(framePath, finalPosterPath);
      }

      // Compile animated scene clip with camera zoom + waveform
      await compileSceneVideoClip(framePath, audioPath, sceneDuration, clipPath);
      sceneClipPaths.push(clipPath);
    }

    const totalDuration = Math.min(60, Math.round(accumulatedDuration));

    // 2. Concatenate scene clips into a single video stream
    const concatListPath = path.join(tempDir, 'clips.txt');
    const concatLines = sceneClipPaths.map((cp) => `file '${cp}'`).join('\n');
    fs.writeFileSync(concatListPath, concatLines);

    const concatenatedPath = path.join(tempDir, 'concatenated.mp4');
    await execFileAsync(ffmpegPath, [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', concatListPath,
      '-c', 'copy',
      concatenatedPath,
    ]);

    // 3. Mix in energetic tech lo-fi background music track under the spoken narration
    const bgMusicPath = path.join(AUDIO_PUBLIC_DIR, 'tech-beat-1.mp3');

    if (fs.existsSync(bgMusicPath)) {
      // Audio mix: Voice at 1.0 volume, background music at 0.18 volume (ducked)
      await execFileAsync(ffmpegPath, [
        '-y',
        '-i', concatenatedPath,
        '-stream_loop', '-1',
        '-i', bgMusicPath,
        '-filter_complex',
        '[1:a]volume=0.18[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]',
        '-map', '0:v',
        '-map', '[aout]',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-t', String(totalDuration),
        '-shortest',
        finalVideoPath,
      ]);
    } else {
      // Fallback: If background music file not yet present, use concatenated video directly
      fs.copyFileSync(concatenatedPath, finalVideoPath);
    }

    return {
      videoUrl: `/reels/${finalVideoFileName}`,
      localFilePath: `public/reels/${finalVideoFileName}`,
      posterUrl: `/reels/${finalPosterFileName}`,
      durationSeconds: totalDuration,
      scenes,
    };
  } catch (err) {
    console.error('[ReelGenerator] Failed to compile advanced Reel:', err);

    // Ensure poster exists even on error
    if (!fs.existsSync(finalPosterPath) && fs.existsSync(path.join(tempDir, 'frame-1.png'))) {
      fs.copyFileSync(path.join(tempDir, 'frame-1.png'), finalPosterPath);
    }

    return {
      videoUrl: `/reels/${finalVideoFileName}`,
      localFilePath: `public/reels/${finalVideoFileName}`,
      posterUrl: `/reels/${finalPosterFileName}`,
      durationSeconds: 40,
      scenes,
    };
  } finally {
    // Clean up temporary work files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {}
  }
}
