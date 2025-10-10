// プレイヤーCRUDコマンドモジュール

pub mod players;

// プレイヤー種別CRUDコマンドモジュール
pub mod categories;

// タグCRUDコマンドモジュール
pub mod tags;

// プレイヤータグ割り当てコマンドモジュール
pub mod player_tags;

// 簡易メモCRUDコマンドモジュール
pub mod notes;

// プレイヤー総合メモ更新・取得コマンドモジュール
pub mod player_summaries;

// 総合メモテンプレート管理コマンドモジュール
pub mod summary_templates;

// テストモジュール
#[cfg(test)]
mod players_test;

#[cfg(test)]
mod categories_test;

#[cfg(test)]
mod tags_test;

#[cfg(test)]
mod player_tags_test;

#[cfg(test)]
mod notes_test;

#[cfg(test)]
mod player_summaries_test;

#[cfg(test)]
mod summary_templates_test;
