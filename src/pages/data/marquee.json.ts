import type { APIRoute } from 'astro';
import { loadMarquee } from '../../lib/data/marquee';

export const GET = (() =>
  new Response(`${JSON.stringify(loadMarquee(), null, 2)}\n`, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })) satisfies APIRoute;
