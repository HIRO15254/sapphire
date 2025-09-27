// Player Note API Type Definitions
// Created for TASK-0511: リッチテキストメモAPI実装

// Main API Request/Response types
export interface GetPlayerNoteRequest {
  player_id: string;
}

export interface SavePlayerNoteRequest {
  player_id: string;
  content: string;
  content_type: ContentType;
}

export interface GetPlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: NoteError;
}

export interface SavePlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: NoteError;
}

// Core data types
export interface PlayerNote {
  id: string;
  player_id: string;
  content: string;
  content_type: ContentType;
  content_hash: string;
  created_at: string;
  updated_at: string;
}

export type ContentType = 'json' | 'html';

// TipTap JSON structure types
export interface TipTapDocument {
  type: 'doc';
  content?: TipTapNode[];
}

export interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: TipTapMark[];
}

export interface TipTapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// Error type definitions
export const NOTE_ERROR_CODES = {
  PLAYER_NOT_FOUND: 'NOTE_PLAYER_NOT_FOUND',
  INVALID_PLAYER_ID: 'NOTE_INVALID_PLAYER_ID',
  INVALID_CONTENT: 'NOTE_INVALID_CONTENT',
  INVALID_JSON: 'NOTE_INVALID_JSON',
  CONTENT_TOO_LARGE: 'NOTE_CONTENT_TOO_LARGE',
  SANITIZATION_FAILED: 'NOTE_SANITIZATION_FAILED',
  DATABASE_ERROR: 'NOTE_DATABASE_ERROR',
  TIMEOUT_ERROR: 'NOTE_TIMEOUT_ERROR',
  PERMISSION_DENIED: 'NOTE_PERMISSION_DENIED',
  DISK_FULL: 'NOTE_DISK_FULL',
  FOREIGN_KEY_VIOLATION: 'NOTE_FOREIGN_KEY_VIOLATION',
} as const;

export type NoteErrorCode = typeof NOTE_ERROR_CODES[keyof typeof NOTE_ERROR_CODES];

export interface NoteError {
  code: NoteErrorCode;
  message: string;
  details?: {
    player_id?: string;
    content_size?: number;
    content_type?: string;
    validation_errors?: string[];
  };
}

// Constants
export const MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_PLAYER_ID_LENGTH = 255;
export const SUPPORTED_HTML_TAGS = [
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 'ul', 'ol', 'li',
  'a', 'br', 'blockquote', 'code', 'pre'
];
export const ALLOWED_HTML_ATTRIBUTES = ['href', 'title'];

// Validation helpers
export function isValidPlayerNoteRequest(request: GetPlayerNoteRequest | SavePlayerNoteRequest): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Player ID validation
  if (!request.player_id || typeof request.player_id !== 'string') {
    errors.push('Player ID is required and must be a string.');
  } else if (request.player_id.length === 0) {
    errors.push('Player ID cannot be empty.');
  } else if (request.player_id.length > MAX_PLAYER_ID_LENGTH) {
    errors.push(`Player ID too long. Maximum ${MAX_PLAYER_ID_LENGTH} characters allowed.`);
  }

  // Content validation for save requests
  if ('content' in request) {
    if (request.content === null || request.content === undefined) {
      errors.push('Content is required.');
    } else if (typeof request.content !== 'string') {
      errors.push('Content must be a string.');
    } else if (Buffer.byteLength(request.content, 'utf8') > MAX_CONTENT_SIZE) {
      errors.push(`Content too large. Maximum ${MAX_CONTENT_SIZE} bytes allowed.`);
    }

    // Content type validation
    if (request.content_type && !isValidContentType(request.content_type)) {
      errors.push('Invalid content type. Must be "json" or "html".');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function isValidContentType(contentType: string): contentType is ContentType {
  return contentType === 'json' || contentType === 'html';
}

export function detectContentType(content: string): ContentType {
  if (!content) return 'html';

  const trimmed = content.trim();

  // Check if it starts with JSON-like structure
  if (trimmed.startsWith('{') && trimmed.includes('"type"')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.type === 'doc') {
        return 'json';
      }
    } catch {
      // Not valid JSON, treat as HTML
    }
  }

  return 'html';
}

export function isValidTipTapJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    return isValidTipTapDocument(parsed);
  } catch {
    return false;
  }
}

