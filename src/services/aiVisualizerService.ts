import {
  DigitalTwinProposal,
  GardenSpace,
  SpaceLayout
} from '../types';

export interface VisualConceptOutput {
  status: 'rendered_local' | 'concept_ready' | 'offline_fallback';
  svgDataUrl: string;
  illustrativePrompt: string;
  disclaimer: string;
  timestamp: string;
}

/**
 * AI Visualizer Service (Milestone 10)
 * Generates clear conceptual visual previews of garden layouts.
 * Purely illustrative; never claims to provide structural or architectural proof.
 */
export class AIVisualizerService {
  /**
   * Generates a 2D architectural concept SVG render of a space and its proposed layout
   */
  generateConceptSvg(space: GardenSpace, layout: SpaceLayout): string {
    const spaceWidth = parseFloat(layout.width || '8') || 8;
    const spaceDepth = parseFloat(layout.depth || '5') || 5;

    // Viewport dimensions
    const svgW = 600;
    const svgH = 400;
    const pad = 40;

    const plotW = svgW - pad * 2;
    const plotH = svgH - pad * 2;

    // Build zones SVG snippets
    const zonesSvg = layout.zones
      .map((z, idx) => {
        const isSunny = z.type === 'sunny_area' || z.name.toLowerCase().includes('sun');
        const isWalkway = z.type === 'walkway' || z.isWalkway;
        const fill = isWalkway
          ? 'rgba(203, 213, 225, 0.45)' // soft slate walkway
          : isSunny
          ? 'rgba(254, 240, 138, 0.45)' // warm sunlight yellow
          : 'rgba(187, 247, 208, 0.35)'; // cool shade green

        const stroke = isWalkway ? '#94A3B8' : isSunny ? '#EAB308' : '#22C55E';
        const strokeDash = isWalkway ? 'stroke-dasharray="4,4"' : '';

        const yOffset = pad + (idx * (plotH / layout.zones.length));
        const zoneH = plotH / layout.zones.length;

        return `
          <rect x="${pad}" y="${yOffset}" width="${plotW}" height="${zoneH}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" ${strokeDash} rx="4" />
          <text x="${pad + 12}" y="${yOffset + 20}" font-family="sans-serif" font-size="11" font-weight="600" fill="#334155">${z.name}</text>
        `;
      })
      .join('\n');

    // Build containers SVG snippets
    const containersSvg = layout.containers
      .map((c, idx) => {
        const col = idx % 4;
        const row = Math.floor(idx / 4);

        const cx = pad + 40 + col * (plotW / 4);
        const cy = pad + 50 + row * 80;

        const isGrowBag = c.type === 'grow_bag';
        const isVertical = c.type === 'vertical_planter';
        const color = isGrowBag ? '#15803D' : isVertical ? '#2563EB' : '#C2410C';

        return `
          <g transform="translate(${cx}, ${cy})">
            <circle cx="0" cy="0" r="16" fill="${color}" stroke="#FFFFFF" stroke-width="2" />
            <circle cx="0" cy="0" r="11" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="1" />
            <text x="0" y="26" font-family="sans-serif" font-size="9" font-weight="600" fill="#1E293B" text-anchor="middle">${c.name.slice(0, 14)}</text>
          </g>
        `;
      })
      .join('\n');

    const rawSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" height="100%">
  <!-- Background -->
  <rect width="${svgW}" height="${svgH}" fill="#F8FAFC" rx="8" />

  <!-- Grid overlay -->
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E2E8F0" stroke-width="0.8"/>
    </pattern>
  </defs>
  <rect x="${pad}" y="${pad}" width="${plotW}" height="${plotH}" fill="url(#grid)" stroke="#64748B" stroke-width="2" rx="4" />

  <!-- Zones -->
  ${zonesSvg}

  <!-- Containers -->
  ${containersSvg}

  <!-- Header & Scale Note -->
  <text x="${pad}" y="${pad - 14}" font-family="sans-serif" font-size="13" font-weight="bold" fill="#0F172A">${space.name} (Conceptual 2D Layout)</text>
  <text x="${svgW - pad}" y="${pad - 14}" font-family="sans-serif" font-size="10" fill="#64748B" text-anchor="end">${spaceWidth}ft × ${spaceDepth}ft • Conceptual Only</text>

  <!-- Walkway Legend -->
  <g transform="translate(${pad}, ${svgH - 12})">
    <rect x="0" y="-8" width="12" height="10" fill="rgba(203, 213, 225, 0.45)" stroke="#94A3B8" stroke-dasharray="2,2"/>
    <text x="18" y="0" font-family="sans-serif" font-size="10" fill="#475569">Central Walkway</text>
    <circle cx="110" cy="-3" r="5" fill="#C2410C"/>
    <text x="120" y="0" font-family="sans-serif" font-size="10" fill="#475569">Pots</text>
    <circle cx="160" cy="-3" r="5" fill="#15803D"/>
    <text x="170" y="0" font-family="sans-serif" font-size="10" fill="#475569">Grow Bags</text>
  </g>
</svg>
    `.trim();

    return `data:image/svg+xml;utf8,${encodeURIComponent(rawSvg)}`;
  }

  /**
   * Generates illustrative conceptual rendering package
   */
  generateConceptVisualization(
    space: GardenSpace,
    proposal: DigitalTwinProposal
  ): VisualConceptOutput {
    const svgDataUrl = this.generateConceptSvg(space, proposal.layout);

    const plantList = proposal.layout.plantPlacements.map((p) => p.plantName).join(', ') || 'starter herbs';
    const containerCount = proposal.layout.containers.length;

    const illustrativePrompt = `Photorealistic architectural garden concept: A cozy, tidy home ${space.type} named "${space.name}".
Arranged with ${containerCount} containers housing ${plantList}.
Sunlight streams across the primary growing zones.
A clear 2-foot walking path is completely unobstructed down the center.
Terracotta pots and neat dark-green fabric grow bags sit on pot feet.
Natural, tranquil, beginner-friendly atmosphere.`;

    return {
      status: 'rendered_local',
      svgDataUrl,
      illustrativePrompt,
      disclaimer: 'This visualization is an illustrative concept only. It does not provide architectural or structural load proof.',
      timestamp: new Date().toISOString()
    };
  }
}

export const aiVisualizerService = new AIVisualizerService();
