import { spawn } from 'node:child_process';
import { MediaStore } from './store.js';

export type MediaTools = { ffmpeg: string; ffprobe: string };
export class ProcessingError extends Error {
  constructor(public code: string) { super(code); }
}
type Probe = { streams?: { codec_type?: string; codec_name?: string; width?: number; height?: number }[]; format?: { duration?: string } };
export async function command(binary: string, args: string[], signal?: AbortSignal, progress?: (text: string) => void, timeoutMs = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(new ProcessingError('processing_cancelled'));
    let output = '', settled = false;
    const child = spawn(binary, args, { shell: false, stdio: ['ignore', 'pipe', 'pipe'], env: { PATH: process.env.PATH ?? '/usr/bin:/bin', LANG: 'C' } });
    const finish = (error?: Error) => {
      if (settled) return; settled = true; clearTimeout(timer); signal?.removeEventListener('abort', abort);
      if (error) reject(error); else resolve(output);
    };
    let termination: ProcessingError | undefined;
    const terminate = (code: string) => { termination = new ProcessingError(code); child.kill('SIGKILL'); };
    const abort = () => terminate('processing_cancelled');
    const timer = setTimeout(() => terminate('processing_timeout'), timeoutMs); timer.unref();
    signal?.addEventListener('abort', abort, { once: true });
    child.stdout.on('data', (chunk: Buffer) => {
      if (progress) { progress(chunk.toString('utf8')); return; }
      if (output.length + chunk.length > 1024 * 1024) { terminate('probe_output_too_large'); return; }
      output += chunk.toString('utf8');
    });
    // Drain stderr without retaining potentially hostile media metadata or private paths.
    child.stderr.on('data', () => {});
    child.once('error', () => finish(new ProcessingError('media_tool_unavailable')));
    child.once('close', code => finish(termination ?? (code === 0 ? undefined : new ProcessingError('invalid_or_failed_media'))));
  });
}

export async function probe(tools: MediaTools, path: string, signal?: AbortSignal): Promise<{ durationMs: number; width: number; height: number; videoCodec: string; audioCodec: string | null }> {
  const raw = await command(tools.ffprobe, ['-v', 'error', '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm', '-show_entries', 'format=duration:stream=codec_type,codec_name,width,height', '-of', 'json', path], signal);
  let result: Probe;
  try { result = JSON.parse(raw) as Probe; } catch { throw new ProcessingError('invalid_probe_result'); }
  const video = result.streams?.find(stream => stream.codec_type === 'video');
  const duration = Number(result.format?.duration);
  if (!video || !video.width || !video.height || video.width > 8192 || video.height > 8192 || !Number.isFinite(duration) || duration <= 0 || duration > 7200) {
    throw new ProcessingError('invalid_video_stream_or_duration');
  }
  return { durationMs: Math.round(duration * 1000), width: video.width, height: video.height, videoCodec: video.codec_name ?? '', audioCodec: result.streams?.find(s => s.codec_type === 'audio')?.codec_name ?? null };
}

export async function processVideo(store: MediaStore, tools: MediaTools, sourceKey: string, prefix: string, purpose: 'video' | 'introduction', signal?: AbortSignal, progress?: (seconds: number) => void) {
  const source = store.path(sourceKey);
  const metadata = await probe(tools, source, signal);
  if (purpose === 'introduction' && (metadata.durationMs < 120000 || metadata.durationMs > 240000)) throw new ProcessingError('introduction_duration');
  const playbackKey = `${prefix}/playback.mp4`, posterKey = `${prefix}/poster.jpg`;
  const playback = await store.prepare(playbackKey), poster = await store.prepare(posterKey);
  let pending = '';
  const report = (chunk: string) => {
    pending = (pending + chunk).slice(-8192);
    const lines = pending.split('\n'); pending = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('out_time_us=')) {
        const seconds = Number(line.slice(12)) / 1000000;
        if (Number.isFinite(seconds) && seconds >= 0) progress?.(Math.min(seconds, metadata.durationMs / 1000));
      }
    }
  };
  try {
    await command(tools.ffmpeg, [
      '-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-threads', '2',
      '-protocol_whitelist', 'file,pipe', '-format_whitelist', 'mov,matroska,webm', '-i', source,
      '-map', '0:v:0', '-map', '0:a:0?', '-sn', '-dn', '-map_metadata', '-1', '-map_chapters', '-1',
      '-vf', "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2,setsar=1",
      '-c:v', 'libx264', '-threads', '2', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '128k', '-ac', '2', '-movflags', '+faststart', '-t', '7200',
      '-fs', '3221225472', '-progress', 'pipe:1', '-nostats', playback,
    ], signal, report, 30 * 60 * 1000);
    const output = await probe(tools, playback, signal);
    if (output.videoCodec !== 'h264' || (output.audioCodec !== null && output.audioCodec !== 'aac') || output.width > 1280 || output.height > 720 || Math.abs(output.durationMs - metadata.durationMs) > 2000) {
      throw new ProcessingError('invalid_processed_output');
    }
    await command(tools.ffmpeg, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-n', '-protocol_whitelist', 'file,pipe', '-i', playback, '-frames:v', '1', '-threads', '1', poster], signal);
    if (!(await store.size(playbackKey)) || !(await store.size(posterKey))) throw new ProcessingError('missing_processed_output');
    await store.durable(playbackKey); await store.durable(posterKey);
    return { playbackKey, posterKey, metadata: output };
  } catch (error) {
    await Promise.all([store.remove(playbackKey), store.remove(posterKey)]);
    throw error;
  }
}
