# TDD Requirements - TASK-0512: バックエンド統合テストと最適化

## 概要

全APIエンドポイントの完全な統合テスト実装、パフォーマンス詳細プロファイリング、データベースクエリ最適化、メモリ使用量最適化、エラーハンドリング統合を実施する。Phase 1の総仕上げとして、全システムの品質保証とパフォーマンス目標達成を確保する。

## 要件ソース

- **要件定義**: NFR-101, NFR-102, NFR-104
- **依存タスク**: TASK-0511 ✅ 完了済み
- **推定工数**: 16時間（2日）

## 機能要件

### 🔵 青信号項目（要件準拠）

#### FS-01: 完全API統合テスト
- **要件**: NFR-101, NFR-102, NFR-104
- **説明**: 全APIエンドポイントの包括的統合テスト
- **対象API**: プレイヤー一覧、検索、詳細取得、メモ操作（5つ）
- **テスト種類**: 機能、パフォーマンス、エラーケース、境界値
- **自動化**: CI/CD統合可能な自動テストスイート

#### FS-02: パフォーマンスプロファイリング
- **要件**: NFR-101, NFR-102, NFR-104
- **説明**: 全APIの詳細パフォーマンス測定・分析
- **測定項目**: レスポンス時間、メモリ使用量、CPU使用率
- **プロファイリング**: リクエスト処理のボトルネック特定
- **レポート**: 詳細パフォーマンス分析結果

#### FS-03: データベースクエリ最適化
- **要件**: NFR-104
- **説明**: 全SQLクエリの実行計画分析・最適化
- **最適化対象**: EXPLAIN QUERY PLAN分析
- **インデックス戦略**: 複合インデックス最適配置
- **クエリ改善**: N+1問題解決、JOIN最適化

#### FS-04: メモリ使用量最適化
- **要件**: NFR-101, NFR-102
- **説明**: アプリケーション全体のメモリ効率改善
- **監視対象**: Rustヒープ、SQLite接続プール
- **最適化**: メモリリーク検出・修正
- **目標**: 安定したメモリ使用パターン確立

### 🟡 黄信号項目（妥当な推測）

#### FS-05: エラーハンドリング統合
- **エラー種類**: ネットワーク、データベース、バリデーション
- **統一レスポンス**: 一貫したエラー形式
- **ログ戦略**: 構造化ログ・エラー追跡
- **復旧機能**: 自動リトライ・フォールバック

#### FS-06: 負荷テスト実装
- **同時リクエスト**: 10-50並行リクエスト
- **負荷パターン**: 段階的負荷増加
- **スループット**: req/sec測定
- **安定性**: 長時間負荷での安定性確認

#### FS-07: E2Eテストシナリオ
- **実用的ワークフロー**: プレイヤー管理の典型的利用パターン
- **データ整合性**: 複数API連携での整合性確認
- **状態管理**: セッション状態・データ永続性

## パフォーマンス要件

### 🔵 青信号項目（要件準拠）

#### NFR-01: レスポンス時間達成確認
- **要件**: NFR-101, NFR-102, NFR-104
- **プレイヤー一覧**: ≤1000ms（NFR-101）
- **検索機能**: ≤500ms（NFR-102）
- **詳細取得**: ≤200ms（NFR-104）
- **メモ操作**: ≤300ms（TASK-0511要件）
- **測定条件**: 本番相当データ量での計測

#### NFR-02: システムリソース効率
- **メモリ使用量**: ベースライン+20%以内
- **CPU使用率**: 高負荷時80%以下
- **ディスクI/O**: 効率的なSQLite操作
- **ネットワーク**: 最小限のデータ転送

#### NFR-03: 同時実行性能
- **並行処理**: 10リクエスト/秒以上
- **データベースロック**: 最小限の競合
- **レスポンス劣化**: 負荷時20%以内の劣化
- **スループット**: 安定したreq/sec維持

### 🟡 黄信号項目（妥当な推測）

#### NFR-04: 可用性・信頼性
- **エラー率**: 1%以下
- **復旧時間**: 自動復旧5秒以内
- **データ一貫性**: ACID特性保証
- **障害トレーサビリティ**: 完全なログ記録

## 統合テスト仕様

### E2E統合テストシナリオ

```typescript
// E2E統合テストケース定義
interface E2ETestScenario {
  scenario_id: string;
  description: string;
  steps: TestStep[];
  expected_performance: PerformanceTarget;
  data_consistency_checks: string[];
}

interface TestStep {
  step_id: string;
  action: 'api_call' | 'verify_data' | 'wait' | 'setup';
  api_command?: string;
  parameters?: Record<string, any>;
  expected_result?: any;
  performance_limit?: number; // milliseconds
}

interface PerformanceTarget {
  total_time_limit: number;
  individual_api_limits: Record<string, number>;
  memory_limit: number;
  error_tolerance: number;
}
```

### 主要E2Eシナリオ

#### E2E-01: プレイヤー管理完全ワークフロー
```typescript
const playerManagementWorkflow: E2ETestScenario = {
  scenario_id: 'E2E-01',
  description: '新規プレイヤー登録からメモ作成まで',
  steps: [
    {
      step_id: 'E2E-01-01',
      action: 'api_call',
      api_command: 'list_players',
      expected_result: { success: true },
      performance_limit: 1000 // NFR-101
    },
    {
      step_id: 'E2E-01-02',
      action: 'api_call',
      api_command: 'search_players',
      parameters: { query: 'テストプレイヤー' },
      performance_limit: 500 // NFR-102
    },
    {
      step_id: 'E2E-01-03',
      action: 'api_call',
      api_command: 'get_player_detail',
      parameters: { player_id: 'test_player_001' },
      performance_limit: 200 // NFR-104
    },
    {
      step_id: 'E2E-01-04',
      action: 'api_call',
      api_command: 'save_player_note',
      parameters: {
        player_id: 'test_player_001',
        content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"テストメモ"}]}]}'
      },
      performance_limit: 300 // TASK-0511要件
    },
    {
      step_id: 'E2E-01-05',
      action: 'api_call',
      api_command: 'get_player_note',
      parameters: { player_id: 'test_player_001' },
      performance_limit: 300
    }
  ],
  expected_performance: {
    total_time_limit: 2500,
    individual_api_limits: {
      'list_players': 1000,
      'search_players': 500,
      'get_player_detail': 200,
      'save_player_note': 300,
      'get_player_note': 300
    },
    memory_limit: 50, // MB
    error_tolerance: 0
  },
  data_consistency_checks: [
    'プレイヤーデータ整合性',
    'メモ内容完全性',
    'タイムスタンプ整合性',
    'リレーション整合性'
  ]
};
```

#### E2E-02: 高負荷ストレステスト
```typescript
const loadStressTest: E2ETestScenario = {
  scenario_id: 'E2E-02',
  description: '並行負荷でのシステム安定性確認',
  steps: [
    {
      step_id: 'E2E-02-01',
      action: 'setup',
      description: '並行リクエスト開始（10並行×10秒）'
    },
    {
      step_id: 'E2E-02-02',
      action: 'api_call',
      api_command: 'list_players',
      description: '並行実行中のリスト取得'
    },
    {
      step_id: 'E2E-02-03',
      action: 'verify_data',
      description: 'データ整合性・レスポンス品質確認'
    }
  ],
  expected_performance: {
    total_time_limit: 12000,
    individual_api_limits: {
      'list_players': 1200, // 負荷時20%劣化許容
      'search_players': 600,
      'get_player_detail': 240
    },
    memory_limit: 100, // MB
    error_tolerance: 1 // 1%以下
  },
  data_consistency_checks: [
    '並行アクセス時データ整合性',
    'トランザクション隔離性',
    'メモリリーク検出'
  ]
};
```

