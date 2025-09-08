// ========== Firebase Config ==========
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAjzK-7dEVNYXdQUd5fsE0DBK02S9U2tss",
  authDomain: "projectz-a7870.firebaseapp.com",
  projectId: "projectz-a7870",
  storageBucket: "projectz-a7870.appspot.com",
  messagingSenderId: "444521859209",
  appId: "1:444521859209:web:4d57fa020c06dcfdb3f7b4"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser = null;

// ========== Auth ==========
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const signUpBtn = document.getElementById("signUpBtn");
const signInBtn = document.getElementById("signInBtn");
const logoutBtn = document.getElementById("logoutBtn");

signUpBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    alert("Sign Up Success ✅ " + userCredential.user.email);
  } catch (error) {
    alert("Sign Up failed: " + error.message);
  }
});

signInBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    alert("Sign In Success ✅ " + userCredential.user.email);
  } catch (error) {
    alert("Sign In failed: " + error.message);
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// track user
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    authSection.classList.add("hidden");
    appSection.classList.remove("hidden");
    loadRecords();
  } else {
    currentUser = null;
    authSection.classList.remove("hidden");
    appSection.classList.add("hidden");
  }
});

// ========== Save & Generate PDF ==========
window.addEventListener("DOMContentLoaded", () => {
  const dataForm = document.getElementById("dataForm");

  dataForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("กรุณา Sign In ก่อนบันทึกข้อมูล");
      return;
    }

    const fullName = document.getElementById("fullName").value;
    const phone = document.getElementById("phone").value;
    const notes = document.getElementById("notes").value;
    const file = document.getElementById("photo").files[0];

    let photoURL = null;

    try {
      // upload photo
      if (file) {
        const storageRef = ref(
          storage,
          `photos/${currentUser.uid}/${Date.now()}_${file.name}`
        );
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }

      // save record
      const newDoc = {
        fullName,
        phone,
        notes,
        photoURL,
        createdAt: serverTimestamp(),
        uid: currentUser.uid
      };

      await addDoc(collection(db, "records"), newDoc);

      // generate PDF
      createPDF(newDoc, (pdf) => {
        pdf.save(`${fullName}.pdf`);
      });

      alert("บันทึกสำเร็จ ✅");
      dataForm.reset();
      loadRecords();
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    }
  });
});

// ========== Load Records ==========
async function loadRecords() {
  const recordsList = document.getElementById("recordsList");
  recordsList.innerHTML = "";

  const q = query(collection(db, "records"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);

  snapshot.forEach((doc) => {
    const data = doc.data();
    const li = document.createElement("li");
    li.textContent = `${data.fullName} - ${data.phone}`;
    recordsList.appendChild(li);
  });
}

// ========== Create PDF ==========
function createPDF(data, callback) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  pdf.setFontSize(16);
  pdf.text(`ชื่อ-นามสกุล: ${data.fullName}`, 10, 20);
  pdf.text(`เบอร์โทร: ${data.phone}`, 10, 30);
  pdf.text(`ข้อมูลเพิ่มเติม: ${data.notes}`, 10, 40);
  pdf.text(`วันที่: ${new Date().toLocaleString()}`, 10, 50);

  if (data.photoURL) {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = data.photoURL;
    img.onload = () => {
      pdf.addImage(img, "JPEG", 150, 20, 100, 80);
      callback(pdf);
    };
  } else {
    callback(pdf);
  }
}
