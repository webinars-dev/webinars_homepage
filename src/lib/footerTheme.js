const DEFAULT_BACKGROUND = { r: 255, g: 255, b: 255, a: 1 };
const DEFAULT_FOREGROUND = { r: 17, g: 17, b: 17, a: 1 };
const DEFAULT_DARK_FOREGROUND = { r: 255, g: 255, b: 255, a: 1 };

const NAMED_COLORS = {
  black: { r: 0, g: 0, b: 0, a: 1 },
  white: { r: 255, g: 255, b: 255, a: 1 },
  transparent: { r: 255, g: 255, b: 255, a: 0 },
};

const clampChannel = (value) => Math.max(0, Math.min(255, Math.round(value)));

const serializeRgb = ({ r, g, b }) => `rgb(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(b)})`;

const parseHexColor = (input) => {
  const value = input.replace('#', '').trim();
  if (![3, 4, 6, 8].includes(value.length)) return null;

  const expanded = value.length <= 4
    ? value.split('').map((char) => `${char}${char}`).join('')
    : value;

  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  const alphaHex = expanded.length === 8 ? expanded.slice(6, 8) : 'ff';
  const a = Number((parseInt(alphaHex, 16) / 255).toFixed(3));

  return { r, g, b, a };
};

const parseFunctionalColor = (input) => {
  const match = input.match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;

  const parts = match[1].split(',').map((part) => part.trim());
  if (parts.length < 3) return null;

  const r = Number.parseFloat(parts[0]);
  const g = Number.parseFloat(parts[1]);
  const b = Number.parseFloat(parts[2]);
  const a = parts[3] === undefined ? 1 : Number.parseFloat(parts[3]);

  if ([r, g, b, a].some((value) => Number.isNaN(value))) return null;
  return { r, g, b, a };
};

export const parseCssColor = (input) => {
  if (!input || typeof input !== 'string') return null;
  const normalized = input.trim().toLowerCase();
  if (!normalized) return null;
  if (normalized.startsWith('#')) return parseHexColor(normalized);
  if (normalized.startsWith('rgb')) return parseFunctionalColor(normalized);
  return NAMED_COLORS[normalized] || null;
};

const blendColors = (background, foreground) => {
  if (!foreground) return background;
  const alpha = foreground.a ?? 1;
  const inverse = 1 - alpha;

  return {
    r: clampChannel((foreground.r * alpha) + (background.r * inverse)),
    g: clampChannel((foreground.g * alpha) + (background.g * inverse)),
    b: clampChannel((foreground.b * alpha) + (background.b * inverse)),
    a: 1,
  };
};

