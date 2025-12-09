/**
 * ゲーム表示用フォーマットヘルパー
 *
 * ポーカーゲームの情報を人間が読みやすい形式に変換するユーティリティ関数
 */

/**
 * ブラインド構造を表示用文字列に変換
 * @example formatBlinds(1, 2) => "1/2"
 * @example formatBlinds(1, 2, 1) => "1/2 (Ante 1)"
 */
export function formatBlinds(smallBlind: number, bigBlind: number, ante?: number | null): string {
  const base = `${smallBlind}/${bigBlind}`;
  if (ante && ante > 0) {
    return `${base} (Ante ${ante})`;
  }
  return base;
}

/**
 * バイイン範囲を表示用文字列に変換
 * @example formatBuyInRange(40, 200) => "40BB - 200BB"
 */
export function formatBuyInRange(minBuyIn: number, maxBuyIn: number): string {
  return `${minBuyIn}BB - ${maxBuyIn}BB`;
}

/**
 * ゲームサマリを表示用文字列に変換
 * @example formatGameSummary({ name: "1/2 NL", smallBlind: 1, bigBlind: 2, ante: 0, currency: { name: "GGポイント" } })
 *          => "1/2 NL (1/2) - GGポイント"
 */
export function formatGameSummary(game: {
  name: string;
  smallBlind: number;
  bigBlind: number;
  ante: number | null;
  currency: { name: string };
}): string {
  const blinds = formatBlinds(game.smallBlind, game.bigBlind, game.ante);
  return `${game.name} (${blinds}) - ${game.currency.name}`;
}

/**
 * ゲームの短い表示用文字列を生成
 * @example formatGameShort({ name: "1/2 NL", smallBlind: 1, bigBlind: 2 }) => "1/2 NL (1/2)"
 */
export function formatGameShort(game: {
  name: string;
  smallBlind: number;
  bigBlind: number;
}): string {
  return `${game.name} (${game.smallBlind}/${game.bigBlind})`;
}
