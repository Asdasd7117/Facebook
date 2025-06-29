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
    myPageInfo.innerHTML = "ًں“„ <a href='" + userData.facebookPage + "' target='_blank'>" + userData.facebookPage + "</a> ";
    const delBtn = document.createElement("button");
    delBtn.innerText = "â‌Œ ط­ط°ظپ طµظپط­طھظٹ";
    delBtn.onclick = async () => {
      await updateDoc(userRef, { facebookPage: "" });
      alert("طھظ… ط­ط°ظپ طµظپط­طھظƒ.");
      location.reload();
    };
    myPageInfo.appendChild(delBtn);
    document.getElementById("myPage").appendChild(myPageInfo);
  }

  document.getElementById("savePageBtn").onclick = async () => {
    const pageURL = document.getElementById("pageInput").value;
    if (pageURL.length < 10) return alert("ط§ظ„ط±ط§ط¨ط· ط؛ظٹط± طµط§ظ„ط­");
    await updateDoc(userRef, { facebookPage: pageURL });
    alert("طھظ… ط­ظپط¸ ط§ظ„ط±ط§ط¨ط·.");
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
        ًں‘¤ <strong>${other.email || "ظ…ط³طھط®ط¯ظ…"}</strong><br/>
        <button onclick="openFacebookPage('${other.facebookPage}', '${pageId}')">ط§ظپطھط­ ط§ظ„طµظپط­ط©</button>
        <button id="${pageId}" onclick="confirmFollow('${otherId}')" disabled>ط£ظ†ط§ طھط§ط¨ط¹طھ ط§ظ„طµظپط­ط©</button>
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
  if (!confirm("ظ‡ظ„ ظپط¹ظ„ط§ظ‹ طھط§ط¨ط¹طھ ط§ظ„طµظپط­ط©طں")) return;

  const targetRef = doc(db, "users", targetId);
  const targetSnap = await getDoc(targetRef);
  const targetData = targetSnap.data();

  if ((targetData.points || 0) < 1) {
    alert("طµط§ط­ط¨ ط§ظ„طµظپط­ط© ظ„ط§ ظٹظ…ظ„ظƒ ظ†ظ‚ط§ط·ظ‹ط§ ظƒط§ظپظٹط©.");
    return;
  }

  // طھط­ط¯ظٹط« ط§ظ„ط±طµظٹط¯
  await updateDoc(userRef, {
    points: (userData.points || 0) + 1,
    followers: arrayUnion(targetId)
  });

  await updateDoc(targetRef, {
    points: (targetData.points || 0) - 1
  });

  alert("âœ… طھظ…طھ ط§ظ„ظ…طھط§ط¨ط¹ط©. ط­طµظ„طھ ط¹ظ„ظ‰ ظ†ظ‚ط·ط©.");
  location.reload();
};
