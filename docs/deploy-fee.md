Dựa vào stack hiện tại (Vercel + Railway + Supabase + OpenAI + Azure Speech + PayOS):

---

## Chi phí ước tính theo giai đoạn

_Tỷ giá tham khảo: 1 USD ≈ 26,000 VND_

---

### MVP 1 — Soft launch (<100 users, chủ yếu test)

| Dịch vụ                        | Gói                                                 | Chi phí/tháng      |
| ------------------------------ | --------------------------------------------------- | ------------------ |
| capyvo.com                     | $11/năm                                             | ~$0.92             |
| Vercel (FE)                    | Hobby — Free                                        | $0                 |
| Railway (BE)                   | Hobby $5/tháng, nhưng usage nhỏ nằm trong $5 credit | ~$0–2              |
| Supabase (DB + Auth + Storage) | Free tier (500MB DB, 1GB storage, 50k MAU)          | $0                 |
| OpenAI (Whisper + GPT)         | ~100 users × 3 sessions × 3 min audio + analysis    | ~$3–8              |
| Azure Speech (TTS câu hỏi)     | Free 5h/tháng                                       | $0                 |
| PayOS                          | Free setup, ~1.5% per transaction                   | ~0 (tùy doanh thu) |

**Tổng: ~$4–11/tháng (~100k–280k VND)**

---

### MVP 2 — Early traction (100–500 users)

| Dịch vụ      | Gói                                 | Chi phí/tháng |
| ------------ | ----------------------------------- | ------------- |
| Domain       |                                     | ~$0.92        |
| Vercel       | Hobby vẫn OK                        | $0            |
| Railway      | Usage tăng, vượt credit             | ~$8–15        |
| Supabase     | Free tier vẫn chịu được             | $0            |
| OpenAI       | ~500 users × 5 sessions × 3 min     | ~$20–40       |
| Azure Speech | Vượt free 5h → Standard $4/1M chars | ~$3–8         |

**Tổng: ~$32–64/tháng (~830k–1.7M VND)**

> ⚠️ OpenAI là khoản biến động lớn nhất — phụ thuộc tần suất dùng Whisper và GPT analysis.

---

### MVP 3 — Growing (500–2000 users)

| Dịch vụ      | Gói                                             | Chi phí/tháng |
| ------------ | ----------------------------------------------- | ------------- |
| Domain       |                                                 | ~$0.92        |
| Vercel       | Nên lên Pro nếu commercial                      | $20           |
| Railway      | Pro hoặc scale thêm service                     | ~$20–40       |
| Supabase     | **Pro $25** (vượt free: DB, storage, bandwidth) | $25           |
| OpenAI       | ~2000 users active                              | ~$80–180      |
| Azure Speech | ~$15–30                                         |

**Tổng: ~$161–296/tháng (~4.2M–7.7M VND)**

---

## Điểm cần chú ý

**OpenAI là rủi ro lớn nhất** — nên implement:

- Rate limit per user (đã có `transcriptionCredits`)
- Cache kết quả analysis nếu cùng câu hỏi
- Dùng **GPT-4o mini** thay GPT-4o cho analysis thông thường (rẻ hơn ~15 lần)

**Supabase free → Pro** xảy ra khi vượt một trong:

- 500MB database
- 1GB file storage
- 5GB bandwidth/tháng
- 50,000 MAU

**Railway** có thể tối ưu bằng cách set **sleep on idle** cho dev environment, chỉ để production luôn chạy.
