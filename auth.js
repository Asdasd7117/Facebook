import { auth } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";

// تأكد من الزر
document.getElementById("googleBtn").addEventListener("click", async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    document.getElementById("userInfo").innerText = `تم تسجيل الدخول: ${user.email}`;
  } catch (error) {
    alert("حدث خطأ: " + error.message);
    console.error(error);
  }
});

// مراقبة الحالة
onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById("userInfo").innerText = `مرحباً: ${user.email}`;
  }
});