export function isValidTipTapDocument(obj: unknown): obj is TipTapDocument {
  if (!obj || typeof obj !== 'object') return false;

  const doc = obj as Record<string, unknown>;

  // Must have type 'doc'
  if (doc.type !== 'doc') return false;

  // Content is optional, but if present must be array
  if (doc.content !== undefined) {
    if (!Array.isArray(doc.content)) return false;

    // Each content item must be a valid node
    for (const node of doc.content) {
      if (!isValidTipTapNode(node)) return false;
    }
  }

  return true;
}

export function isValidTipTapNode(obj: unknown): obj is TipTapNode {
  if (!obj || typeof obj !== 'object') return false;

  const node = obj as Record<string, unknown>;

  // Must have type
  if (!node.type || typeof node.type !== 'string') return false;

  // Content is optional array
  if (node.content !== undefined) {
    if (!Array.isArray(node.content)) return false;

    // Recursively validate child nodes
    for (const child of node.content) {
      if (!isValidTipTapNode(child)) return false;
    }
  }

  // Text is optional string
  if (node.text !== undefined && typeof node.text !== 'string') return false;

  // Attrs is optional object
  if (node.attrs !== undefined && (typeof node.attrs !== 'object' || node.attrs === null)) return false;

  // Marks is optional array
  if (node.marks !== undefined) {
    if (!Array.isArray(node.marks)) return false;

    for (const mark of node.marks) {
      if (!isValidTipTapMark(mark)) return false;
    }
  }

  return true;
}

export function isValidTipTapMark(obj: unknown): obj is TipTapMark {
  if (!obj || typeof obj !== 'object') return false;

  const mark = obj as Record<string, unknown>;

  // Must have type
  if (!mark.type || typeof mark.type !== 'string') return false;

  // Attrs is optional object
  if (mark.attrs !== undefined && (typeof mark.attrs !== 'object' || mark.attrs === null)) return false;

  return true;
}

// Utility functions
export function generateContentHash(content: string): string {
  // Simple hash function for testing (in real implementation, use crypto)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

export function sanitizeHTML(html: string): string {
  // Mock sanitization for testing
  // In real implementation, use a proper HTML sanitizer like DOMPurify
  return html
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/style\s*=\s*["'][^"']*expression[^"']*["']/gi, '')
    .replace(/alert\([^)]*\)/gi, ''); // Remove alert calls
}

// Mock data generators for testing
export function generateMockPlayerNote(overrides: Partial<PlayerNote> = {}): PlayerNote {
  const baseNote: PlayerNote = {
    id: `note-${Math.random().toString(36).substr(2, 9)}`,
    player_id: `player-${Math.random().toString(36).substr(2, 9)}`,
    content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Test note content"}]}]}',
    content_type: 'json',
    content_hash: Math.random().toString(16).substr(2, 8),
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };

  return baseNote;
}

export function generateMockTipTapJSON(text: string = 'Test content'): string {
  const doc: TipTapDocument = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      },
    ],
  };

  return JSON.stringify(doc);
}

export function generateComplexMockTipTapJSON(): string {
  const doc: TipTapDocument = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 1 },
        content: [
          {
            type: 'text',
            text: 'Player Note',
          },
        ],
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: 'This is a ',
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
            text: ' text with a ',
          },
          {
            type: 'text',
            text: 'link',
            marks: [{ type: 'link', attrs: { href: 'https://example.com' } }],
          },
          {
            type: 'text',
            text: '.',
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
                    text: 'First item',
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
                    text: 'Second item',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

  return JSON.stringify(doc);
}

export function generateMockHTML(text: string = 'Test HTML content'): string {
  return `<p><strong>${text}</strong> with <em>formatting</em> and <a href="https://example.com">link</a></p>`;
}

export function generateLargeContent(sizeInMB: number): string {
  const targetSize = sizeInMB * 1024 * 1024;
  const baseText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. ';
  const repetitions = Math.ceil(targetSize / baseText.length);
  return baseText.repeat(repetitions).substring(0, targetSize);
}

// Performance testing utilities
export interface PerformanceTracker {
  startTime: number;
  endTime?: number;
  duration?: number;
}

export function startPerformanceTracking(): PerformanceTracker {
  return {
    startTime: performance.now(),
  };
}

export function endPerformanceTracking(tracker: PerformanceTracker): number {
  tracker.endTime = performance.now();
  tracker.duration = tracker.endTime - tracker.startTime;
  return tracker.duration;
}

export function expectResponseTime(actualMs: number, expectedMaxMs: number): boolean {
  return actualMs <= expectedMaxMs;
}

export function getMemoryUsage(): number {
  // Mock memory usage for testing
  return Math.random() * 50; // Return random value between 0-50MB
}