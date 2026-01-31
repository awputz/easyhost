/**
 * CRE Document Themes
 * Premium themes for commercial real estate documents
 */

export interface CRETheme {
  id: string
  name: string
  description: string
  primary: string
  primaryLight: string
  primaryDark: string
  accent: string
  background: string
  backgroundAlt: string
  text: string
  textSecondary: string
  textTertiary: string
  textInverse: string
  isDark: boolean
}

export const CRE_THEMES: Record<string, CRETheme> = {
  navy: {
    id: 'navy',
    name: 'Navy',
    description: 'Classic professional blue',
    primary: '#1e3a5f',
    primaryLight: '#2d4a6f',
    primaryDark: '#102a43',
    accent: '#3b82f6',
    background: '#FAF9F7',
    backgroundAlt: '#F5F4F2',
    text: '#1a1a1a',
    textSecondary: '#52525b',
    textTertiary: '#a1a1aa',
    textInverse: '#ffffff',
    isDark: false,
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Dark luxury with gold accents',
    primary: '#0a1628',
    primaryLight: '#1a2d4a',
    primaryDark: '#050d18',
    accent: '#c9a962',
    background: '#0a1628',
    backgroundAlt: '#1a2d4a',
    text: '#ffffff',
    textSecondary: '#c4d0e4',
    textTertiary: '#8b9cb5',
    textInverse: '#0a1628',
    isDark: true,
  },
  charcoal: {
    id: 'charcoal',
    name: 'Charcoal',
    description: 'Modern dark minimal',
    primary: '#2C2C2C',
    primaryLight: '#3A3A3A',
    primaryDark: '#1A1A1A',
    accent: '#ffffff',
    background: '#1a1a1a',
    backgroundAlt: '#2C2C2C',
    text: '#ffffff',
    textSecondary: '#a1a1a1',
    textTertiary: '#666666',
    textInverse: '#1a1a1a',
    isDark: true,
  },
  slate: {
    id: 'slate',
    name: 'Slate',
    description: 'Corporate blue-gray',
    primary: '#3D4F5F',
    primaryLight: '#4D5F6F',
    primaryDark: '#2D3F4F',
    accent: '#3b82f6',
    background: '#F5F5F5',
    backgroundAlt: '#E8E8E8',
    text: '#1a1a1a',
    textSecondary: '#52525b',
    textTertiary: '#a1a1aa',
    textInverse: '#ffffff',
    isDark: false,
  },
  espresso: {
    id: 'espresso',
    name: 'Espresso',
    description: 'Warm brown tones',
    primary: '#5C5043',
    primaryLight: '#6C6053',
    primaryDark: '#3D3A36',
    accent: '#c9a962',
    background: '#F5F0E8',
    backgroundAlt: '#EBE6DE',
    text: '#1a1a1a',
    textSecondary: '#5C5043',
    textTertiary: '#8B8578',
    textInverse: '#ffffff',
    isDark: false,
  },
  olive: {
    id: 'olive',
    name: 'Olive',
    description: 'Natural green tones',
    primary: '#5C6B47',
    primaryLight: '#6C7B57',
    primaryDark: '#4A5A3A',
    accent: '#c9a962',
    background: '#F5F0E8',
    backgroundAlt: '#EBE6DE',
    text: '#1a1a1a',
    textSecondary: '#5C6B47',
    textTertiary: '#8B9478',
    textInverse: '#ffffff',
    isDark: false,
  },
}

/**
 * Get CSS for a theme
 */
