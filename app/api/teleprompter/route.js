import { NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export const runtime = 'nodejs';

const DATA_DIR  = join(process.cwd(), 'data');
const DATA_FILE = join(DATA_DIR, 'scripts.json');

function load() {
  if (!existsSync(DATA_FILE)) return { scripts: [] };
  try { return JSON.parse(readFileSync(DATA_FILE, 'utf8')); }
  catch { return { scripts: [] }; }
}

function save(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  return NextResponse.json(load());
}

export async function POST(request) {
  const { name, content } = await request.json();
  if (!name?.trim() || !content?.trim()) {
    return NextResponse.json({ error: 'name and content required' }, { status: 400 });
  }
  const data = load();
  const idx  = data.scripts.findIndex(s => s.name === name.trim());
  const entry = { name: name.trim(), content, updatedAt: new Date().toISOString() };
  if (idx >= 0) data.scripts[idx] = entry;
  else data.scripts.unshift(entry);
  save(data);
  return NextResponse.json({ ok: true, script: entry });
}

export async function DELETE(request) {
  const { name } = await request.json();
  const data = load();
  data.scripts = data.scripts.filter(s => s.name !== name);
  save(data);
  return NextResponse.json({ ok: true });
}
