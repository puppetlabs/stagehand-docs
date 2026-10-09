export type SupportStatus = 'supported' | 'compatible' | 'limited' | 'deprecated' | 'unsupported';

export interface Tier {
  id: 'openvox' | 'puppet-core' | 'puppet-enterprise' | 'pe-advanced';
  name: string;
  audience: string;
  entitlement: 'community' | 'commercial' | 'advanced';
  summary: string;
  features: string[];
}

export interface CompatibilityRecord {
  id: string;
  platform: string;
  puppet_versions: string;
  stagehand_versions: string;
  tier: Tier['id'];
  provider: string;
  transport: string;
  operating_systems: string[];
  status: SupportStatus;
  limitations: string[];
  docs_path: string;
  evidence_url: string;
  last_verified: string;
}

export interface MarqueePackVersion {
  version: string;
  released_at: string;
  image: string;
  digest: string;
}

export interface MarqueePack {
  id: string;
  name: string;
  summary: string;
  publisher: string;
  tier: 'core' | 'ent' | 'adv';
  entitlement: string;
  licence: string;
  versions: MarqueePackVersion[];
}

export interface MarqueePaidListingVersion {
  version: string;
  released_at: string;
}

export interface MarqueePaidListing {
  id: string;
  name: string;
  summary: string;
  tier: 'core' | 'ent' | 'adv';
  label: 'Perforce add-on, licence required';
  versions: MarqueePaidListingVersion[];
}

export interface MarqueeDocument {
  schema_version: 1;
  generated_at: string | null;
  feed: string;
  index_digest: string | null;
  publisher_key: { fingerprint: string; pem: string };
  packs: MarqueePack[];
  paid_listings: MarqueePaidListing[];
}
