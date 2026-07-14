# MC Portfolio — Website tĩnh + Firebase

Website portfolio 1 trang (landing page) cho MC / Hướng dẫn viên, deploy miễn phí trên **GitHub Pages**, dữ liệu quản lý qua **Firebase** (Authentication + Firestore). Ảnh/video dùng link ngoài (Cloudinary/YouTube) để không cần nâng cấp gói trả phí. Không cần server riêng, không cần framework — thuần HTML/CSS/JS.

## 1. Cấu trúc thư mục

```
mc-portfolio/
├── index.html          # Trang chủ (public)
├── admin.html           # Trang quản trị (chỉ 1 email được vào)
├── css/
│   ├── style.css        # Style trang chủ
│   └── admin.css        # Style trang admin
├── js/
│   ├── firebase-config.js  # ⚠️ Bạn phải điền config thật vào đây
│   ├── main.js              # Logic trang chủ (đọc dữ liệu)
│   ├── admin-auth.js         # Kiểm tra đăng nhập admin
│   └── admin.js               # Logic CRUD trang admin
└── README.md
```

---

## 2. Tạo project Firebase từ đầu (miễn phí)

### Bước 1 — Tạo project
1. Vào https://console.firebase.google.com → **Add project** (Thêm dự án).
2. Đặt tên project (VD: `mc-portfolio`) → tắt Google Analytics nếu không cần → **Create project**.

### Bước 2 — Tạo Web App để lấy config
1. Trong project, bấm biểu tượng **`</>`** (Web) ở màn hình tổng quan.
2. Đặt tên app (VD: `mc-portfolio-web`) → **KHÔNG** cần tick Firebase Hosting (vì ta dùng GitHub Pages).
3. Sau khi tạo, Firebase hiển thị đoạn `firebaseConfig` — copy toàn bộ.
4. Mở file `js/firebase-config.js`, dán đè vào biến `firebaseConfig`:

```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "mc-portfolio-xxxx.firebaseapp.com",
  projectId: "mc-portfolio-xxxx",
  storageBucket: "mc-portfolio-xxxx.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
```

5. Đổi `ADMIN_EMAIL` trong cùng file thành email bạn sẽ dùng để đăng nhập quản trị, VD:
```js
const ADMIN_EMAIL = "nhky3141999@gmail.com";
```

### Bước 3 — Bật Authentication
1. Menu trái → **Build → Authentication → Get started**.
2. Tab **Sign-in method** → bật **Email/Password** → Save.
3. Tab **Users** → **Add user** → nhập đúng email đã đặt ở `ADMIN_EMAIL` và một mật khẩu → Add user.
   - Đây là tài khoản Admin **duy nhất** được phép đăng nhập vào `admin.html`.

