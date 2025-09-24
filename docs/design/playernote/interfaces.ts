// Player Note TypeScript インターフェース定義
// 🔵 青信号: EARS要件定義書のエンティティ要件に基づく型定義

// =====================================
// Core Entity Interfaces
// =====================================

// プレイヤーエンティティ（REQ-001）
export interface Player {
  id: string;
  name: string;
  player_type_id?: string; // REQ-002: 最大1つのタイプ割り当て
  created_at: Date;
  updated_at: Date;
}

// プレイヤータイプエンティティ（REQ-002, REQ-101, REQ-102）
export interface PlayerType {
  id: string;
  name: string;
  color: string; // HEX color code
  created_at: Date;
  updated_at: Date;
}

// タグエンティティ（REQ-003, REQ-104, REQ-105）
export interface Tag {
  id: string;
  name: string;
  color: string; // Base color for level calculations
  created_at: Date;
  updated_at: Date;
}

// プレイヤータグ関連エンティティ（REQ-003）
export interface PlayerTag {
  id: string;
  player_id: string;
  tag_id: string;
  level: number; // 1-10 (REQ-105)
  created_at: Date;
  updated_at: Date;
}

// プレイヤーメモエンティティ（REQ-004, REQ-106）
export interface PlayerNote {
  id: string;
  player_id: string;
  content: string; // Rich text content from TipTap
  created_at: Date;
  updated_at: Date;
}

// =====================================
// Extended/Composed Interfaces
// =====================================

// タグレベル情報付きタグ（UI表示用）
export interface TagWithLevel {
  tag: Tag;
  level: number;
  computed_color: string; // Level-based color intensity
}

// プレイヤー詳細情報（関連データ含む）
export interface PlayerDetail {
  player: Player;
  player_type?: PlayerType;
  tags: TagWithLevel[];
  notes: PlayerNote[];
}

// プレイヤーリスト項目（検索結果表示用）
export interface PlayerListItem {
  player: Player;
  player_type?: PlayerType;
  tag_count: number;
  last_note_updated?: Date;
}

// =====================================
// API Request/Response Interfaces
// =====================================

// プレイヤー作成リクエスト（REQ-001）
export interface CreatePlayerRequest {
  name: string;
  player_type_id?: string;
}

export interface CreatePlayerResponse {
  success: boolean;
  data?: Player;
  error?: ApiError;
}

// プレイヤー更新リクエスト
export interface UpdatePlayerRequest {
  id: string;
  name?: string;
  player_type_id?: string | null; // null で削除
}

export interface UpdatePlayerResponse {
  success: boolean;
  data?: Player;
  error?: ApiError;
}

// プレイヤー削除レスポンス（REQ-401: カスケード削除）
export interface DeletePlayerResponse {
  success: boolean;
  deleted_relations?: {
    notes_count: number;
    tags_count: number;
  };
  error?: ApiError;
}

// プレイヤータイプ作成リクエスト（REQ-101, REQ-102）
export interface CreatePlayerTypeRequest {
  name: string;
  color: string; // HEX color
}

export interface CreatePlayerTypeResponse {
  success: boolean;
  data?: PlayerType;
  error?: ApiError;
}

// タグ作成リクエスト（REQ-104）
export interface CreateTagRequest {
  name: string;
  color: string; // Base HEX color
}

export interface CreateTagResponse {
  success: boolean;
  data?: Tag;
  error?: ApiError;
}

// タグ割り当てリクエスト（REQ-003, REQ-105）
export interface TagAssignment {
  tag_id: string;
  level: number; // 1-10
}

export interface AssignTagsRequest {
  player_id: string;
  tag_assignments: TagAssignment[];
}

export interface AssignTagsResponse {
  success: boolean;
  data?: PlayerTag[];
  error?: ApiError;
}

// タグ削除リクエスト
export interface RemoveTagRequest {
  player_id: string;
  tag_id: string;
}

export interface RemoveTagResponse {
  success: boolean;
  error?: ApiError;
}

// プレイヤーメモ保存リクエスト（REQ-004, REQ-106）
export interface SavePlayerNoteRequest {
  player_id: string;
  content: string; // TipTap rich text content
}

export interface SavePlayerNoteResponse {
  success: boolean;
  data?: PlayerNote;
  error?: ApiError;
}

// 検索リクエスト（REQ-005）
export interface SearchPlayersRequest {
  query: string; // 部分一致検索
  limit?: number; // デフォルト50
  offset?: number; // ページネーション用
}

export interface SearchPlayersResponse {
  success: boolean;
  data?: {
    players: PlayerListItem[];
    total_count: number;
    has_more: boolean;
  };
  error?: ApiError;
}