## パフォーマンスプロファイリング

### プロファイリング実装

```rust
// src/performance/profiler.rs

use std::collections::HashMap;
use std::time::{Duration, Instant};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceMetrics {
    pub api_name: String,
    pub response_time_ms: u64,
    pub memory_usage_mb: f64,
    pub cpu_usage_percent: f64,
    pub db_query_time_ms: u64,
    pub db_query_count: u32,
    pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceReport {
    pub summary: PerformanceSummary,
    pub detailed_metrics: Vec<PerformanceMetrics>,
    pub bottlenecks: Vec<PerformanceBottleneck>,
    pub optimization_recommendations: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceSummary {
    pub total_tests: u32,
    pub passed_nfr_tests: u32,
    pub failed_nfr_tests: u32,
    pub average_response_time: f64,
    pub max_memory_usage: f64,
    pub error_rate: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PerformanceBottleneck {
    pub api_name: String,
    pub bottleneck_type: String, // "database", "memory", "cpu", "network"
    pub impact_level: String,    // "high", "medium", "low"
    pub description: String,
    pub recommendation: String,
}

pub struct ApiProfiler {
    start_time: Instant,
    memory_baseline: usize,
    metrics: Vec<PerformanceMetrics>,
}

impl ApiProfiler {
    pub fn new() -> Self {
        Self {
            start_time: Instant::now(),
            memory_baseline: get_memory_usage(),
            metrics: Vec::new(),
        }
    }

    pub async fn profile_api<F, T>(&mut self, api_name: &str, api_call: F) -> Result<T, String>
    where
        F: std::future::Future<Output = Result<T, String>>,
    {
        let start = Instant::now();
        let memory_before = get_memory_usage();
        let cpu_before = get_cpu_usage();

        let db_queries_before = get_db_query_count();

        let result = api_call.await;

        let duration = start.elapsed();
        let memory_after = get_memory_usage();
        let cpu_after = get_cpu_usage();
        let db_queries_after = get_db_query_count();

        let metrics = PerformanceMetrics {
            api_name: api_name.to_string(),
            response_time_ms: duration.as_millis() as u64,
            memory_usage_mb: (memory_after as f64 - memory_before as f64) / 1024.0 / 1024.0,
            cpu_usage_percent: cpu_after - cpu_before,
            db_query_time_ms: get_last_db_query_time(),
            db_query_count: db_queries_after - db_queries_before,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        self.metrics.push(metrics);
        result
    }

    pub fn generate_report(&self) -> PerformanceReport {
        let summary = self.calculate_summary();
        let bottlenecks = self.identify_bottlenecks();
        let recommendations = self.generate_recommendations(&bottlenecks);

        PerformanceReport {
            summary,
            detailed_metrics: self.metrics.clone(),
            bottlenecks,
            optimization_recommendations: recommendations,
        }
    }

    fn calculate_summary(&self) -> PerformanceSummary {
        let total_tests = self.metrics.len() as u32;
        let passed_nfr = self.count_nfr_passes();
        let avg_response_time = self.metrics.iter()
            .map(|m| m.response_time_ms as f64)
            .sum::<f64>() / total_tests as f64;
        let max_memory = self.metrics.iter()
            .map(|m| m.memory_usage_mb)
            .fold(0.0, f64::max);

        PerformanceSummary {
            total_tests,
            passed_nfr_tests: passed_nfr,
            failed_nfr_tests: total_tests - passed_nfr,
            average_response_time: avg_response_time,
            max_memory_usage: max_memory,
            error_rate: 0.0, // 実装で計算
        }
    }

    fn identify_bottlenecks(&self) -> Vec<PerformanceBottleneck> {
        let mut bottlenecks = Vec::new();

        // NFR要件チェック
        for metric in &self.metrics {
            if let Some(bottleneck) = self.check_nfr_compliance(metric) {
                bottlenecks.push(bottleneck);
            }
        }

        bottlenecks
    }

    fn check_nfr_compliance(&self, metric: &PerformanceMetrics) -> Option<PerformanceBottleneck> {
        let (limit, nfr_code) = match metric.api_name.as_str() {
            "list_players" => (1000, "NFR-101"),
            "search_players" => (500, "NFR-102"),
            "get_player_detail" => (200, "NFR-104"),
            "save_player_note" | "get_player_note" => (300, "TASK-0511"),
            _ => return None,
        };

        if metric.response_time_ms > limit {
            Some(PerformanceBottleneck {
                api_name: metric.api_name.clone(),
                bottleneck_type: "response_time".to_string(),
                impact_level: "high".to_string(),
                description: format!(
                    "{}要件違反: {}ms (制限: {}ms)",
                    nfr_code, metric.response_time_ms, limit
                ),
                recommendation: format!(
                    "データベースクエリ最適化、インデックス見直し、メモリ使用量削減を検討"
                ),
            })
        } else {
            None
        }
    }
}

// ヘルパー関数
fn get_memory_usage() -> usize {
    // プロセスメモリ使用量取得
    0 // 実装詳細
}

fn get_cpu_usage() -> f64 {
    // CPU使用率取得
    0.0 // 実装詳細
}

fn get_db_query_count() -> u32 {
    // データベースクエリ実行回数
    0 // 実装詳細
}

fn get_last_db_query_time() -> u64 {
    // 最後のDBクエリ時間
    0 // 実装詳細
}
```

### プロファイリング統合テスト

