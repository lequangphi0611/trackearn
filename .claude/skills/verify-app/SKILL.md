---
name: verify-app
description: Kiểm chứng (verify) một thay đổi của app TrackEarn end-to-end qua harness Playwright trong verify-env, dùng knowledge base bền vững (system-map, step-map, locator-map, ERROR.md) để không phải đọc lại source mỗi lần. Dùng khi user muốn verify / kiểm chứng một flow hoặc thay đổi trên app thật.
---

# verify-app

Wrapper quanh skill `verify` chuẩn, thêm 2 thứ mà `verify` không có:

1. **Knowledge base bền vững** — nhớ luồng màn hình, scenario, locator giữa các
   lần chạy để không grep lại source mỗi lần (giảm token, giảm suy diễn lặp).
2. **ERROR.md** — nhớ các bug lặp đi lặp lại + cách fix để không dẫm lại.

Hạ tầng chạy (session đã login, config, playwright.config desktop+mobile) do
**`verify-env/`** cung cấp — đọc `verify-env/README.md` để biết cách chạy
(`pnpm verify`, thả `*.tmp.spec.ts` vào `verify-env/tests/`).

## Knowledge base — vị trí & vai trò

Tất cả nằm trong `verify-env/knowledge/` (project này có full quyền đọc/ghi):

| File | Vai trò | Là source of truth? |
|---|---|---|
| `system-map.md` | Bản đồ điều hướng: màn hình nào ở route nào, đi tới nhau ra sao. Trả lời "cần vào đâu để test X". | Chỉ mục. Đổi chậm. |
| `step-map.md` | Scenario / user story → **trỏ tới spec file** đã pass trong `tests/`, không mô tả lại từng bước. | Chỉ mục; spec mới là chân lý. |
| `locator-map.md` | Locator đã đọc trước đó, **kèm file source** suy ra từ đó. | Cache. Dễ stale nhất. |
| `ERROR.md` | Bug keyword + nguyên nhân + cách fix đã chứng minh. | Nhật ký. |

**Nguyên tắc vàng — spec file là source of truth cho step + locator.** Một
`*.spec.ts` đã pass là bản lưu step+locator *tự kiểm chứng* (chạy là biết
đúng/sai). `step-map`/`locator-map` chỉ là chỉ mục để tìm nhanh; khi mâu thuẫn,
tin spec, không tin markdown.

## Quy trình mỗi lần verify

1. **Xác định flow cần verify** từ yêu cầu của user (hoặc từ diff vừa đổi).
2. **Đọc knowledge trước, source sau:**
   - Đọc `ERROR.md` — flow này có bug đã biết không? Áp phòng tránh ngay.
   - Tra `system-map` → route/màn hình đích.
   - Tra `step-map` → đã có spec cho scenario này chưa? Nếu có, tái dùng spec đó.
   - Tra `locator-map` → đã có locator cho các element cần chạm chưa?
3. **Áp GIAO THỨC FRESHNESS (bên dưới)** cho mọi entry định tái dùng. Chỉ khi
   entry còn tươi mới được tin. Nếu stale/thiếu → grep source **một lần** để
   suy ra, rồi ghi lại vào map.
4. **Delegate sang skill `verify`** để chạy thực tế: dựng/chỉnh `*.tmp.spec.ts`
   trong `verify-env/tests/`, chạy `pnpm verify` (hoặc `:desktop`/`:mobile`),
   quan sát hành vi thật.
5. **Sau khi chạy xong, cập nhật knowledge** (bên dưới).

## GIAO THỨC FRESHNESS (bắt buộc — chống cache stale)

Đây là phần quan trọng nhất. Cache locator/step stale = fail giả hoặc pass giả.

Mỗi entry trong `system-map`/`step-map`/`locator-map` **phải ghi kèm**:
- `src:` — (các) file source nó suy ra từ đó (đường dẫn tương đối repo).
- `verified:` — commit hash ngắn (hoặc ngày) lần cuối entry này được chứng minh đúng.

Trước khi TIN một entry để bỏ qua việc đọc source, kiểm tra rẻ tiền:

```bash
# entry còn tươi nếu các file src của nó KHÔNG đổi kể từ lần verified
git diff --name-only <verified_hash>..HEAD -- <src paths>
```

- Không có dòng nào in ra → **tươi**, tin entry, KHÔNG đọc source.
- Có file in ra (hoặc file đang dirty trong working tree) → **stale**, phải
  grep/đọc lại source đó, cập nhật entry + `verified:` mới.
- Không có `src`/`verified` (entry cũ, format thiếu) → coi như stale.

Nếu không ở trong git repo hoặc không lấy được hash, fallback: so sánh mtime file
source với thời điểm ghi entry; nghi ngờ thì đọc lại.

## Cập nhật knowledge sau mỗi lần chạy

- **Spec pass lần đầu cho một scenario** → thêm dòng vào `step-map` trỏ tới file
  spec (đổi tên `*.tmp.spec.ts` thành spec giữ lại nếu muốn tái dùng lâu dài),
  kèm `src` + `verified`.
- **Đọc locator mới từ source** → ghi vào `locator-map` kèm `src` + `verified`.
- **Phát hiện màn hình / route chưa có trong `system-map`** → bổ sung.
- **Sửa được một lỗi** (đặc biệt lỗi ở phía spec/harness, không phải bug app):
  ghi vào `ERROR.md` theo format của file đó. Chỉ ghi khi đã **chứng minh fix
  làm test pass** — không ghi phỏng đoán.

## Ranh giới

- Chạy trên **DB dev thật (port 5433)** — ưu tiên flow read-only; thao tác ghi để
  lại dữ liệu bẩn (xem README verify-env).
- Skill này *khuyến nghị* hành vi, không ép cứng. Kỷ luật nằm ở giao thức
  freshness: **thà đọc lại source còn hơn tin một cache có thể đã cũ.**
- Bug thật của app (verify tìm ra) KHÔNG ghi vào `ERROR.md` — báo cho user. Chỉ
  ghi những lỗi về cách viết spec / locator / môi trường mà ta tự dẫm lại.