const relativeLuminance = ({ r, g, b }) => {
  const normalize = (channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return (0.2126 * normalize(r)) + (0.7152 * normalize(g)) + (0.0722 * normalize(b));
};

const extractStyleValue = (styleText, property) => {
  if (!styleText) return null;
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = styleText.match(new RegExp(`${escapedProperty}\\s*:\\s*([^;]+)`, 'i'));
  return match?.[1]?.trim() || null;
};

const firstColorFromNodes = (nodes) => {
  for (const node of nodes) {
    if (!node) continue;
    const inlineStyle = node.getAttribute('style') || '';
    const color = parseCssColor(extractStyleValue(inlineStyle, 'color'));
    if (color && (color.a ?? 1) > 0) {
      return color;
    }
  }
  return null;
};

const findFirstOpaqueBackground = (startNode) => {
  let node = startNode;

  while (node) {
    const computed = window.getComputedStyle(node);
    const backgroundColor = parseCssColor(computed.backgroundColor);
    if (backgroundColor && (backgroundColor.a ?? 1) > 0.01) {
      return backgroundColor.a < 1 ? blendColors(DEFAULT_BACKGROUND, backgroundColor) : backgroundColor;
    }
    node = node.parentElement;
  }

  const bodyBackground = parseCssColor(window.getComputedStyle(document.body).backgroundColor);
  if (bodyBackground && (bodyBackground.a ?? 1) > 0.01) {
    return bodyBackground.a < 1 ? blendColors(DEFAULT_BACKGROUND, bodyBackground) : bodyBackground;
  }

  return DEFAULT_BACKGROUND;
};

export const DEFAULT_FOOTER_THEME = {
  backgroundColor: serializeRgb(DEFAULT_BACKGROUND),
  foregroundColor: serializeRgb(DEFAULT_FOREGROUND),
  borderColor: 'rgb(238, 238, 238)',
  tone: 'light',
};

export const normalizeFooterTheme = (theme) => {
  if (!theme) return DEFAULT_FOOTER_THEME;

  const tone = theme.tone === 'dark' ? 'dark' : 'light';
  return {
    backgroundColor: theme.backgroundColor || DEFAULT_FOOTER_THEME.backgroundColor,
    foregroundColor: theme.foregroundColor || (tone === 'dark'
      ? serializeRgb(DEFAULT_DARK_FOREGROUND)
      : DEFAULT_FOOTER_THEME.foregroundColor),
    borderColor: theme.borderColor || (tone === 'dark' ? 'rgba(255, 255, 255, 0.18)' : DEFAULT_FOOTER_THEME.borderColor),
    tone,
  };
};

const createTheme = ({ background, foreground, tone, borderColor }) => normalizeFooterTheme({
  backgroundColor: serializeRgb(background),
  foregroundColor: serializeRgb(foreground),
  borderColor: borderColor || (tone === 'dark' ? 'rgba(255, 255, 255, 0.18)' : 'rgb(238, 238, 238)'),
  tone,
});

export const extractFooterThemeFromHtml = (html) => {
  if (!html || typeof DOMParser === 'undefined') return null;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const footerAnchor = doc.querySelector('.footer_inform') || doc.querySelector('.footer_partner');
  const footerSection = footerAnchor?.closest('.wpb_row.vc_row-fluid.vc_row.full-width-content')
    || footerAnchor?.closest('.wpb_row.vc_row-fluid.vc_row');

  if (!footerSection) return null;

  const inlineBackgroundNode = footerSection.querySelector('.row-bg.using-bg-color');
  const inlineBackground = parseCssColor(
    extractStyleValue(inlineBackgroundNode?.getAttribute('style'), 'background-color')
  );
  const backgroundImageNode = footerSection.querySelector('.row-bg.using-image, .row-bg[data-nectar-img-src]');
  const hasBackgroundImage = Boolean(
    backgroundImageNode?.getAttribute('data-nectar-img-src')
    || extractStyleValue(backgroundImageNode?.getAttribute('style'), 'background-image')
  );

  const overlayNode = footerSection.querySelector('.row-bg-overlay');
  const overlayColor = parseCssColor(
    extractStyleValue(overlayNode?.getAttribute('style'), 'background-color')
  );
  const overlayOpacity = Number.parseFloat(
    extractStyleValue(overlayNode?.getAttribute('style'), 'opacity') || `${overlayColor?.a ?? NaN}`
  );

  // When a background image is present, the overlay sits on top of the image (not white).
  // Use data-midnight="dark" to detect dark sections and approximate the image base
  // as a dark neutral instead of white, so the blended result reflects the real visual tone.
  const sectionMidnight = footerSection.getAttribute('data-midnight');
  const overlayBlendBase = hasBackgroundImage && sectionMidnight === 'dark'
    ? { r: 15, g: 15, b: 15, a: 1 }
    : DEFAULT_BACKGROUND;

  let background = inlineBackground && (inlineBackground.a ?? 1) > 0.01
    ? (inlineBackground.a < 1 ? blendColors(DEFAULT_BACKGROUND, inlineBackground) : inlineBackground)
    : null;

  if (!background && overlayColor && !Number.isNaN(overlayOpacity)) {
    background = blendColors(overlayBlendBase, { ...overlayColor, a: overlayOpacity });
  }

  if (!background && overlayColor) {
    background = blendColors(overlayBlendBase, overlayColor);
  }

  if (!background) {
    const bodyBackground = parseCssColor(extractStyleValue(doc.body?.getAttribute('style'), 'background-color'));
    background = bodyBackground || DEFAULT_BACKGROUND;
  }

  const foreground = firstColorFromNodes([
    footerSection.querySelector('.footer_inform'),
    footerSection.querySelector('.vc_custom_heading'),
    ...footerSection.querySelectorAll('h5'),
  ]) || (relativeLuminance(background) < 0.35 ? DEFAULT_DARK_FOREGROUND : DEFAULT_FOREGROUND);

  const tone = relativeLuminance(foreground) > 0.65 ? 'dark' : 'light';
  const borderColor = hasBackgroundImage ? 'rgba(0, 0, 0, 0)' : undefined;

  return createTheme({ background, foreground, tone, borderColor });
};

export const resolveFooterThemeFromDom = (rootNode) => {
  if (!rootNode || typeof window === 'undefined') return DEFAULT_FOOTER_THEME;

  const lastElement = rootNode.lastElementChild || rootNode;
  const background = findFirstOpaqueBackground(lastElement);
  const tone = relativeLuminance(background) < 0.35 ? 'dark' : 'light';
  const foreground = tone === 'dark' ? DEFAULT_DARK_FOREGROUND : DEFAULT_FOREGROUND;
  const hasBackgroundImage = (() => {
    let node = lastElement;
    while (node) {
      const computed = window.getComputedStyle(node);
      if (computed.backgroundImage && computed.backgroundImage !== 'none') return true;
      node = node.parentElement;
    }
    return false;
  })();
  const borderColor = hasBackgroundImage ? 'rgba(0, 0, 0, 0)' : undefined;

  return createTheme({ background, foreground, tone, borderColor });
};
