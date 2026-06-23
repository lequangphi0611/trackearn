# Commit Convention

## Format

```
<type>: <mô tả ngắn gọn>
```

- Dùng **tiếng Việt** cho description — nhất quán toàn project
- Mô tả ở imperative ("thêm", "sửa") không phải past tense ("đã thêm")
- Không viết hoa chữ đầu sau dấu `:`
- Không dấu chấm cuối dòng

## Types

| Type | Dùng khi |
|------|---------|
| `feat:` | Thêm tính năng mới |
| `fix:` | Sửa bug |
| `chore:` | Thay đổi không ảnh hưởng logic (config, deps, rename file) |
| `style:` | Thay đổi UI/CSS thuần, không đổi logic |
| `refactor:` | Cải thiện code mà không thêm tính năng hay sửa bug |
| `db:` | Thêm/sửa Drizzle schema hoặc migration |
| `docs:` | Cập nhật tài liệu |

## Ví dụ

```
feat: thêm form nhập giao dịch mảng xe múc
fix: sửa tính sai tổng công nợ khi partial payment
chore: cập nhật dependencies tháng 6
db: thêm bảng repair_job_parts và relation
style: điều chỉnh spacing card thiết bị trên mobile
refactor: tách query getTransactions ra src/queries
docs: cập nhật architecture sau khi thêm spare parts
```
