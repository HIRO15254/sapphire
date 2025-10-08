// プレイヤーCRUDコマンドモジュール

pub mod players;

// プレイヤー種別CRUDコマンドモジュール
pub mod categories;

// タグCRUDコマンドモジュール
pub mod tags;

// プレイヤータグ割り当てコマンドモジュール
pub mod player_tags;

// テストモジュール
#[cfg(test)]
mod players_test;

#[cfg(test)]
mod categories_test;

#[cfg(test)]
mod tags_test;

#[cfg(test)]
mod player_tags_test;
