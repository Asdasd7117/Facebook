import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc, updateDoc, getDocs, doc, collection, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

let currentUser = null;
let userRef = null;
let userData = null;

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "index.html";
  currentUser = user;
  document.getElementById("userEmail").innerText = user.email;

  userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  userData = userSnap.data();
  document.getElementById("points").innerText = userData.points || 0;

  if (userData.facebookPage) {
    const myPageInfo = document.createElement("p");
    myPageInfo.innerHTML = "📄 <a href='" + userData.facebookPage + "' target='_blank'>" + userData.facebookPage + "</a> ";
    const delBtn = document.createElement("button");
    delBtn.innerText = "❌ حذف صفحتي";
    delBtn.onclick = async () => {
      await updateDoc(userRef, { facebookPage: "" });
      alert("تم حذف صفحتك.");
      location.reload();
    };
    myPageInfo.appendChild(delBtn);
    document.getElementById("myPage").appendChild(myPageInfo);
  }

  document.getElementById("savePageBtn").onclick = async () => {
    const pageURL = document.getElementById("pageInput").value;
    if (pageURL.length < 10) return alert("الرابط غير صالح");
    await updateDoc(userRef, { facebookPage: pageURL });
    alert("تم حفظ الرابط.");
    location.reload();
  };

  loadOtherPages();
});

async function loadOtherPages() {
  const pagesList = document.getElementById("pagesList");
  pagesList.innerHTML = "";

  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.forEach(docSnap => {
    const other = docSnap.data();
    const otherId = docSnap.id;

    const alreadyFollowed = (userData.followers || []).includes(otherId);
    const canShow = (
      otherId !== currentUser.uid &&
      other.facebookPage &&
      !alreadyFollowed &&
      (other.points || 0) > 0
    );

    if (canShow) {
      const li = document.createElement("li");
      const pageId = `btn_${otherId}`;
      li.innerHTML = `
        👤 <strong>${other.email || "مستخدم"}</strong><br/>
        <button onclick="openFacebookPage('${other.facebookPage}', '${pageId}')">افتح الصفحة</button>
        <button id="${pageId}" onclick="confirmFollow('${otherId}')" disabled>أنا تابعت الصفحة</button>
      `;
      pagesList.appendChild(li);
    }
  });
}

window.openFacebookPage = (url, buttonId) => {
  window.open(url, '_blank');
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.disabled = false;
    btn.style.backgroundColor = "#4CAF50";
  }
};

window.confirmFollow = async (targetId) => {
  if (!confirm("هل فعلاً تابعت الصفحة؟")) return;

  const targetRef = doc(db, "users", targetId);
  const targetSnap = await getDoc(targetRef);
  const targetData = targetSnap.data();

  if ((targetData.points || 0) < 1) {
    alert("صاحب الصفحة لا يملك نقاطًا كافية.");
    return;
  }

  // تحديث الرصيد
  await updateDoc(userRef, {
    points: (userData.points || 0) + 1,
    followers: arrayUnion(targetId)
  });

  await updateDoc(targetRef, {
    points: (targetData.points || 0) - 1
  });

  alert("✅ تمت المتابعة. حصلت على نقطة.");
  location.reload();
};
