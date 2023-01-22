import { initializeApp } from 'firebase/app'
import {
    getFirestore, collection, onSnapshot,
    addDoc, deleteDoc, doc, setDoc,
    getDocs, query, where,
    orderBy, serverTimestamp,
    getDoc, updateDoc
} from 'firebase/firestore'
import {
    getAuth, createUserWithEmailAndPassword,
    signOut, signInWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth'

import { 
    getStorage, ref as sRef, 
    uploadBytesResumable, getDownloadURL 
} from 'firebase/storage'

const firebaseConfig = {

    apiKey: "AIzaSyAEH0AcaMflqKZRDEghBQiASohJlP4pTYc",
  
    authDomain: "aqua-smoothies.firebaseapp.com",
  
    databaseURL: "https://aqua-smoothies.firebaseio.com",
  
    projectId: "aqua-smoothies",
  
    storageBucket: "aqua-smoothies.appspot.com",
  
    messagingSenderId: "1031773288751",
  
    appId: "1:1031773288751:web:c1b37cbee36d92d6"
  
  };

//  init firebase app
initializeApp(firebaseConfig)

// init services const
const db = getFirestore()
const auth = getAuth()

// collection ref
const colRef = collection(db, 'mybooks')

// queries
const q = query(colRef, orderBy('createdAt'))

console.log("hello everyone");

// real time collection data
// can be colRef or q
const unsubCol = onSnapshot(q, (snapshot) => {
    let books = []
    snapshot.docs.forEach((doc) => {
        books.push({ ...doc.data(), id: doc.id })
    })
    console.log(books)
})

//   adding documents
const addBookForm = document.querySelector('.add')
addBookForm.addEventListener('submit', (e) => {
    e.preventDefault()

    addDoc(colRef, {
        title: addBookForm.title.value,
        author: addBookForm.author.value,
        createdAt: serverTimestamp()
    })
    .then(() => {
        addBookForm.reset()
    })
})

// deleting documents
const deleteBookForm = document.querySelector('.delete')
deleteBookForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const docRef = doc(db, 'mybooks', deleteBookForm.id.value)

    deleteDoc(docRef)
        .then(() => {
            deleteBookForm.reset()
        })
})

// get a single document
const docRef = doc(db, 'mybooks', 'F7b7tNG9uKDIGtu8MZ5n')

const unsubDoc = onSnapshot(docRef, (doc) => {
    console.log(doc.data(), doc.id)
})

// updating a document
const updateForm = document.querySelector('.update')
updateForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const docRef = doc(db, 'mybooks', updateForm.id.value)

    updateDoc(docRef, {
        title: 'the lone road'
    })
    .then(() => {
        updateForm.reset()
    })

})

// signing users up
const signupForm = document.querySelector('.signup')
signupForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = signupForm.email.value
    const password = signupForm.password.value

    createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            console.log('user created:', cred.user)
            signupForm.reset()
        })
        .catch((err) => {
            console.log(err.message)
        })
})

// logging in and out
const logoutButton = document.querySelector('.logout')
logoutButton.addEventListener('click', () => {
    signOut(auth)
        .then(() => {
            // console.log('the user signed out')
        })
        .catch((err) => {
            console.log(err.message)
        })
})

const loginForm = document.querySelector('.login')
loginForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = loginForm.email.value
    const password = loginForm.password.value

    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            // console.log('user logged in:', cred.user)
            loginForm.reset()
        })
        .catch((err) => {
            console.log(err.message)
        })
})

// subscribing to auth changes
const unsubAuth = onAuthStateChanged(auth, (user) => {
    console.log('user status changed:', user)
})

// unsubscribing from changes (auth & db)
const unsubButton = document.querySelector('.unsub')
unsubButton.addEventListener('click', () => {
    console.log('unsubscribing')
    unsubCol()
    unsubDoc()
    unsubAuth()
})

// FIREBASE STORAGE
// variables and references
var files = [];
var reader = new FileReader();