```rust
// src/performance/integration_tests.rs

#[cfg(test)]
mod integration_performance_tests {
    use super::*;
    use crate::commands::*;

    #[tokio::test]
    async fn test_all_apis_performance_compliance() {
        let mut profiler = ApiProfiler::new();
        let mut all_passed = true;

        // NFR-101: プレイヤー一覧（≤1000ms）
        let list_result = profiler.profile_api("list_players", async {
            list_players().await
        }).await;
        assert!(list_result.is_ok());

        // NFR-102: 検索（≤500ms）
        let search_result = profiler.profile_api("search_players", async {
            search_players("テスト".to_string()).await
        }).await;
        assert!(search_result.is_ok());

        // NFR-104: 詳細取得（≤200ms）
        let detail_result = profiler.profile_api("get_player_detail", async {
            get_player_detail("test_player_001".to_string()).await
        }).await;
        assert!(detail_result.is_ok());

        // TASK-0511: メモ保存（≤300ms）
        let save_note_result = profiler.profile_api("save_player_note", async {
            save_player_note(
                "test_player_001".to_string(),
                r#"{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"テスト"}]}]}"#.to_string()
            ).await
        }).await;
        assert!(save_note_result.is_ok());

        // TASK-0511: メモ取得（≤300ms）
        let get_note_result = profiler.profile_api("get_player_note", async {
            get_player_note("test_player_001".to_string()).await
        }).await;
        assert!(get_note_result.is_ok());

        // パフォーマンスレポート生成
        let report = profiler.generate_report();

        // レポート出力
        println!("=== パフォーマンステストレポート ===");
        println!("総テスト数: {}", report.summary.total_tests);
        println!("NFR準拠: {}/{}", report.summary.passed_nfr_tests, report.summary.total_tests);
        println!("平均レスポンス時間: {:.2}ms", report.summary.average_response_time);
        println!("最大メモリ使用量: {:.2}MB", report.summary.max_memory_usage);

        if !report.bottlenecks.is_empty() {
            println!("\n=== 検出されたボトルネック ===");
            for bottleneck in &report.bottlenecks {
                println!("🚨 {}: {}", bottleneck.api_name, bottleneck.description);
                println!("   推奨対策: {}", bottleneck.recommendation);
            }
            all_passed = false;
        }

        if !report.optimization_recommendations.is_empty() {
            println!("\n=== 最適化推奨事項 ===");
            for rec in &report.optimization_recommendations {
                println!("💡 {}", rec);
            }
        }

        // JSON形式でレポート保存
        let report_json = serde_json::to_string_pretty(&report).unwrap();
        std::fs::write("performance_report.json", report_json).unwrap();

        assert!(all_passed, "一部のAPIがパフォーマンス要件を満たしていません");
    }

    #[tokio::test]
    async fn test_concurrent_load_performance() {
        use tokio::time::{sleep, Duration};
        use std::sync::Arc;
        use tokio::sync::Mutex;

        let profiler = Arc::new(Mutex::new(ApiProfiler::new()));
        let mut handles = vec![];

        // 10並行リクエスト
        for i in 0..10 {
            let profiler_clone = profiler.clone();
            let handle = tokio::spawn(async move {
                let mut p = profiler_clone.lock().await;
                p.profile_api(&format!("concurrent_list_{}", i), async {
                    list_players().await
                }).await
            });
            handles.push(handle);
        }

        // すべてのリクエスト完了を待機
        let results: Vec<_> = futures::future::join_all(handles).await;

        // エラーチェック
        let error_count = results.iter().filter(|r| r.is_err()).count();
        let error_rate = error_count as f64 / results.len() as f64 * 100.0;

        println!("並行負荷テスト結果:");
        println!("- 並行リクエスト数: {}", results.len());
        println!("- エラー率: {:.2}%", error_rate);

        assert!(error_rate <= 1.0, "エラー率が1%を超えています: {:.2}%", error_rate);

        let profiler_guard = profiler.lock().await;
        let report = profiler_guard.generate_report();

        // 負荷時の20%劣化許容チェック
        for metric in &report.detailed_metrics {
            let baseline_limit = match metric.api_name.contains("list") {
                true => 1000,
                false => 500,
            };
            let load_limit = (baseline_limit as f64 * 1.2) as u64; // 20%劣化許容

            assert!(
                metric.response_time_ms <= load_limit,
                "負荷時レスポンス劣化が20%を超過: {}ms (許容: {}ms)",
                metric.response_time_ms, load_limit
            );
        }
    }

    #[tokio::test]
    async fn test_memory_leak_detection() {
        let initial_memory = get_memory_usage();
        let mut profiler = ApiProfiler::new();

        // 100回連続実行
        for i in 0..100 {
            profiler.profile_api(&format!("memory_test_{}", i), async {
                list_players().await
            }).await.unwrap();

            // 10回ごとにメモリチェック
            if i % 10 == 0 {
                let current_memory = get_memory_usage();
                let memory_growth = current_memory - initial_memory;

                // メモリ増加が100MB以下であることを確認
                assert!(
                    memory_growth < 100 * 1024 * 1024,
                    "メモリリーク疑い: {}MB増加",
                    memory_growth / 1024 / 1024
                );
            }
        }

        let final_memory = get_memory_usage();
        let total_growth = final_memory - initial_memory;

        println!("メモリリークテスト結果:");
        println!("- 初期メモリ: {}MB", initial_memory / 1024 / 1024);
        println!("- 最終メモリ: {}MB", final_memory / 1024 / 1024);
        println!("- 総増加量: {}MB", total_growth / 1024 / 1024);

        // 最終的に50MB以下の増加であることを確認
        assert!(
            total_growth < 50 * 1024 * 1024,
            "メモリリーク検出: {}MB増加",
            total_growth / 1024 / 1024
        );
    }
}
```

## データベース最適化

### クエリ最適化実装

```sql
-- SQLite EXPLAIN QUERY PLAN 分析用クエリ

-- プレイヤー一覧取得の最適化分析
EXPLAIN QUERY PLAN
SELECT
    p.id,
    p.name,
    p.player_type,
    COUNT(pt.id) as tag_count,
    AVG(CASE pt.level WHEN 'S' THEN 4 WHEN 'A' THEN 3 WHEN 'B' THEN 2 WHEN 'C' THEN 1 ELSE 0 END) as avg_tag_level
FROM players p
LEFT JOIN player_tags pt ON p.id = pt.player_id
GROUP BY p.id, p.name, p.player_type
ORDER BY p.name;

-- 検索クエリの最適化分析
EXPLAIN QUERY PLAN
SELECT DISTINCT
    p.id,
    p.name,
    p.player_type,
    highlight(players_fts, 0, '<mark>', '</mark>') as highlighted_name
FROM players_fts pf
JOIN players p ON p.id = pf.rowid
WHERE players_fts MATCH ?
ORDER BY rank
LIMIT 50;

-- プレイヤー詳細取得の最適化分析
EXPLAIN QUERY PLAN
SELECT
    p.id,
    p.name,
    p.player_type,
    p.description,
    p.created_at,
    p.updated_at,
    json_group_array(
        json_object(
            'id', pt.id,
            'tag_id', pt.tag_id,
            'level', pt.level,
            'tag_name', t.name,
            'color_code', t.color_code
        )
    ) as tags
FROM players p
LEFT JOIN player_tags pt ON p.id = pt.player_id
LEFT JOIN tags t ON pt.tag_id = t.id
WHERE p.id = ?
GROUP BY p.id;

-- メモ取得の最適化分析
EXPLAIN QUERY PLAN
SELECT
    id,
    player_id,
    content,
    content_type,
    created_at,
    updated_at
FROM player_notes
WHERE player_id = ?;

-- メモ保存(UPSERT)の最適化分析
EXPLAIN QUERY PLAN
INSERT INTO player_notes (player_id, content, content_type, content_hash, updated_at)
VALUES (?, ?, ?, ?, datetime('now'))
ON CONFLICT(player_id) DO UPDATE SET
    content = excluded.content,
    content_type = excluded.content_type,
    content_hash = excluded.content_hash,
    updated_at = datetime('now')
RETURNING *;
```

### インデックス最適化戦略

