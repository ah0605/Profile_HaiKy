/* ============================================================
   ADMIN-AUTH.JS
   Chỉ duy nhất tài khoản có email === ADMIN_EMAIL (khai báo
   trong firebase-config.js) mới được vào Dashboard. Mọi email
   khác đăng nhập thành công vẫn sẽ bị đăng xuất và từ chối.
   ============================================================ */

const loginScreen = document.getElementById('login-screen');
const dashboard = document.getElementById('dashboard');
const loginForm = document.getElementById('login-form');
const loginMsg = document.getElementById('login-msg');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  loginMsg.textContent = '';
  loginMsg.className = 'form-msg';

  if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    loginMsg.textContent = 'Email này không có quyền truy cập trang quản trị.';
    loginMsg.classList.add('error');
    return;
  }

  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Đang đăng nhập…';

  try {
    await auth.signInWithEmailAndPassword(email, password);
    // onAuthStateChanged below will handle showing the dashboard
  } catch (err) {
    console.error(err);
    loginMsg.textContent = mapAuthError(err.code);
    loginMsg.classList.add('error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Đăng nhập';
  }
});

function mapAuthError(code) {
  const map = {
    'auth/invalid-email': 'Email không hợp lệ.',
    'auth/user-not-found': 'Tài khoản không tồn tại. Xem README.md để tạo tài khoản Admin trong Firebase.',
    'auth/wrong-password': 'Sai mật khẩu.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/too-many-requests': 'Bạn đã thử sai quá nhiều lần, vui lòng thử lại sau.'
  };
  return map[code] || 'Đăng nhập thất bại, vui lòng thử lại.';
}

auth.onAuthStateChanged((user) => {
  if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
    loginScreen.style.display = 'none';
    dashboard.style.display = 'grid';
    document.getElementById('current-user-email').textContent = user.email;
    if (window.onAdminReady) window.onAdminReady();
  } else {
    if (user) {
      // logged in but wrong email -> kick out immediately
      auth.signOut();
    }
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
  }
});

document.getElementById('logout-btn').addEventListener('click', () => auth.signOut());