var namebox = document.getElementById('namebox');
var extlab = document.getElementById('extlab');
var myimg = document.getElementById('myimg');
var proglab = document.getElementById('upprogress');
var SelBtn = document.getElementById('selbtn');
var UpBtn = document.getElementById('upbtn');
var DownBtn = document.getElementById('downbtn');

var input = document.createElement('input');
input.type = 'file';

input.onchange = e => {
    files = e.target.files;

    var extension = GetExtName(files[0]);
    var name = GetFileName(files[0]);

    namebox.value = name;
    extlab.innerHTML = extension;

    reader.readAsDataURL(files[0]);
}

reader.onload = function() {
    myimg.src = reader.result;
}

// Selection
SelBtn.onclick = function() {
    input.click();
}

function GetExtName(file) {
    console.log(file.name);
    var temp = file.name.split('.');
    var ext = temp.slice((temp.length-1), (temp.length));
    return '.' + ext[0];
}

function GetFileName(file) {
    var temp = file.name.split('.');
    var fname = temp.slice(0, -1).join('.');
    return fname;
}

// Upload Process

async function UploadProcess() {
    var ImgToUpload = files[0];
    var ImgName = namebox.value + extlab.innerHTML;

    const metaData = {
        contentType: ImgToUpload.type
    }

    const storage = getStorage();
    const storageRef = sRef(storage, "Images/" + ImgName);
    const UploadTask = uploadBytesResumable(storageRef, ImgToUpload, metaData);

    UploadTask.on('state-changed', (snapshot) => {
        var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        proglab.innerHTML = "Upload " + progress + "%";
    },
    (error) => {
        alert("error: image not uploaded!");
    },
    () => {
        getDownloadURL(UploadTask.snapshot.ref).then((downloadURL) => {
            console.log(downloadURL);
            SaveURLFirestore(downloadURL);
        })
    }
    );
}

// Functions for FIRESTORE DATABASE

async function SaveURLFirestore(url) {
    var name = namebox.value;
    var ext = extlab.innerHTML;

    var ref = doc(db, "ImageLinks/" + name);

    await setDoc(ref, {
        ImgName: (name+ext),
        ImageUrl: url
    })
}

async function GetImagefromFirestore() {
    var name = namebox.value;
    var ref = doc(db, "ImageLinks/" + name);
    const docSnap = await getDoc(ref);

    if(docSnap.exists()) {
        myimg.src = docSnap.data().ImageUrl;
    }
}

UpBtn.onclick = UploadProcess;
DownBtn.onclick = GetImagefromFirestore;

// FIREBASE LIST DATA ON TABLE
var stdNo = 0;
var tbody = document.getElementById('tbody1');

function AddItemToTable(name, roll, sec, gen) {
    let trow = document.createElement('tr');
    let td1 = document.createElement('td');
    let td2 = document.createElement('td');
    let td3 = document.createElement('td');
    let td4 = document.createElement('td');
    let td5 = document.createElement('td');

    td1.innerHTML = ++stdNo;
    td2.innerHTML = name;
    td3.innerHTML = roll;
    td4.innerHTML = sec;
    td5.innerHTML = gen;

    trow.appendChild(td1);
    trow.appendChild(td2);
    trow.appendChild(td3);
    trow.appendChild(td4);
    trow.appendChild(td5);

    tbody.appendChild(trow);
}

function AddAllItemsToTable(TheStudent) {
    stdNo = 0;
    tbody.innerHTML = "";
    TheStudent.forEach(element => {
        AddItemToTable(element.NameOfStd, element.RollNo, element.Section, element.Gender);
    })
}

// Get all data
async function GetAllDataOnce() {
    const querySnapshot = await getDocs(collection(db, "TheStudentList"));

    var students = [];

    querySnapshot.forEach(doc => {
        students.push(doc.data());
    });

    AddAllItemsToTable(students);
}

async function GetAllDataRealtime() {
    const dbRef = collection(db, "TheStudentList");

    onSnapshot(dbRef, (querySnapshot) => {
        var students = [];

        querySnapshot.forEach(doc => {
            students.push(doc.data());
        });
        AddAllItemsToTable(students);
    })
}

// window.onload = GetAllDataOnce;
window.onload = GetAllDataRealtime;