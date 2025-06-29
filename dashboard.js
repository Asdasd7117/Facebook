import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.4.0/firebase-auth.js";
import {
  getDoc, setDoc, getDocs, updateDoc, doc, collection, arrayUnion
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
  document.getElementById("points").innerText = userData.points;

  if (userData.facebookPage) {
    const myPageInfo = document.createElement("p");
    myPageInfo.innerText = "ط±ط§ط¨ط· طµظپط­طھظƒ ط§ظ„ط­ط§ظ„ظٹ: " + userData.facebookPage;
    document.getElementById("myPage").appendChild(myPageInfo);
  }

  // ط­ظپط¸ ط±ط§ط¨ط· ط§ظ„طµظپط­ط©
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
    if (
      otherId !== currentUser.uid &&
      other.facebookPage &&
      (!userData.followers || !userData.followers.includes(otherId))
    ) {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${other.facebookPage}" target="_blank">${other.email}</a>
        <button onclick="confirmFollow('${otherId}')">طھظ…طھ ط§ظ„ظ…طھط§ط¨ط¹ط©</button>
      `;
      pagesList.appendChild(li);
    }
  });
}

window.confirmFollow = async (targetId) => {
  if (!confirm("ظ‡ظ„ طھط£ظƒط¯طھ ط£ظ†ظƒ طھط§ط¨ط¹طھ ط§ظ„طµظپط­ط© ظپط¹ظ„ظٹط§ظ‹طں")) return;
  const targetRef = doc(db, "users", targetId);
  const targetSnap = await getDoc(targetRef);
  const targetData = targetSnap.data();

  if (userData.points < 1) return alert("ظ„ظٹط³ ظ„ط¯ظٹظƒ ظ†ظ‚ط§ط· ظƒط§ظپظٹط© ظ„طھطھط§ط¨ط¹.");

  // ط®طµظ… ظ†ظ‚ط·ط© ظ…ظ†ظƒ
  await updateDoc(userRef, {
    points: userData.points - 1,
    followers: arrayUnion(targetId)
  });

  // ط¥ط¶ط§ظپط© ظ†ظ‚ط·ط© ظ„ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ط¢ط®ط±
  await updateDoc(targetRef, {
    points: targetData.points + 1
  });

  alert("طھظ…طھ ط§ظ„ظ…طھط§ط¨ط¹ط© ظˆطھظ…طھ ط¥ط¶ط§ظپط© ظ†ظ‚ط·ط©.");
  location.reload();
};