```sql
-- 現在のインデックス使用状況分析
PRAGMA table_info(players);
PRAGMA index_list(players);
PRAGMA index_info(idx_players_name);
PRAGMA index_info(idx_players_type);

-- クエリ実行統計情報
SELECT * FROM sqlite_stat1 WHERE tbl LIKE 'players%';

-- インデックス効率分析クエリ
WITH index_usage AS (
  SELECT
    'players' as table_name,
    'name search' as query_type,
    (SELECT COUNT(*) FROM players WHERE name LIKE '%テスト%') as matching_rows,
    (SELECT COUNT(*) FROM players) as total_rows
  UNION ALL
  SELECT
    'players' as table_name,
    'type filter' as query_type,
    (SELECT COUNT(*) FROM players WHERE player_type = 'ストライカー') as matching_rows,
    (SELECT COUNT(*) FROM players) as total_rows
  UNION ALL
  SELECT
    'player_tags' as table_name,
    'player lookup' as query_type,
    (SELECT COUNT(*) FROM player_tags WHERE player_id = 'test_player_001') as matching_rows,
    (SELECT COUNT(*) FROM player_tags) as total_rows
)
SELECT
  table_name,
  query_type,
  matching_rows,
  total_rows,
  ROUND(matching_rows * 100.0 / total_rows, 2) as selectivity_percent,
  CASE
    WHEN matching_rows * 100.0 / total_rows < 5 THEN '高効率（インデックス推奨）'
    WHEN matching_rows * 100.0 / total_rows < 20 THEN '中効率（インデックス有効）'
    ELSE '低効率（インデックス効果薄）'
  END as index_recommendation
FROM index_usage;

-- 複合インデックス最適化提案
SELECT
  'CREATE INDEX idx_players_type_name ON players(player_type, name)' as optimization_sql,
  'プレイヤー種別+名前の複合検索最適化' as description,
  'NFR-102（検索≤500ms）への寄与' as nfr_impact
UNION ALL
SELECT
  'CREATE INDEX idx_player_tags_player_level ON player_tags(player_id, level DESC)' as optimization_sql,
  'プレイヤー別タグレベル集計最適化' as description,
  'NFR-104（詳細≤200ms）への寄与' as nfr_impact
UNION ALL
SELECT
  'CREATE INDEX idx_player_notes_player_updated ON player_notes(player_id, updated_at DESC)' as optimization_sql,
  'プレイヤー別メモ取得最適化' as description,
  'TASK-0511（メモ≤300ms）への寄与' as nfr_impact;
```

### メモリ最適化実装

```rust
// src/optimization/memory_optimizer.rs

use std::sync::Arc;
use std::collections::HashMap;
use tokio::sync::RwLock;

pub struct MemoryOptimizer {
    connection_pool: Arc<RwLock<sqlx::SqlitePool>>,
    query_cache: Arc<RwLock<QueryCache>>,
    memory_monitor: MemoryMonitor,
}

#[derive(Debug)]
pub struct QueryCache {
    cache: HashMap<String, CachedResult>,
    max_size: usize,
    current_size: usize,
}

#[derive(Debug, Clone)]
pub struct CachedResult {
    data: String,
    created_at: std::time::Instant,
    access_count: u32,
    ttl: std::time::Duration,
}

#[derive(Debug)]
pub struct MemoryMonitor {
    baseline_memory: usize,
    peak_memory: usize,
    current_connections: u32,
}

impl MemoryOptimizer {
    pub fn new(pool: sqlx::SqlitePool) -> Self {
        Self {
            connection_pool: Arc::new(RwLock::new(pool)),
            query_cache: Arc::new(RwLock::new(QueryCache::new(100))), // 100エントリまでキャッシュ
            memory_monitor: MemoryMonitor::new(),
        }
    }

    pub async fn optimized_query<T>(&self, query: &str, params: &[&str]) -> Result<T, String>
    where
        T: serde::de::DeserializeOwned + serde::Serialize,
    {
        let cache_key = self.generate_cache_key(query, params);

        // キャッシュチェック
        if let Some(cached) = self.get_from_cache(&cache_key).await {
            return Ok(serde_json::from_str(&cached.data).map_err(|e| e.to_string())?);
        }

        // データベースクエリ実行
        let start_memory = self.memory_monitor.get_current_memory();
        let result = self.execute_query::<T>(query, params).await?;
        let end_memory = self.memory_monitor.get_current_memory();

        // メモリ使用量監視
        if end_memory > start_memory + 10 * 1024 * 1024 { // 10MB以上増加
            log::warn!("クエリによる大量メモリ使用検出: {}MB増加",
                      (end_memory - start_memory) / 1024 / 1024);
        }

        // キャッシュに保存（適切なTTL設定）
        let ttl = self.determine_cache_ttl(query);
        self.cache_result(&cache_key, &result, ttl).await;

        Ok(result)
    }

    async fn execute_query<T>(&self, query: &str, params: &[&str]) -> Result<T, String>
    where
        T: serde::de::DeserializeOwned,
    {
        let pool = self.connection_pool.read().await;

        // 接続プール最適化
        let connection = pool.acquire().await.map_err(|e| e.to_string())?;

        // SQLite固有の最適化設定
        sqlx::query("PRAGMA cache_size = -64000")  // 64MBキャッシュ
            .execute(&*connection).await.map_err(|e| e.to_string())?;

        sqlx::query("PRAGMA temp_store = MEMORY")  // 一時データをメモリに
            .execute(&*connection).await.map_err(|e| e.to_string())?;

        // 実際のクエリ実行は実装により異なる
        // ここではプレースホルダー
        todo!("実際のクエリ実行実装")
    }

    fn generate_cache_key(&self, query: &str, params: &[&str]) -> String {
        use std::collections::hash_map::DefaultHasher;
        use std::hash::{Hash, Hasher};

        let mut hasher = DefaultHasher::new();
        query.hash(&mut hasher);
        params.hash(&mut hasher);
        format!("query_{:x}", hasher.finish())
    }

    async fn get_from_cache(&self, key: &str) -> Option<CachedResult> {
        let cache = self.query_cache.read().await;
        if let Some(cached) = cache.cache.get(key) {
            if cached.created_at.elapsed() < cached.ttl {
                return Some(cached.clone());
            }
        }
        None
    }

    async fn cache_result<T>(&self, key: &str, result: &T, ttl: std::time::Duration)
    where
        T: serde::Serialize,
    {
        let serialized = serde_json::to_string(result).unwrap();
        let cached_result = CachedResult {
            data: serialized,
            created_at: std::time::Instant::now(),
            access_count: 1,
            ttl,
        };

        let mut cache = self.query_cache.write().await;
        cache.insert(key.to_string(), cached_result);
    }

    fn determine_cache_ttl(&self, query: &str) -> std::time::Duration {
        if query.contains("players") && !query.contains("INSERT") && !query.contains("UPDATE") {
            std::time::Duration::from_secs(300) // 5分キャッシュ
        } else if query.contains("player_notes") {
            std::time::Duration::from_secs(60)  // 1分キャッシュ
        } else {
            std::time::Duration::from_secs(30)  // 30秒キャッシュ
        }
    }

    pub async fn optimize_memory_usage(&mut self) -> MemoryOptimizationReport {
        let mut report = MemoryOptimizationReport::new();

        // キャッシュクリーンアップ
        let cleaned_entries = self.cleanup_expired_cache().await;
        report.cache_cleaned_entries = cleaned_entries;

        // 接続プール最適化
        let optimized_connections = self.optimize_connection_pool().await;
        report.optimized_connections = optimized_connections;

        // ガベージコレクション推奨
        if self.memory_monitor.get_current_memory() > self.memory_monitor.baseline_memory * 2 {
            report.gc_recommended = true;
            // 実際のGC実行は環境依存
        }

        report
    }

    async fn cleanup_expired_cache(&self) -> u32 {
        let mut cache = self.query_cache.write().await;
        let initial_size = cache.cache.len();

        cache.cache.retain(|_, cached| {
            cached.created_at.elapsed() < cached.ttl
        });

        (initial_size - cache.cache.len()) as u32
    }

    async fn optimize_connection_pool(&self) -> u32 {
        // 接続プール設定の動的最適化
        // 実装詳細は実際の要件により決定
        0
    }
}

impl QueryCache {
    fn new(max_size: usize) -> Self {
        Self {
            cache: HashMap::new(),
            max_size,
            current_size: 0,
        }
    }

    fn insert(&mut self, key: String, value: CachedResult) {
        if self.cache.len() >= self.max_size {
            self.evict_lru();
        }
        self.cache.insert(key, value);
    }

    fn evict_lru(&mut self) {
        // LRU実装: 最もアクセス頻度の低いエントリを削除
        if let Some(lru_key) = self.cache.iter()
            .min_by_key(|(_, cached)| cached.access_count)
            .map(|(key, _)| key.clone()) {
            self.cache.remove(&lru_key);
        }
    }
}

impl MemoryMonitor {
    fn new() -> Self {
        let current = Self::get_current_memory();
        Self {
            baseline_memory: current,
            peak_memory: current,
            current_connections: 0,
        }
    }

    fn get_current_memory() -> usize {
        // プロセスメモリ使用量取得の実装
        // 実際の実装はOS依存
        0
    }
}

#[derive(Debug)]
pub struct MemoryOptimizationReport {
    pub cache_cleaned_entries: u32,
    pub optimized_connections: u32,
    pub gc_recommended: bool,
    pub memory_saved_mb: f64,
}

impl MemoryOptimizationReport {
    fn new() -> Self {
        Self {
            cache_cleaned_entries: 0,
            optimized_connections: 0,
            gc_recommended: false,
            memory_saved_mb: 0.0,
        }
    }
}
```

