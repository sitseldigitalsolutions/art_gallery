import zlib from 'node:zlib';
import { expect, type APIRequestContext, type Page } from '@playwright/test';

export const API = 'http://localhost:4000/api/v1';

export const DEMO = {
  customer: { email: 'customer@artgallery.local', password: 'Customer@12345' },
  artist: { email: 'artist@artgallery.local', password: 'Artist@12345', name: 'Meera Iyer Studio' },
  admin: { email: 'admin@artgallery.local', password: 'Admin@12345' },
};

export async function uiLogin(page: Page, who: { email: string; password: string }) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /email/i }).fill(who.email);
  await page.locator('#password').fill(who.password);
  await page.locator('form').getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export async function apiLogin(request: APIRequestContext, who: { email: string; password: string }) {
  const res = await request.post(`${API}/auth/login`, { data: who });
  expect(res.ok()).toBeTruthy();
  const token = (await res.json()).data.accessToken as string;
  return { Authorization: `Bearer ${token}` };
}

/** A valid 900x900 gradient PNG for upload tests. */
export function samplePhoto(): Buffer {
  // Minimal PNG encoder for an RGB image.
  const w = 900;
  const h = 900;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3;
      raw[o] = (x * 255) / w;
      raw[o + 1] = 60;
      raw[o + 2] = (y * 255) / h;
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td) >>> 0);
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function crc32(buf: Buffer) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c;
}
