import type React from "react";

/**
 * 【機能概要】: 404エラーページコンポーネント
 * 【実装方針】: テストケースTC-201-E001を通すための最小実装
 * 【テスト対応】: 存在しないパスにアクセスした際のエラー表示
 * 🟢 信頼性レベル: TASK-201要件でエラーハンドリングが明示されている
 */
export const ErrorPage: React.FC<{
  message?: string;
  statusCode?: number;
}> = ({ message = "ページが見つかりませんでした", statusCode = 404 }) => {
  return (
    <div data-testid="error-page" className="error-page">
      <div className="error-content">
        <h1>エラー {statusCode}</h1>
        <p>{message}</p>
        <div className="error-actions">
          <button
            onClick={() => window.history.back()}
            data-testid="go-back-button"
            className="go-back-button"
          >
            戻る
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            data-testid="go-home-button"
            className="go-home-button"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