### Bước 4 — Bật Firestore Database
1. Menu trái → **Build → Firestore Database → Create database**.
2. Chọn **Start in production mode** → chọn location gần (VD: `asia-southeast1`) → Enable.
3. Vào tab **Rules**, thay toàn bộ nội dung bằng:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAdmin() {
      return request.auth != null
        && request.auth.token.email == "ADMIN_EMAIL_CUA_BAN";
    }

    // Các mục nội dung công khai: ai cũng đọc được, chỉ admin ghi được
    match /config/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /stats/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /styleCards/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /strengths/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /gallery/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /videos/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /services/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /guideCards/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /partners/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /testimonials/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // Khách được TẠO tin nhắn liên hệ, nhưng không được đọc/sửa/xóa
    // (chỉ admin mới đọc/xóa được trong trang quản trị)
    match /contactMessages/{docId} {
      allow create: if true;
      allow read, update, delete: if isAdmin();
    }
  }
}
```

⚠️ Thay `"ADMIN_EMAIL_CUA_BAN"` bằng đúng email bạn đã đặt ở Bước 3 (và trong `ADMIN_EMAIL` của `firebase-config.js`). Bấm **Publish**.

### Bước 5 — Ảnh và video: dùng link ngoài (không cần Storage / không cần thẻ ngân hàng)

Dự án này **không dùng Firebase Storage** — vì Storage bắt buộc phải nâng cấp gói **Blaze** (có thể phát sinh phí nếu vượt hạn mức). Thay vào đó, mọi ảnh/logo/video trong trang Admin đều là **dán link URL** từ một dịch vụ lưu trữ ảnh miễn phí. Cách này giữ Firestore ở gói **Spark hoàn toàn miễn phí**, không cần gắn thẻ.

**Để lấy link ảnh**, chọn 1 trong các dịch vụ sau:

- **[Cloudinary](https://cloudinary.com)** *(khuyên dùng)* — miễn phí 25GB lưu trữ + 25GB băng thông/tháng, hỗ trợ cả ảnh và video, không cần thẻ. Đăng ký tài khoản → Media Library → Upload → click vào file vừa upload → copy "Secure URL" (dạng `https://res.cloudinary.com/...`).
- **[ImgBB](https://imgbb.com)** — chỉ dùng cho ảnh, không cần đăng ký, upload xong copy "Direct link" ngay.

**Để thêm video**: đăng video lên YouTube ở chế độ **"Không công khai" (Unlisted)** (video vẫn xem được qua link nhưng không hiện trong tìm kiếm/kênh công khai), rồi dán link vào ô "Link YouTube" trong Admin — không cần Cloudinary cho video trừ khi bạn muốn tự host.

Sau khi có link, vào trang Admin, dán trực tiếp vào các ô "Link ảnh...", "Link logo...", "Link video..." tương ứng ở từng mục.

### Bước 6 — Thêm domain GitHub Pages vào danh sách được phép (Authorized domains)
1. **Authentication → Settings → Authorized domains → Add domain**.
2. Thêm domain GitHub Pages của bạn, ví dụ: `tenban.github.io`.

---

## 3. Chạy thử ở máy tính (trước khi deploy)

Vì trình duyệt chặn `fetch module` khi mở file trực tiếp bằng `file://`, hãy chạy qua local server:

- **IntelliJ**: click phải `index.html` → *Open in Browser* (IntelliJ tự chạy qua built-in server), hoặc dùng plugin/Live Server tương đương.
- Hoặc dùng Python có sẵn:
  ```bash
  cd mc-portfolio
  python3 -m http.server 5500
  ```
  rồi mở `http://localhost:5500`.

Đăng nhập thử tại `admin.html` bằng email/mật khẩu đã tạo ở Bước 3, nhập dữ liệu từng mục — trang chủ sẽ tự hiển thị.

---

## 4. Deploy miễn phí lên GitHub Pages

1. Tạo repo mới trên GitHub (VD: `mc-portfolio`), push toàn bộ thư mục `mc-portfolio/` lên nhánh `main`.
2. Vào repo → **Settings → Pages**.
3. Ở mục **Build and deployment → Source**, chọn **Deploy from a branch**.
4. Chọn branch `main`, thư mục `/ (root)` → **Save**.
5. Sau ~1 phút, GitHub cấp link dạng: `https://tenban.github.io/mc-portfolio/`.
6. Quay lại Firebase → Authentication → Authorized domains → xác nhận domain này đã được thêm (Bước 2.6).

Từ giờ, mỗi lần bạn `git push` cập nhật code, GitHub Pages sẽ tự deploy lại.

---

## 5. Cấu trúc dữ liệu Firestore (tham khảo)

| Collection / Document        | Vai trò                                              |
|---|---|
| `config/site`                | Banner: tên, vai trò, tagline, mô tả, avatar, ảnh/video nền |
| `config/about`                | Giới thiệu: họ tên, tiêu đề, ảnh, bio, kinh nghiệm, phong cách, điểm mạnh, ngôn ngữ |
| `config/contact`              | Liên hệ: điện thoại, email, địa chỉ, link Google Maps, mạng xã hội |
| `stats`                        | Số liệu đếm (label, target)                         |
| `styleCards`                   | Thẻ phong cách (title, desc)                        |
| `strengths`                    | Thẻ điểm mạnh (title, desc)                         |
| `services`                     | Dịch vụ (title, desc)                               |
| `gallery`                      | Ảnh (url, category, description)                    |
| `videos`                       | Video (title, desc, thumbnailUrl, youtubeUrl/videoUrl) |
| `guideCards`                   | Thẻ hướng dẫn viên — **2 thẻ**: trong nước & quốc tế (label, photoUrl, name, code, issueDate, issuer) |
| `partners`                     | Đối tác (name, logoUrl)                             |
| `testimonials`                 | Đánh giá (name, avatarUrl, content, rating)          |
| `contactMessages`              | Tin nhắn khách gửi từ form Liên hệ (chỉ admin đọc/xóa) |

Toàn bộ các collection này được tạo **tự động** ngay khi bạn thêm mục đầu tiên qua trang Admin — không cần tạo tay trong Firebase Console.

---

## 6. Nhập nhanh dữ liệu mẫu (Hải Kỳ)

Trong trang Admin → **Dashboard**, có nút **"Nhập dữ liệu mẫu"**. Nút này chỉ điền vào những phần **đang trống** (Giới thiệu, Banner, Phong cách, Điểm mạnh, Dịch vụ, Số liệu, Liên hệ, 2 Thẻ hướng dẫn viên trong nước/quốc tế) dựa trên thông tin bạn đã cung cấp — **không ghi đè** lên nội dung bạn đã tự nhập trước đó. Riêng mã số, ngày cấp và đơn vị cấp của thẻ HDV được để trống — bạn cần vào mục **Thẻ hướng dẫn** để bổ sung đúng thông tin thật trên thẻ.

## 7. Lưu ý bảo mật quan trọng

- Chỉ **một** tài khoản (khớp `ADMIN_EMAIL` trong `firebase-config.js` **và** Firestore Rules) được phép ghi dữ liệu — kiểm tra kỹ 2 nơi này phải trùng khớp tuyệt đối từng ký tự.
- File `js/firebase-config.js` chứa `apiKey` công khai — đây **không phải bí mật** (Firebase apiKey chỉ định danh project, không cấp quyền truy cập), quyền truy cập thật sự nằm ở Security Rules bên trên.
- Không commit mật khẩu Admin vào code — mật khẩu chỉ tồn tại trong Firebase Authentication.
