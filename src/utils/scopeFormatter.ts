export interface ScopeBulletItem {
  heading: string;
  body: string;
}

const BULLET_LINE_REGEX = /^[-*•◦]\s+/;

export function hasBulletLines(description: string): boolean {
  return (description || '')
    .split(/\r?\n/)
    .some((line) => BULLET_LINE_REGEX.test(line.trim()));
}

/**
 * Splits a single bullet/line string into optional bold heading + body.
 * Supports:
 * - "**Heading:** body" or "**Heading**: body"
 * - "Heading: body" (when Heading <= 70 chars and not a URL)
 */
export function splitHeadingAndBody(rawLine: string): ScopeBulletItem {
  const cleaned = rawLine.trim().replace(BULLET_LINE_REGEX, '').trim();
  if (!cleaned) {
    return { heading: '', body: '' };
  }

  // Match **Heading:** body or **Heading**: body
  const boldColonMatch = cleaned.match(/^\*\*([^*]+?)\*\*\s*:?\s*(.*)$/);
  if (boldColonMatch) {
    const rawHeading = boldColonMatch[1].trim().replace(/:$/, '').trim();
    const rest = boldColonMatch[2].trim();
    if (rawHeading) {
      return { heading: rawHeading, body: rest };
    }
  }

  // Match plain "Heading: body"
  const colonIdx = cleaned.indexOf(':');
  if (colonIdx > 0 && colonIdx <= 70) {
    const candidateHeading = cleaned.slice(0, colonIdx).trim();
    const afterColon = cleaned.slice(colonIdx + 1);
    const isUrl = /^https?$/i.test(candidateHeading) || afterColon.startsWith('//');
    if (!isUrl && (afterColon.length === 0 || afterColon.startsWith(' '))) {
      return {
        heading: candidateHeading,
        body: afterColon.trim(),
      };
    }
  }

  return { heading: '', body: cleaned };
}

/**
 * Parses a scope description into editable bullet rows.
 */
export function parseDescriptionToBullets(description: string): ScopeBulletItem[] {
  const trimmed = (description || '').trim();
  if (!trimmed) {
    return [{ heading: '', body: '' }];
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return [{ heading: '', body: '' }];
  }

  return lines.map((line) => splitHeadingAndBody(line));
}

/**
 * Smartly splits a single long paragraph containing multiple "Title: ..." sections
 * (e.g. "Geometry Preparation: ... Multi-Domain Volume Meshing: ...") into bullet items.
 */
export function smartSplitParagraphToBullets(description: string): ScopeBulletItem[] {
  const trimmed = (description || '').trim();
  if (!trimmed) return [{ heading: '', body: '' }];

  if (hasBulletLines(trimmed) || trimmed.includes('\n')) {
    return parseDescriptionToBullets(trimmed);
  }

  // Find candidate "Title Case Section:" headers at the start or after sentence-ending punctuation
  const headerPattern = /(?:^|[.!?]\s+)([A-Z][A-Za-z0-9&/()\-–,\s]{2,65}):\s+/g;
  const matches: Array<{ heading: string; contentStart: number; matchStart: number; fullMatchStart: number }> = [];

  let match: RegExpExecArray | null;
  while ((match = headerPattern.exec(trimmed)) !== null) {
    const heading = match[1].trim();
    if (/^https?$/i.test(heading)) continue;

    // Where the punctuation/space before heading ends
    const leadingPunctOffset = match[0].indexOf(match[1]);
    matches.push({
      heading,
      matchStart: match.index + leadingPunctOffset,
      fullMatchStart: match.index,
      contentStart: match.index + match[0].length,
    });
  }

  if (matches.length >= 2) {
    const items: ScopeBulletItem[] = [];

    // Preserve any intro text before first matched heading
    if (matches[0].matchStart > 0) {
      const intro = trimmed.slice(0, matches[0].matchStart).trim();
      if (intro) {
        items.push({ heading: '', body: intro });
      }
    }

    for (let i = 0; i < matches.length; i++) {
      const current = matches[i];
      const next = matches[i + 1];
      const endIdx = next ? next.fullMatchStart + (next.fullMatchStart > 0 && /[.!?]/.test(trimmed[next.fullMatchStart]) ? 1 : 0) : trimmed.length;
      const body = trimmed.slice(current.contentStart, endIdx).trim();
      items.push({ heading: current.heading, body });
    }

    return items;
  }

  // Fallback: split by sentences if multiple sentences exist
  const sentences = trimmed
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (sentences.length > 1) {
    return sentences.map((s) => splitHeadingAndBody(s));
  }

  return [splitHeadingAndBody(trimmed)];
}

/**
 * Serializes structured bullet items back to newline-delimited markdown bullets
 * compatible with plain-text storage in Firestore.
 */
export function bulletsToDescription(items: ScopeBulletItem[]): string {
  return items
    .map((item) => {
      const h = item.heading.trim().replace(/:$/, '').trim();
      const b = item.body.trim();
      if (!h && !b) return '';
      if (h && b) return `- **${h}:** ${b}`;
      if (h) return `- **${h}:**`;
      return `- ${b}`;
    })
    .filter(Boolean)
    .join('\n');
}

export type ScopeRenderBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] };

/**
 * Parses a scope description into paragraph and bullet-list blocks for display.
 */
export function parseScopeRenderBlocks(description: string): ScopeRenderBlock[] {
  const lines = (description || '').split(/\r?\n/);
  const blocks: ScopeRenderBlock[] = [];

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (BULLET_LINE_REGEX.test(trimmed)) {
      const itemText = trimmed.replace(BULLET_LINE_REGEX, '').trim();
      const last = blocks[blocks.length - 1];
      if (last && last.type === 'bullets') {
        last.items.push(itemText);
      } else {
        blocks.push({ type: 'bullets', items: [itemText] });
      }
    } else {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }

  return blocks;
}