// プレイヤー一覧取得リクエスト
export interface GetPlayersRequest {
  limit?: number; // デフォルト50, NFR-101: 1秒以内表示
  offset?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface GetPlayersResponse {
  success: boolean;
  data?: {
    players: PlayerListItem[];
    total_count: number;
    has_more: boolean;
  };
  error?: ApiError;
}

// =====================================
// Common/Utility Interfaces
// =====================================

// API エラーレスポンス
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// 汎用APIレスポンス
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

// タグレベルカラー計算パラメータ（REQ-105）
export interface ColorLevelOptions {
  base_color: string; // HEX color
  level: number; // 1-10
  intensity_method?: 'opacity' | 'saturation' | 'brightness';
}

// 🟡 黄信号: パフォーマンス要件から推測した仮想化リスト用インターフェース
export interface VirtualListOptions {
  item_height: number; // 各項目の高さ
  container_height: number; // 表示コンテナの高さ
  buffer_size?: number; // 表示範囲外のバッファサイズ
}

// =====================================
// React Hook Interfaces
// =====================================

// usePlayer hook 戻り値
export interface UsePlayerReturn {
  players: PlayerListItem[];
  loading: boolean;
  error: string | null;
  createPlayer: (request: CreatePlayerRequest) => Promise<void>;
  updatePlayer: (request: UpdatePlayerRequest) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  refreshPlayers: () => Promise<void>;
}

// usePlayerSearch hook 戻り値（REQ-005, NFR-102: 500ms応答）
export interface UsePlayerSearchReturn {
  searchResults: PlayerListItem[];
  searching: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
}

// usePlayerType hook 戻り値
export interface UsePlayerTypeReturn {
  playerTypes: PlayerType[];
  loading: boolean;
  error: string | null;
  createPlayerType: (request: CreatePlayerTypeRequest) => Promise<void>;
  updatePlayerType: (id: string, updates: Partial<PlayerType>) => Promise<void>;
  deletePlayerType: (id: string) => Promise<void>;
}

// useTag hook 戻り値
export interface UseTagReturn {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  createTag: (request: CreateTagRequest) => Promise<void>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  assignTags: (request: AssignTagsRequest) => Promise<void>;
  removeTag: (request: RemoveTagRequest) => Promise<void>;
}

// usePlayerNote hook 戻り値（REQ-106: TipTap, NFR-103: 300ms起動）
export interface UsePlayerNoteReturn {
  notes: Record<string, PlayerNote>; // player_id をキーとする
  loading: boolean;
  error: string | null;
  getPlayerNote: (player_id: string) => PlayerNote | null;
  savePlayerNote: (request: SavePlayerNoteRequest) => Promise<void>;
  loadPlayerNote: (player_id: string) => Promise<void>;
}

// =====================================
// Component Props Interfaces
// =====================================

// PlayerCard コンポーネント props
export interface PlayerCardProps {
  player: PlayerDetail;
  onEdit?: (player: Player) => void;
  onDelete?: (player: Player) => void;
  onTagClick?: (tag: TagWithLevel) => void;
  compact?: boolean; // 簡略表示モード
}

// PlayerForm コンポーネント props
export interface PlayerFormProps {
  player?: Player; // 編集時は既存プレイヤー
  playerTypes: PlayerType[];
  onSubmit: (data: CreatePlayerRequest | UpdatePlayerRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

// PlayerList コンポーネント props
export interface PlayerListProps {
  players: PlayerListItem[];
  loading?: boolean;
  onPlayerClick?: (player: Player) => void;
  onPlayerEdit?: (player: Player) => void;
  onPlayerDelete?: (player: Player) => void;
  virtualScrolling?: boolean; // NFR-101対応
}

// TagSelector コンポーネント props（REQ-003, REQ-105）
export interface TagSelectorProps {
  availableTags: Tag[];
  selectedTags: TagWithLevel[];
  onChange: (tags: TagAssignment[]) => void;
  maxLevel?: number; // デフォルト10
  showLevelSlider?: boolean;
}

// RichTextEditor コンポーネント props（REQ-106）
export interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave?: (content: string) => void;
  placeholder?: string;
  autoSave?: boolean;
  saveDelay?: number; // ms
  editorOptions?: Record<string, any>; // TipTap options
}

// =====================================
// Validation Interfaces
// =====================================

// 🟡 黄信号: 一般的なバリデーション要件から推測
export interface ValidationRule {
  field: string;
  rule: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: string | number;
  message: string;
  validator?: (value: any) => boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

// フォームバリデーション設定
export interface PlayerFormValidation {
  name: ValidationRule[];
  player_type_id?: ValidationRule[];
}

export interface TagFormValidation {
  name: ValidationRule[];
  color: ValidationRule[];
}

// =====================================
// Future Phase Interfaces (Phase 2, 3)
// =====================================

// 🔵 青信号: 要件定義書のPhase 2, 3要件に基づく

// Phase 2: HTMLテンプレート機能
export interface PlayerTemplate {
  id: string;
  name: string;
  template_content: string; // HTML template
  default_player_type_id?: string;
  default_tags: TagAssignment[];
  created_at: Date;
  updated_at: Date;
}

// Phase 2: 複合検索
export interface AdvancedSearchRequest {
  name_query?: string;
  player_type_ids?: string[];
  tag_filters?: TagFilter[];
  date_range?: {
    start_date: Date;
    end_date: Date;
  };
  has_notes?: boolean;
}

export interface TagFilter {
  tag_id: string;
  min_level?: number;
  max_level?: number;
}

// Phase 3: 保存可能な検索条件
export interface SavedSearch {
  id: string;
  name: string;
  search_criteria: AdvancedSearchRequest;
  created_at: Date;
  updated_at: Date;
}

// Phase 3: プレイヤー統計
export interface PlayerStatistics {
  player_id: string;
  total_encounters: number;
  tags_history: TagHistoryItem[];
  notes_count: number;
  last_encounter: Date;
  created_at: Date;
}

export interface TagHistoryItem {
  tag_id: string;
  level: number;
  assigned_at: Date;
}