## 負荷テスト仕様

### 負荷テスト実装

```typescript
// src/test/load-tests.ts

interface LoadTestConfig {
  concurrency: number;        // 並行ユーザー数
  duration_seconds: number;   // テスト継続時間
  ramp_up_seconds: number;   // 段階的負荷増加時間
  target_rps: number;        // 目標リクエスト/秒
  endpoints: LoadTestEndpoint[];
}

interface LoadTestEndpoint {
  name: string;
  weight: number;            // リクエスト分散重み
  endpoint: string;
  method: string;
  payload?: any;
  expected_response_time: number;
}

interface LoadTestResult {
  config: LoadTestConfig;
  summary: LoadTestSummary;
  endpoint_results: EndpointResult[];
  performance_degradation: PerformanceDegradation;
  errors: ErrorSummary;
}

interface LoadTestSummary {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  average_response_time: number;
  p95_response_time: number;
  p99_response_time: number;
  throughput_rps: number;
  error_rate: number;
}

interface EndpointResult {
  endpoint_name: string;
  request_count: number;
  avg_response_time: number;
  min_response_time: number;
  max_response_time: number;
  nfr_compliance: boolean;
  nfr_target: number;
}

interface PerformanceDegradation {
  baseline_performance: Record<string, number>;
  load_performance: Record<string, number>;
  degradation_percentage: Record<string, number>;
  acceptable_degradation_limit: number; // 20%
}

class LoadTester {
  private config: LoadTestConfig;
  private results: LoadTestResult;

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.results = this.initializeResults();
  }

  async runLoadTest(): Promise<LoadTestResult> {
    console.log(`🚀 負荷テスト開始: ${this.config.concurrency}並行、${this.config.duration_seconds}秒`);

    // ベースライン性能測定
    const baseline = await this.measureBaselinePerformance();

    // 段階的負荷増加
    await this.rampUp();

    // 本格負荷テスト実行
    const loadResults = await this.executeLoadTest();

    // 性能劣化分析
    const degradation = this.analyzePerformanceDegradation(baseline, loadResults);

    // 結果集計
    this.results.performance_degradation = degradation;
    this.results.summary = this.calculateSummary(loadResults);
    this.results.endpoint_results = this.calculateEndpointResults(loadResults);

    return this.results;
  }

  private async measureBaselinePerformance(): Promise<Record<string, number>> {
    console.log("📊 ベースライン性能測定中...");
    const baseline: Record<string, number> = {};

    for (const endpoint of this.config.endpoints) {
      const startTime = Date.now();
      const response = await this.callEndpoint(endpoint);
      const endTime = Date.now();

      baseline[endpoint.name] = endTime - startTime;
      console.log(`  ${endpoint.name}: ${baseline[endpoint.name]}ms`);
    }

    return baseline;
  }

  private async rampUp(): Promise<void> {
    console.log(`📈 段階的負荷増加: ${this.config.ramp_up_seconds}秒で${this.config.concurrency}並行まで`);

    const steps = 5; // 5段階で負荷増加
    const stepDuration = this.config.ramp_up_seconds / steps;
    const stepConcurrency = this.config.concurrency / steps;

    for (let step = 1; step <= steps; step++) {
      const currentConcurrency = Math.floor(stepConcurrency * step);
      console.log(`  Step ${step}: ${currentConcurrency}並行`);

      await this.runConcurrentRequests(currentConcurrency, stepDuration);
      await this.sleep(1000); // 1秒間隔
    }
  }

  private async executeLoadTest(): Promise<RequestResult[]> {
    console.log(`⚡ 本格負荷テスト実行: ${this.config.concurrency}並行、${this.config.duration_seconds}秒`);

    const results: RequestResult[] = [];
    const endTime = Date.now() + (this.config.duration_seconds * 1000);

    const workers: Promise<RequestResult[]>[] = [];

    for (let i = 0; i < this.config.concurrency; i++) {
      workers.push(this.workerLoop(endTime));
    }

    const workerResults = await Promise.all(workers);

    // 全ワーカーの結果を統合
    for (const workerResult of workerResults) {
      results.push(...workerResult);
    }

    return results;
  }

  private async workerLoop(endTime: number): Promise<RequestResult[]> {
    const results: RequestResult[] = [];

    while (Date.now() < endTime) {
      const endpoint = this.selectEndpoint();
      const result = await this.executeRequest(endpoint);
      results.push(result);

      // スループット調整のための適切な待機
      const targetInterval = 1000 / this.config.target_rps * this.config.concurrency;
      await this.sleep(Math.max(0, targetInterval - result.response_time));
    }

    return results;
  }

  private selectEndpoint(): LoadTestEndpoint {
    // 重み付きランダム選択
    const totalWeight = this.config.endpoints.reduce((sum, ep) => sum + ep.weight, 0);
    let random = Math.random() * totalWeight;

    for (const endpoint of this.config.endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }

    return this.config.endpoints[0]; // フォールバック
  }

  private async executeRequest(endpoint: LoadTestEndpoint): Promise<RequestResult> {
    const startTime = Date.now();
    let success = false;
    let errorMessage = '';

    try {
      const response = await this.callEndpoint(endpoint);
      success = response.success;
      if (!success) {
        errorMessage = response.error || 'Unknown API error';
      }
    } catch (error) {
      errorMessage = error.message;
    }

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      endpoint_name: endpoint.name,
      response_time: responseTime,
      success,
      error_message: errorMessage,
      timestamp: startTime,
    };
  }

  private async callEndpoint(endpoint: LoadTestEndpoint): Promise<any> {
    // 実際のAPI呼び出し実装
    // TauriコマンドまたはHTTPリクエスト
    switch (endpoint.name) {
      case 'list_players':
        return window.__TAURI__.invoke('list_players');
      case 'search_players':
        return window.__TAURI__.invoke('search_players', { query: 'テスト' });
      case 'get_player_detail':
        return window.__TAURI__.invoke('get_player_detail', { player_id: 'test_player_001' });
      case 'save_player_note':
        return window.__TAURI__.invoke('save_player_note', {
          player_id: 'test_player_001',
          content: '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"負荷テスト"}]}]}'
        });
      case 'get_player_note':
        return window.__TAURI__.invoke('get_player_note', { player_id: 'test_player_001' });
      default:
        throw new Error(`Unknown endpoint: ${endpoint.name}`);
    }
  }

  private analyzePerformanceDegradation(
    baseline: Record<string, number>,
    loadResults: RequestResult[]
  ): PerformanceDegradation {
    const loadPerformance: Record<string, number> = {};
    const degradationPercentage: Record<string, number> = {};

    // 負荷時の平均レスポンス時間計算
    for (const endpoint of this.config.endpoints) {
      const endpointResults = loadResults.filter(r => r.endpoint_name === endpoint.name && r.success);
      if (endpointResults.length > 0) {
        loadPerformance[endpoint.name] =
          endpointResults.reduce((sum, r) => sum + r.response_time, 0) / endpointResults.length;

        degradationPercentage[endpoint.name] =
          ((loadPerformance[endpoint.name] - baseline[endpoint.name]) / baseline[endpoint.name]) * 100;
      }
    }

    return {
      baseline_performance: baseline,
      load_performance: loadPerformance,
      degradation_percentage: degradationPercentage,
      acceptable_degradation_limit: 20, // 20%許容
    };
  }

  private calculateSummary(results: RequestResult[]): LoadTestSummary {
    const totalRequests = results.length;
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    const responseTimes = results.filter(r => r.success).map(r => r.response_time);
    responseTimes.sort((a, b) => a - b);

    const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    const testDuration = this.config.duration_seconds;
    const throughputRps = totalRequests / testDuration;
    const errorRate = (failedRequests / totalRequests) * 100;

    return {
      total_requests: totalRequests,
      successful_requests: successfulRequests,
      failed_requests: failedRequests,
      average_response_time: avgResponseTime,
      p95_response_time: responseTimes[p95Index] || 0,
      p99_response_time: responseTimes[p99Index] || 0,
      throughput_rps: throughputRps,
      error_rate: errorRate,
    };
  }

  private calculateEndpointResults(results: RequestResult[]): EndpointResult[] {
    return this.config.endpoints.map(endpoint => {
      const endpointResults = results.filter(r => r.endpoint_name === endpoint.name && r.success);

      if (endpointResults.length === 0) {
        return {
          endpoint_name: endpoint.name,
          request_count: 0,
          avg_response_time: 0,
          min_response_time: 0,
          max_response_time: 0,
          nfr_compliance: false,
          nfr_target: endpoint.expected_response_time,
        };
      }

      const responseTimes = endpointResults.map(r => r.response_time);
      const avgResponseTime = responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);
      const nfrCompliance = avgResponseTime <= endpoint.expected_response_time;

      return {
        endpoint_name: endpoint.name,
        request_count: endpointResults.length,
        avg_response_time: avgResponseTime,
        min_response_time: minResponseTime,
        max_response_time: maxResponseTime,
        nfr_compliance: nfrCompliance,
        nfr_target: endpoint.expected_response_time,
      };
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private initializeResults(): LoadTestResult {
    return {
      config: this.config,
      summary: {} as LoadTestSummary,
      endpoint_results: [],
      performance_degradation: {} as PerformanceDegradation,
      errors: { error_types: {}, total_errors: 0 },
    };
  }

  async runConcurrentRequests(concurrency: number, durationSeconds: number): Promise<void> {
    const promises: Promise<void>[] = [];
    const endTime = Date.now() + (durationSeconds * 1000);

    for (let i = 0; i < concurrency; i++) {
      promises.push(this.singleWorker(endTime));
    }

    await Promise.all(promises);
  }

  private async singleWorker(endTime: number): Promise<void> {
    while (Date.now() < endTime) {
      const endpoint = this.selectEndpoint();
      await this.callEndpoint(endpoint);
      await this.sleep(100); // 適度な間隔
    }
  }
}

interface RequestResult {
  endpoint_name: string;
  response_time: number;
  success: boolean;
  error_message: string;
  timestamp: number;
}

interface ErrorSummary {
  error_types: Record<string, number>;
  total_errors: number;
}

// 負荷テスト設定例
const standardLoadTestConfig: LoadTestConfig = {
  concurrency: 10,
  duration_seconds: 60,
  ramp_up_seconds: 20,
  target_rps: 5,
  endpoints: [
    {
      name: 'list_players',
      weight: 3,
      endpoint: 'list_players',
      method: 'POST',
      expected_response_time: 1000, // NFR-101
    },
    {
      name: 'search_players',
      weight: 2,
      endpoint: 'search_players',
      method: 'POST',
      expected_response_time: 500, // NFR-102
    },
    {
      name: 'get_player_detail',
      weight: 2,
      endpoint: 'get_player_detail',
      method: 'POST',
      expected_response_time: 200, // NFR-104
    },
    {
      name: 'save_player_note',
      weight: 1,
      endpoint: 'save_player_note',
      method: 'POST',
      expected_response_time: 300, // TASK-0511
    },
    {
      name: 'get_player_note',
      weight: 1,
      endpoint: 'get_player_note',
      method: 'POST',
      expected_response_time: 300, // TASK-0511
    },
  ],
};
```

