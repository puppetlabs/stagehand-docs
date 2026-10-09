import type { MarqueeDocument } from './types';

export interface LoadMarqueeOptions {
  path?: string;
}

// RED-phase stub: the real loader lands in the GREEN commit.
export const loadMarquee = (_options: LoadMarqueeOptions = {}): MarqueeDocument => ({
  schema_version: 1,
  generated_at: null,
  feed: '',
  index_digest: null,
  publisher_key: { fingerprint: '', pem: '' },
  packs: [],
  paid_listings: [],
});
