# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-09

### Added
- 初期リリース

## [1.1.0] - 2026-01-12

### Added

- セッションライブ記録機能
  - ハンドカウンターに最終記録時間・ポジションの保存機能を追加

### Changed

- セッションライブ記録機能
  - グラフ・セッションサマリの表示を改善
  - タイムラインの表示・編集を改善
  - 同卓者の永続化の利便性向上
  - 同卓者に対するタグ割り当ての利便性向上
  - その他軽微なアイコン・カラーリングの改善
- セッション記録機能
  - セッション詳細画面のレイアウト・カラーリング改善

### Fixed

- アップデートが通知されない問題の解消
- セッションライブ記録機能
  - 非永続化プレイヤーの名前変更が反映されない問題の解消
  - 同一名称のユーザーが複数作成できる問題の解消
  - 卓リセット時に無数の通知が来る問題の解消
- その他開発上の不具合の解消