## エラーハンドリング統合

### 統一エラーハンドリング

```rust
// src/error_handling/unified_error.rs

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UnifiedApiError {
    pub error_code: String,
    pub message: String,
    pub details: ErrorDetails,
    pub context: ErrorContext,
    pub recovery_suggestions: Vec<String>,
    pub timestamp: String,
    pub trace_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorDetails {
    pub error_type: ErrorType,
    pub severity: ErrorSeverity,
    pub user_impact: UserImpact,
    pub technical_details: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ErrorContext {
    pub api_endpoint: String,
    pub request_id: String,
    pub user_session: Option<String>,
    pub system_state: SystemState,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ErrorType {
    ValidationError,
    DatabaseError,
    NetworkError,
    PermissionError,
    ResourceNotFound,
    SystemError,
    PerformanceError,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum ErrorSeverity {
    Low,      // ユーザー操作継続可能
    Medium,   // 一部機能制限
    High,     // 重要機能停止
    Critical, // システム停止
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum UserImpact {
    None,           // ユーザーに影響なし
    MinorDelay,     // 軽微な遅延
    FeatureUnavailable, // 機能利用不可
    ServiceUnavailable, // サービス利用不可
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemState {
    pub memory_usage_mb: f64,
    pub active_connections: u32,
    pub last_successful_request: Option<String>,
    pub system_health: SystemHealth,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SystemHealth {
    Healthy,
    Degraded,
    Unstable,
    Critical,
}

// エラーコード定義
pub const ERROR_CODES: &[(&str, &str)] = &[
    // データベースエラー
    ("DB_CONNECTION_FAILED", "データベース接続に失敗しました"),
    ("DB_QUERY_TIMEOUT", "データベースクエリがタイムアウトしました"),
    ("DB_CONSTRAINT_VIOLATION", "データベース制約違反です"),
    ("DB_LOCK_TIMEOUT", "データベースロックタイムアウトです"),

    // バリデーションエラー
    ("VALIDATION_REQUIRED_FIELD", "必須フィールドが入力されていません"),
    ("VALIDATION_INVALID_FORMAT", "入力形式が正しくありません"),
    ("VALIDATION_VALUE_TOO_LARGE", "入力値が制限を超えています"),
    ("VALIDATION_PLAYER_NOT_FOUND", "指定されたプレイヤーが見つかりません"),

    // パフォーマンスエラー
    ("PERFORMANCE_NFR_VIOLATION", "パフォーマンス要件を満たしていません"),
    ("PERFORMANCE_MEMORY_LIMIT", "メモリ使用量が制限を超えています"),
    ("PERFORMANCE_TIMEOUT", "処理がタイムアウトしました"),

    // システムエラー
    ("SYSTEM_RESOURCE_EXHAUSTED", "システムリソースが不足しています"),
    ("SYSTEM_INTERNAL_ERROR", "内部システムエラーが発生しました"),
    ("SYSTEM_MAINTENANCE_MODE", "システムメンテナンス中です"),
];

impl UnifiedApiError {
    pub fn new(
        error_code: &str,
        message: &str,
        error_type: ErrorType,
        severity: ErrorSeverity,
        context: ErrorContext,
    ) -> Self {
        let trace_id = generate_trace_id();
        let user_impact = Self::determine_user_impact(&severity);
        let recovery_suggestions = Self::generate_recovery_suggestions(&error_code, &error_type);

        Self {
            error_code: error_code.to_string(),
            message: message.to_string(),
            details: ErrorDetails {
                error_type,
                severity,
                user_impact,
                technical_details: HashMap::new(),
            },
            context,
            recovery_suggestions,
            timestamp: chrono::Utc::now().to_rfc3339(),
            trace_id,
        }
    }

    // よく使用されるエラー生成のヘルパーメソッド
    pub fn database_error(message: &str, context: ErrorContext) -> Self {
        Self::new(
            "DB_CONNECTION_FAILED",
            message,
            ErrorType::DatabaseError,
            ErrorSeverity::High,
            context,
        )
    }

    pub fn validation_error(field: &str, message: &str, context: ErrorContext) -> Self {
        let mut error = Self::new(
            "VALIDATION_REQUIRED_FIELD",
            message,
            ErrorType::ValidationError,
            ErrorSeverity::Medium,
            context,
        );
        error.details.technical_details.insert("field".to_string(), field.to_string());
        error
    }

    pub fn performance_error(api_name: &str, actual_time: u64, limit_time: u64, context: ErrorContext) -> Self {
        let mut error = Self::new(
            "PERFORMANCE_NFR_VIOLATION",
            &format!("{}のレスポンス時間が制限を超過しました", api_name),
            ErrorType::PerformanceError,
            ErrorSeverity::Medium,
            context,
        );
        error.details.technical_details.insert("api_name".to_string(), api_name.to_string());
        error.details.technical_details.insert("actual_time_ms".to_string(), actual_time.to_string());
        error.details.technical_details.insert("limit_time_ms".to_string(), limit_time.to_string());
        error
    }

    fn determine_user_impact(severity: &ErrorSeverity) -> UserImpact {
        match severity {
            ErrorSeverity::Low => UserImpact::None,
            ErrorSeverity::Medium => UserImpact::MinorDelay,
            ErrorSeverity::High => UserImpact::FeatureUnavailable,
            ErrorSeverity::Critical => UserImpact::ServiceUnavailable,
        }
    }

    fn generate_recovery_suggestions(error_code: &str, error_type: &ErrorType) -> Vec<String> {
        match (error_code, error_type) {
            ("DB_CONNECTION_FAILED", _) => vec![
                "データベース接続を再試行してください".to_string(),
                "ネットワーク接続を確認してください".to_string(),
                "システム管理者に連絡してください".to_string(),
            ],
            ("VALIDATION_REQUIRED_FIELD", _) => vec![
                "必須フィールドを入力してください".to_string(),
                "入力内容を確認してください".to_string(),
            ],
            ("PERFORMANCE_NFR_VIOLATION", _) => vec![
                "しばらく待ってから再試行してください".to_string(),
                "ブラウザのキャッシュをクリアしてください".to_string(),
                "システム負荷が高い可能性があります".to_string(),
            ],
            _ => vec![
                "ページを再読み込みしてください".to_string(),
                "問題が継続する場合はサポートに連絡してください".to_string(),
            ],
        }
    }

    pub fn log_error(&self) {
        match self.details.severity {
            ErrorSeverity::Low => log::info!("Error: {} - {}", self.error_code, self.message),
            ErrorSeverity::Medium => log::warn!("Error: {} - {} (Trace: {})", self.error_code, self.message, self.trace_id),
            ErrorSeverity::High => log::error!("Error: {} - {} (Trace: {})", self.error_code, self.message, self.trace_id),
            ErrorSeverity::Critical => {
                log::error!("CRITICAL Error: {} - {} (Trace: {})", self.error_code, self.message, self.trace_id);
                // クリティカルエラーの場合は追加の通知処理
                self.send_critical_alert();
            }
        }
    }

    fn send_critical_alert(&self) {
        // クリティカルエラー時の緊急通知
        // 実装は要件に応じて決定（メール、Slack、ログ監視システム等）
        log::error!("🚨 CRITICAL ALERT: System experiencing critical error - {}", self.trace_id);
    }
}

fn generate_trace_id() -> String {
    use uuid::Uuid;
    Uuid::new_v4().to_string()
}

// エラーリカバリーシステム
pub struct ErrorRecoverySystem {
    retry_config: RetryConfig,
    circuit_breaker: CircuitBreaker,
}

#[derive(Debug, Clone)]
pub struct RetryConfig {
    pub max_retries: u32,
    pub base_delay_ms: u64,
    pub max_delay_ms: u64,
    pub backoff_multiplier: f64,
}

#[derive(Debug)]
pub struct CircuitBreaker {
    failure_threshold: u32,
    recovery_timeout_ms: u64,
    current_failures: u32,
    last_failure_time: Option<std::time::Instant>,
    state: CircuitBreakerState,
}

#[derive(Debug, PartialEq)]
pub enum CircuitBreakerState {
    Closed,    // 正常動作
    Open,      // 障害状態（リクエスト遮断）
    HalfOpen,  // 回復試行中
}

impl ErrorRecoverySystem {
    pub fn new() -> Self {
        Self {
            retry_config: RetryConfig {
                max_retries: 3,
                base_delay_ms: 100,
                max_delay_ms: 5000,
                backoff_multiplier: 2.0,
            },
            circuit_breaker: CircuitBreaker {
                failure_threshold: 5,
                recovery_timeout_ms: 30000, // 30秒
                current_failures: 0,
                last_failure_time: None,
                state: CircuitBreakerState::Closed,
            },
        }
    }

    pub async fn execute_with_recovery<F, T>(&mut self, operation: F) -> Result<T, UnifiedApiError>
    where
        F: Fn() -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<T, UnifiedApiError>> + Send>>,
    {
        // サーキットブレーカーチェック
        if !self.circuit_breaker.can_execute() {
            return Err(self.create_circuit_breaker_error());
        }

        // リトライループ
        let mut last_error = None;
        for attempt in 0..=self.retry_config.max_retries {
            match operation().await {
                Ok(result) => {
                    // 成功時はサーキットブレーカーをリセット
                    self.circuit_breaker.record_success();
                    return Ok(result);
                }
                Err(error) => {
                    last_error = Some(error.clone());

                    // リトライ対象外エラーの場合は即座に失敗
                    if !self.is_retryable_error(&error) {
                        self.circuit_breaker.record_failure();
                        return Err(error);
                    }

                    // 最終試行でない場合は遅延後リトライ
                    if attempt < self.retry_config.max_retries {
                        let delay = self.calculate_retry_delay(attempt);
                        log::warn!("Retrying operation after {}ms (attempt {})", delay, attempt + 1);
                        tokio::time::sleep(std::time::Duration::from_millis(delay)).await;
                    }
                }
            }
        }

        // 全リトライ失敗
        self.circuit_breaker.record_failure();
        Err(last_error.unwrap())
    }

    fn is_retryable_error(&self, error: &UnifiedApiError) -> bool {
        match error.details.error_type {
            ErrorType::NetworkError => true,
            ErrorType::DatabaseError => {
                // データベースタイムアウトや一時的接続エラーはリトライ対象
                error.error_code.contains("TIMEOUT") || error.error_code.contains("CONNECTION")
            }
            ErrorType::SystemError => true,
            ErrorType::ValidationError => false, // バリデーションエラーはリトライ不要
            ErrorType::PermissionError => false,
            ErrorType::ResourceNotFound => false,
            ErrorType::PerformanceError => true, // パフォーマンスエラーはリトライで改善の可能性
        }
    }

    fn calculate_retry_delay(&self, attempt: u32) -> u64 {
        let delay = self.retry_config.base_delay_ms as f64 *
                   self.retry_config.backoff_multiplier.powi(attempt as i32);

        std::cmp::min(delay as u64, self.retry_config.max_delay_ms)
    }

    fn create_circuit_breaker_error(&self) -> UnifiedApiError {
        UnifiedApiError::new(
            "SYSTEM_CIRCUIT_BREAKER_OPEN",
            "システムが一時的に利用できません。しばらく待ってから再試行してください。",
            ErrorType::SystemError,
            ErrorSeverity::High,
            ErrorContext {
                api_endpoint: "circuit_breaker".to_string(),
                request_id: "N/A".to_string(),
                user_session: None,
                system_state: SystemState {
                    memory_usage_mb: 0.0,
                    active_connections: 0,
                    last_successful_request: None,
                    system_health: SystemHealth::Critical,
                },
            },
        )
    }
}

impl CircuitBreaker {
    fn can_execute(&mut self) -> bool {
        match self.state {
            CircuitBreakerState::Closed => true,
            CircuitBreakerState::Open => {
                // 回復タイムアウトチェック
                if let Some(last_failure) = self.last_failure_time {
                    if last_failure.elapsed().as_millis() > self.recovery_timeout_ms as u128 {
                        self.state = CircuitBreakerState::HalfOpen;
                        true
                    } else {
                        false
                    }
                } else {
                    false
                }
            }
            CircuitBreakerState::HalfOpen => true,
        }
    }

    fn record_success(&mut self) {
        self.current_failures = 0;
        self.state = CircuitBreakerState::Closed;
        self.last_failure_time = None;
    }

    fn record_failure(&mut self) {
        self.current_failures += 1;
        self.last_failure_time = Some(std::time::Instant::now());

        if self.current_failures >= self.failure_threshold {
            self.state = CircuitBreakerState::Open;
        }
    }
}
```