export function getThemeCSS(themeId: string): string {
  const theme = CRE_THEMES[themeId] || CRE_THEMES.navy

  return `
    :root {
      --primary: ${theme.primary};
      --primary-light: ${theme.primaryLight};
      --primary-dark: ${theme.primaryDark};
      --accent: ${theme.accent};
      --background: ${theme.background};
      --background-alt: ${theme.backgroundAlt};
      --text: ${theme.text};
      --text-secondary: ${theme.textSecondary};
      --text-tertiary: ${theme.textTertiary};
      --text-inverse: ${theme.textInverse};

      --font-display: 'Cormorant Garamond', 'Playfair Display', Georgia, serif;
      --font-body: 'Libre Franklin', 'Inter', -apple-system, sans-serif;
      --font-mono: 'IBM Plex Mono', 'Poppins', monospace;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: var(--font-body);
      background: var(--background);
      color: var(--text);
      line-height: 1.7;
    }

    /* Typography */
    h1, h2, h3, h4 {
      font-family: var(--font-display);
      font-weight: 400;
      color: ${theme.isDark ? theme.textInverse : theme.text};
    }

    h1 { font-size: 3rem; line-height: 1.1; margin-bottom: 1.5rem; }
    h2 { font-size: 2rem; line-height: 1.25; margin-bottom: 1rem; }
    h3 { font-size: 1.5rem; line-height: 1.3; margin-bottom: 0.75rem; }
    h4 { font-size: 1.25rem; line-height: 1.4; margin-bottom: 0.5rem; }

    p { margin-bottom: 1rem; color: var(--text-secondary); }

    /* Section Header with Gold Bar */
    .section-header {
      margin-bottom: 32px;
    }
    .section-header::before {
      content: '';
      display: block;
      width: 40px;
      height: 3px;
      background: var(--accent);
      margin-bottom: 16px;
    }

    /* Stat Box */
    .stat-box {
      background: ${theme.isDark ? 'rgba(255,255,255,0.95)' : 'var(--background-alt)'};
      padding: 24px;
      border-radius: 8px;
      text-align: center;
    }
    .stat-value {
      font-family: var(--font-mono);
      font-size: 2rem;
      font-weight: 500;
      color: ${theme.isDark ? '#1a1a1a' : 'var(--primary)'};
    }
    .stat-label {
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      opacity: 0.6;
      margin-top: 8px;
      color: ${theme.isDark ? '#666' : 'var(--text-tertiary)'};
    }

    /* Card */
    .card {
      background: ${theme.isDark ? 'rgba(255,255,255,0.05)' : 'white'};
      border: 1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
      border-radius: 12px;
      padding: 24px;
      margin: 1.5rem 0;
    }

    /* Data Table */
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table td {
      padding: 12px 0;
      border-bottom: 1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
    }
    .data-table .label {
      color: var(--text-tertiary);
    }
    .data-table .value {
      text-align: right;
      color: ${theme.isDark ? 'var(--text-inverse)' : 'var(--text)'};
    }

    /* Status Badge */
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      background: rgba(201, 169, 98, 0.15);
      color: #c9a962;
    }
    .badge.success { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
    .badge.warning { background: rgba(234, 179, 8, 0.15); color: #eab308; }
    .badge.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

    /* Grid */
    .grid { display: grid; gap: 16px; }
    .grid-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-3 { grid-template-columns: repeat(3, 1fr); }
    .grid-4 { grid-template-columns: repeat(4, 1fr); }

    @media (max-width: 768px) {
      .grid-2, .grid-3, .grid-4 { grid-template-columns: 1fr; }
      h1 { font-size: 2rem; }
      h2 { font-size: 1.5rem; }
    }

    /* Page structure */
    .page {
      min-height: 100vh;
      padding: 64px;
      page-break-after: always;
    }

    @media print {
      .page { page-break-after: always; }
    }

    /* Links */
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* CTA Button */
    .cta {
      display: inline-block;
      background: var(--accent);
      color: ${theme.isDark ? 'var(--primary)' : 'white'};
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 500;
      text-decoration: none;
    }
    .cta:hover {
      opacity: 0.9;
      text-decoration: none;
    }
  `
}

/**
 * Get full HTML wrapper for a document
 */
export function wrapDocumentHTML(content: string, title: string, themeId: string): string {
  const theme = CRE_THEMES[themeId] || CRE_THEMES.navy
  const css = getThemeCSS(themeId)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Libre+Franklin:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&family=Playfair+Display:wght@300;400&family=Poppins:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    ${css}
  </style>
</head>
<body>
  ${content}
</body>
</html>`
}

/**
 * Theme color swatches for UI
 */
export function getThemeSwatches(): Array<{ id: string; name: string; colors: string[] }> {
  return Object.values(CRE_THEMES).map(theme => ({
    id: theme.id,
    name: theme.name,
    colors: [theme.primary, theme.accent, theme.background],
  }))
}
