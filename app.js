
import { initializeApp }
from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import {
    getFirestore,
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";


// Firebase設定
const firebaseConfig = {
  apiKey: "AIzaSyBOHN3MV6H8SSPe3yyUjAuK6CQ6nNkbO50",
  authDomain: "family-memo-f928b.firebaseapp.com",
  projectId: "family-memo-f928b",
  storageBucket: "family-memo-f928b.firebasestorage.app",
  messagingSenderId: "680337364703",
  appId: "1:680337364703:web:503cec20a0b7691ea7fb6a"
};


// Firebase初期化
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// HTML要素
const loginArea = document.getElementById("loginArea");
const memoArea = document.getElementById("memoArea");
const status = document.getElementById("status");
const memoList = document.getElementById("memoList");

let unsubscribeMemos = null;


// ログイン
document.getElementById("loginBtn").addEventListener("click", async () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert("ログインできませんでした: " + error.message);
    }

});


// ログアウト
document.getElementById("logoutBtn").addEventListener("click", async () => {

    try {
        await signOut(auth);
    } catch (error) {
        alert("ログアウトエラー: " + error.message);
    }

});


// ログイン状態の監視
onAuthStateChanged(auth, (user) => {

    if (unsubscribeMemos) {
        unsubscribeMemos();
        unsubscribeMemos = null;
    }

    memoList.replaceChildren();

    if (user) {

        loginArea.classList.add("hidden");
        memoArea.classList.remove("hidden");

        document.getElementById("userInfo").textContent =
        "ログイン中: " + user.email;

        loadMemos();

    } else {

        loginArea.classList.remove("hidden");
        memoArea.classList.add("hidden");

        status.textContent = "ログインしてください。";

    }

});


// メモ登録
document.getElementById("addBtn").addEventListener("click", async () => {

    const user = auth.currentUser;
    const name = document.getElementById("name").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !message) {
        alert("名前とメモを入力してください");
        return;
    }

    if (message.length > 1000 || name.length > 30) {
        alert("名前は30文字以内、メモは1000文字以内にしてください");
        return;
    }

    try {

        await addDoc(collection(db, "memos"), {
            uid: user.uid,
            author: name,
            message: message,
            createdAt: serverTimestamp()
        });

        document.getElementById("message").value = "";

    } catch (error) {
        alert("登録エラー: " + error.message);
    }

});


// メモ一覧
function loadMemos() {

    const q = query(
        collection(db, "memos"),
        orderBy("createdAt", "desc")
    );

    unsubscribeMemos = onSnapshot(q, (snapshot) => {

        memoList.replaceChildren();

        snapshot.forEach((memoDoc) => {

            const data = memoDoc.data();
            const memoId = memoDoc.id;

            const memo = document.createElement("div");
            memo.className = "memo";

            const author = document.createElement("strong");
            author.textContent = data.author;

            const content = document.createElement("p");
            content.textContent = data.message;

            const date = document.createElement("small");
            date.textContent = data.createdAt
                ? data.createdAt.toDate().toLocaleString("ja-JP")
                : "保存中...";

            memo.append(author, content, date);

            if (data.uid === auth.currentUser.uid) {

                const editButton = document.createElement("button");
                editButton.textContent = "編集";

                editButton.addEventListener("click", () => {
                    editMemo(memoId, data.message);
                });

                const deleteButton = document.createElement("button");
                deleteButton.textContent = "削除";
                deleteButton.style.background = "#dc2626";

                deleteButton.addEventListener("click", () => {
                    deleteMemo(memoId);
                });

                memo.append(editButton, deleteButton);
            }

            memoList.appendChild(memo);

        });

    }, (error) => {
        status.textContent = "データ取得エラー: " + error.message;
    });

}


// メモ編集
async function editMemo(memoId, oldMessage) {

    const newMessage = prompt("新しいメモを入力してください", oldMessage);

    if (newMessage === null) return;

    const message = newMessage.trim();

    if (message === "" || message.length > 1000) {
        alert("メモは1〜1000文字で入力してください");
        return;
    }

    try {

        await updateDoc(doc(db, "memos", memoId), {
            message: message
        });

        alert("メモを更新しました！");

    } catch (error) {
        alert("更新エラー: " + error.message);
    }

}


// メモ削除
async function deleteMemo(memoId) {

    if (!confirm("このメモを削除しますか？")) return;

    try {

        await deleteDoc(doc(db, "memos", memoId));

        alert("メモを削除しました！");

    } catch (error) {
        alert("削除エラー: " + error.message);
    }

}
