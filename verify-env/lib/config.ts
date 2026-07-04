import fs from "node:fs";
import path from "node:path";

// Project là CommonJS (package.json không có "type":"module"), nên dùng
// __dirname có sẵn trong file đã transpile — KHÔNG dùng import.meta.url.
const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "verify.config.json");

// Anchor tuyệt đối theo __dirname → độc lập với cwd. Cả playwright.config.ts
// (use.storageState) lẫn auth.setup.ts (request.storageState) tham chiếu chung
// hằng số này để tránh ghi/đọc lệch chỗ.
export const STORAGE_STATE = path.join(ROOT, ".auth", "storageState.json");

export type VerifyConfig = {
  baseURL: string;
  email: string;
  password: string;
};

/**
 * Nạp credentials cho môi trường verify.
 * Ưu tiên biến môi trường (để CI / lần chạy tạm override không cần sửa file),
 * fallback về verify.config.json (gitignored). Báo lỗi rõ ràng nếu thiếu.
 */
export function loadConfig(): VerifyConfig {
  let json: Partial<VerifyConfig> = {};
  if (fs.existsSync(CONFIG_PATH)) {
    json = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8")) as Partial<VerifyConfig>;
  }

  const baseURL = process.env.VERIFY_BASE_URL ?? json.baseURL ?? "http://localhost:3000";
  const email = process.env.VERIFY_EMAIL ?? json.email;
  const password = process.env.VERIFY_PASSWORD ?? json.password;

  if (!email || !password) {
    throw new Error(
      "verify-env: thiếu credentials. Hãy copy verify-env/verify.config.example.json " +
        "→ verify-env/verify.config.json rồi điền email/password của một tài khoản " +
        "đã tồn tại trong DB dev (Postgres port 5433). " +
        "Hoặc set VERIFY_EMAIL / VERIFY_PASSWORD trong môi trường.",
    );
  }

  return { baseURL, email, password };
}
