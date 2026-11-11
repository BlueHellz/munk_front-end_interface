import { mkdir, open, rename, rm, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { Transform, type Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { DomainError } from '../api/errors.js';

export class MediaStore {
  constructor(readonly root: string) {}
  path(key: string): string {
    // Only application-generated opaque segments, never uploaded filenames/URLs.
    if (!/^[a-z0-9-]+(?:\/[a-z0-9.-]+)+$/.test(key) || key.split('/').some(s => s === '.' || s === '..')) throw new Error('Invalid media key.');
    return resolve(this.root, key);
  }
  async prepare(key: string) { const path = this.path(key); await mkdir(dirname(path), { recursive: true, mode: 0o700 }); return path; }
  async remove(key: string) { await rm(this.path(key), { force: true }); }
  async size(key: string) { return (await stat(this.path(key))).size; }
  read(key: string, range?:{start:number;end:number}) { return createReadStream(this.path(key),range); }
  async durable(key: string) {
    const file = await open(this.path(key), 'r');
    try { await file.sync(); } finally { await file.close(); }
    const directory = await open(dirname(this.path(key)), 'r');
    try { await directory.sync(); } finally { await directory.close(); }
  }
  async write(key: string, input: Readable, expected: number, signal?: AbortSignal): Promise<{ bytes: number; sha256: string }> {
    const target = await this.prepare(key), partial = `${target}.part`;
    let bytes = 0;
    const hash = createHash('sha256');
    const meter = new Transform({ transform(chunk: Buffer, _encoding, callback) {
      bytes += chunk.length;
      if (bytes > expected) return callback(new DomainError(413, 'too_large', 'Upload exceeds its declared size.'));
      hash.update(chunk); callback(null, chunk);
    } });
    try {
      await pipeline(input, meter, createWriteStream(partial, { flags: 'wx', mode: 0o600 }), { signal });
      if (bytes !== expected) throw new DomainError(422, 'validation', 'Upload length does not match its declared size.');
      const handle = await open(partial, 'r');
      try { await handle.sync(); } finally { await handle.close(); }
      await rename(partial, target);
      await this.durable(key);
      return { bytes, sha256: hash.digest('hex') };
    } catch (error) { await rm(partial, { force: true }); throw error; }
  }
}
