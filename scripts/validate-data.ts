import { loadCompatibility } from '../src/lib/data/compatibility';
import { loadMarquee } from '../src/lib/data/marquee';
import { loadTiers } from '../src/lib/data/tiers';

// `--marquee <path>` validates a different Marquee listing, so a publish workflow (or a test) can
// check a generated document before it is committed.
const marqueeFlag = process.argv.indexOf('--marquee');
const marqueePath = marqueeFlag === -1 ? undefined : process.argv[marqueeFlag + 1];

const tiers = loadTiers();
const compatibility = loadCompatibility();
const marquee = loadMarquee({ path: marqueePath });

console.log(
  `Validated ${tiers.length} tiers, ${compatibility.length} compatibility records and ${marquee.packs.length} Marquee packs (${marquee.paid_listings.length} paid listings)`,
);
