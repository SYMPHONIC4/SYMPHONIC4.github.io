import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js";

// ✅ Firebase Config (แก้ comma แล้ว)
const firebaseConfig = {
  apiKey: "AIzaSyAjzK-7dEVNYXdQUd5fsE0DBK02S9U2tss",
  authDomain: "projectz-a7870.firebaseapp.com",
  projectId: "projectz-a7870",
  storageBucket: "projectz-a7870.firebasestorage.app",
  messagingSenderId: "1082768228000",
  appId: "1:1082768228000:web:f29f44ab6c0cbb66a993c5",
  measurementId: "G-XKCE0X81JB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Elements
const authForm = document.getElementById('authForm');
const signInBtn = document.getElementById('signInBtn');
const signUpBtn = document.getElementById('signUpBtn');
const formContainer = document.getElementById('formContainer');
const logoutBtn = document.getElementById('logoutBtn');
const dataForm = document.getElementById('dataForm');
const printBtn = document.getElementById('printBtn');
const recordsList = document.getElementById('recordsList');

let currentUser = null;

// ✅ Sign In
signInBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try { 
    await signInWithEmailAndPassword(auth, email, password); 
  } catch (err) { 
    alert('Sign In failed: ' + err.message); 
  }
});

// ✅ Sign Up (เพิ่ม e.preventDefault())
signUpBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  try { 
    await createUserWithEmailAndPassword(auth, email, password); 
    alert('สมัครสำเร็จ! ล็อกอินเข้าสู่ระบบได้เลย'); 
  } catch (err) { 
    alert('Sign Up failed: ' + err.message); 
  }
});

// ✅ Logout
logoutBtn.addEventListener('click', async () => { 
  await signOut(auth); 
});

// ✅ Auth state
onAuthStateChanged(auth, user => {
  if (user) {
    currentUser = user;
    document.getElementById('loginForm').style.display = 'none';
    formContainer.style.display = 'block';
    loadRecords();
  } else {
    currentUser = null;
    document.getElementById('loginForm').style.display = 'block';
    formContainer.style.display = 'none';
  }
});

// ================= SAVE & PDF =================

// ✅ Save data + Generate PDF
dataForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const fullName = document.getElementById("fullName").value;
  const phone = document.getElementById("phone").value;
  const notes = document.getElementById("notes").value;
  const file = document.getElementById("photo").files[0];

  let photoURL = null;

  try {
    if (file) {
      const storageRef = ref(storage, `photos/${currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      photoURL = await getDownloadURL(storageRef);
    }

    const newDoc = {
      fullName,
      phone,
      notes,
      photoURL,
      createdAt: serverTimestamp(),
      uid: currentUser.uid
    };

    // บันทึกลง Firestore
    await addDoc(collection(db, "records"), newDoc);

    // ✅ สร้าง PDF หลังบันทึกเสร็จ
    createPDF(newDoc, (pdf) => {
      pdf.save(`${fullName}.pdf`);
    });

    alert("บันทึกสำเร็จ ✅");
    dataForm.reset();
    loadRecords();

  } catch (err) {
    alert("Error: " + err.message);
  }
});

// ================= PDF =================

function createPDF(data, callback) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  pdf.setFontSize(16);
  pdf.text(`ชื่อ-นามสกุล: ${data.fullName}`, 10, 20);
  pdf.text(`เบอร์โทร: ${data.phone}`, 10, 30);
  pdf.text(`ข้อมูลเพิ่มเติม: ${data.notes}`, 10, 40);
  pdf.text(`วันที่: ${new Date().toLocaleString()}`, 10, 50);

  if (data.photoURL) {
    const img = new Image();
    img.src = data.photoURL;
    img.onload = () => {
      pdf.addImage(img, "JPEG", 150, 20, 100, 80);
      callback(pdf);
    };
  } else {
    callback(pdf);
  }
}