## 受け入れ基準

### ✅ 機能的受け入れ基準

1. **AC-01**: 全5つのAPIエンドポイントで統合テストが成功する
2. **AC-02**: E2E統合テストシナリオが全て成功する
3. **AC-03**: 負荷テスト（10並行×60秒）で全APIが安定動作する
4. **AC-04**: パフォーマンスプロファイリングで最適化箇所が特定される
5. **AC-05**: 統一エラーハンドリングが全APIで機能する
6. **AC-06**: データベースクエリ最適化により実行計画が改善される

### ⚡ 非機能的受け入れ基準

1. **AC-NFR-01**: NFR-101（≤1000ms）が負荷時も20%劣化以内で達成される
2. **AC-NFR-02**: NFR-102（≤500ms）が負荷時も20%劣化以内で達成される
3. **AC-NFR-03**: NFR-104（≤200ms）が負荷時も20%劣化以内で達成される
4. **AC-NFR-04**: エラー率が1%以下で維持される
5. **AC-NFR-05**: メモリ使用量が安定し、リークが検出されない
6. **AC-NFR-06**: システムスループットが5req/sec以上を維持する

### 🧪 品質受け入れ基準

1. **AC-QA-01**: 全統合テストが成功する
2. **AC-QA-02**: 全負荷テストが成功する
3. **AC-QA-03**: パフォーマンスレポートが生成される
4. **AC-QA-04**: エラーハンドリングテストが100%成功する
5. **AC-QA-05**: データベース最適化効果が測定される
6. **AC-QA-06**: システム監視・ログ機能が正常動作する

