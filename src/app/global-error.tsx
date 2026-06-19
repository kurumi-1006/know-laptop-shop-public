"use client";

export default function GlobalRootError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body>
        <main
          style={{
            alignItems: "center",
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 420, textAlign: "center" }}>
            <h1>Know tạm thời không khả dụng</h1>
            <p>Vui lòng tải lại trang.</p>
            <button onClick={reset} type="button">
              Thử lại
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
