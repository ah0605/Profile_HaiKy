/* ============================================================
   FIREBASE CONFIG
   Thay các giá trị bên dưới bằng thông tin project Firebase
   thật của bạn (Project Settings > General > Your apps > SDK
   setup and configuration). Xem hướng dẫn chi tiết trong README.md

   Lưu ý: dự án này KHÔNG dùng Firebase Storage (để tránh phải
   nâng cấp gói Blaze). Ảnh/video được dán bằng link URL từ
   Cloudinary/ImgBB (ảnh) hoặc YouTube (video) — xem README mục 5.
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyCU6MqZwZ7KvBOQfo-brj0pJ702NZBr1X4",
  authDomain: "profilehaiky.firebaseapp.com",
  projectId: "profilehaiky",
  storageBucket: "profilehaiky.firebasestorage.app",
  messagingSenderId: "764975432475",
  appId: "1:764975432475:web:a6dcb917dd9fe7890489be",
  measurementId: "G-VKERVPNL3L"
};

/* Email duy nhất được phép đăng nhập & chỉnh sửa dữ liệu.
   Phải khớp với email bạn tạo trong Firebase Authentication
   và với luật bảo mật (security rules) trong README.md */
const ADMIN_EMAIL = "anhhau0526@gmail.com";

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

/* ============================================================
   WEB3FORMS CONFIG — gửi email thật tới hộp thư khi khách điền
   form Liên hệ (không phụ thuộc máy khách có cài app Email hay
   không, khác với mailto:). Lấy Access Key miễn phí tại
   https://web3forms.com — xem hướng dẫn trong README.md
   ============================================================ */
const WEB3FORMS_ACCESS_KEY = "YOUR_WEB3FORMS_ACCESS_KEY";