## 実装優先度

### 🚀 Phase 1: 統合テスト基盤（必須）
1. E2E統合テストフレームワーク構築
2. 全API統合テスト実装
3. テストデータ準備・クリーンアップ
4. 自動テスト実行環境

### 🔧 Phase 2: パフォーマンス監視（重要）
1. パフォーマンスプロファイラー実装
2. NFR要件自動検証機能
3. ボトルネック検出・レポート機能
4. メモリ・CPU監視機能

### ⭐ Phase 3: 最適化・品質向上（推奨）
1. データベースクエリ最適化
2. メモリ使用量最適化
3. 負荷テスト実装
4. 統一エラーハンドリング統合

## 品質保証・監視要件

### 🔍 継続的監視

```rust
// 監視システム統合例
pub struct QualityMonitor {
    performance_thresholds: PerformanceThresholds,
    error_rate_monitor: ErrorRateMonitor,
    resource_monitor: ResourceMonitor,
}

pub struct PerformanceThresholds {
    pub nfr_101_limit: u64, // 1000ms
    pub nfr_102_limit: u64, // 500ms
    pub nfr_104_limit: u64, // 200ms
    pub task_0511_limit: u64, // 300ms
}

impl QualityMonitor {
    pub async fn monitor_api_call(&self, api_name: &str, duration: u64) -> QualityReport {
        let threshold = self.get_threshold(api_name);
        let compliance = duration <= threshold;

        QualityReport {
            api_name: api_name.to_string(),
            duration_ms: duration,
            threshold_ms: threshold,
            nfr_compliant: compliance,
            quality_score: self.calculate_quality_score(duration, threshold),
        }
    }
}
```

### 📊 品質メトリクス

1. **パフォーマンス品質**: NFR要件達成率
2. **安定性品質**: エラー率・可用性
3. **効率性品質**: リソース使用効率
4. **保守性品質**: コード品質・テストカバレッジ

## 注意事項・制約

### 🔒 品質制約
- NFR-101/102/104の完全準拠必須
- エラー率1%以下維持必須
- メモリリーク検出・対策必須

### 📊 パフォーマンス制約
- 負荷時20%以内劣化許容
- 並行処理でのデータ整合性保証
- 長時間稼働での安定性確保

### 🔗 統合制約
- 既存API（TASK-0507〜0511）との整合性
- TDD開発プロセス継続
- CI/CD統合対応

### 🧪 テスト制約
- `bun run test`コマンド互換性
- 自動化可能なテストスイート
- 本番相当データでのテスト実行

### 🎯 成果物制約
- 詳細パフォーマンスレポート必須
- 最適化推奨事項文書化必須
- 継続監視システム構築必須

---

**📝 作成者**: Claude Code
**📅 作成日時**: 2025-09-27
**🎯 実装目標**: Phase 1の品質保証・パフォーマンス最適化完了
**⏱️ 推定工数**: 16時間（2日間）