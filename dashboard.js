import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc,
  doc,
  updateDoc,
  collection,
  onSnapshot,
  increment,
  arrayUnion
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "index.html";

  const uid = user.uid;
  document.getElementById("userEmail").textContent = user.email;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  document.getElementById("userPoints").textContent = userSnap.data().points;

  const list = document.getElementById("pagesList");

  // عرض الصفحات
  onSnapshot(collection(db, "users"), snapshot => {
    list.innerHTML = "";
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (docSnap.id !== uid && data.facebookPage) {
        const li = document.createElement("li");
        li.innerHTML = `
          <a href="${data.facebookPage}" target="_blank">${data.facebookPage}</a>
          <button onclick="startFollow('${docSnap.id}', this)">متابعة</button>
        `;
        list.appendChild(li);
      }
    });
  });

  // حفظ رابط الصفحة
  window.saveFacebookPage = async () => {
    const link = document.getElementById("fbLink").value;
    await updateDoc(doc(db, "users", uid), { facebookPage: link });
    alert("تم حفظ الرابط.");
  };

  // متابعة شخص يدويًا
  window.startFollow = async (targetId, btn) => {
    btn.disabled = true;
    btn.textContent = "يرجى متابعة الصفحة ثم اضغط هنا";

    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "تمت المتابعة";
    confirmBtn.onclick = async () => {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const targetRef = doc(db, "users", targetId);

      const userSnap = await getDoc(userRef);
      if (userSnap.data().points <= 0) {
        alert("ليس لديك نقاط!");
        return;
      }

      await updateDoc(userRef, {
        points: increment(-1)
      });

      await updateDoc(targetRef, {
        points: increment(1),
        followers: arrayUnion(auth.currentUser.uid)
      });

      alert("تمت المتابعة +1 نقطة!");
      confirmBtn.disabled = true;
    };

    btn.after(confirmBtn);
  };

  // تحقق من من تابع صفحتك وأضف له نقطة
  onSnapshot(doc(db, "users", uid), async docSnap => {
    const data = docSnap.data();
    const currentFollowers = data.followers || [];

    for (const followerId of currentFollowers) {
      const followerRef = doc(db, "users", followerId);
      const followerSnap = await getDoc(followerRef);
      if (!followerSnap.exists()) continue;

      const followerData = followerSnap.data();
      if (!(followerData.followers || []).includes(uid)) {
        await updateDoc(followerRef, {
          followers: arrayUnion(uid),
          points: increment(-1)
        });

        await updateDoc(doc(db, "users", uid), {
          points: increment(1)
        });
      }
    }
  });
});
