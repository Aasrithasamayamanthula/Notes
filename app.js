// Initialize Firebase with your config
const firebaseConfig = {
    apiKey: "AIzaSyBI1hpW6rUKSwl3ZtFwhYzmAR0brI3JXfM",
    authDomain: "notes-996c6.firebaseapp.com",
    projectId: "notes-996c6",
    storageBucket: "notes-996c6.firebasestorage.app",
    messagingSenderId: "986395508764",
    appId: "1:986395508764:web:bd925f115b198e20a09fd9",
    measurementId: "G-D2Y3WVM9CR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// DOM Elements
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const nameGroup = document.getElementById('name-group');
const notesList = document.getElementById('notes-list');
const activeTasks = document.getElementById('active-tasks');
const completedTasks = document.getElementById('completed-tasks');
const modal = document.getElementById('modal');

// Authentication Logic
document.getElementById('signup-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const name = document.getElementById('name').value;

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({ displayName: name });
        alert('Signup successful!');
        document.getElementById('auth-form').reset();
    } catch (error) {
        alert('Error signing up: ' + error.message);
    }
};

document.getElementById('login-btn').onclick = async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        document.getElementById('auth-form').reset();
        authSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        loadNotes();
        loadTasks();
    } catch (error) {
        alert('Error logging in: ' + error.message);
    }
};

document.getElementById('logout-btn').onclick = async () => {
    try {
        await auth.signOut();
        authSection.classList.remove('hidden');
        appSection.classList.add('hidden');
        notesList.innerHTML = '';
        activeTasks.innerHTML = '<h3>Active Tasks</h3>';
        completedTasks.innerHTML = '<h3>Completed Tasks</h3>';
    } catch (error) {
        alert('Error logging out: ' + error.message);
    }
};

// Notes Functions
const loadNotes = async () => {
    try {
        notesList.innerHTML = '';
        const user = auth.currentUser;
        const snapshot = await db.collection('notes').where('uid', '==', user.uid).get();
        snapshot.forEach(doc => {
            const note = doc.data();
            const noteElement = createNoteElement(doc.id, note);
            notesList.appendChild(noteElement);
        });
    } catch (error) {
        alert('Error loading notes: ' + error.message);
    }
};

const createNoteElement = (id, note) => {
    const div = document.createElement('div');
    div.className = 'item-card';
    div.innerHTML = `
        <h3>${note.title}</h3>
        <p>${note.content}</p>
        <div class="controls">
            <button onclick="editNote('${id}')"><i class="fas fa-edit"></i></button>
            <button onclick="deleteNote('${id}')"><i class="fas fa-trash"></i></button>
            <button onclick="copyNote('${id}')"><i class="fas fa-copy"></i></button>
        </div>
    `;
    return div;
};

const editNote = async (noteId) => {
    const noteDoc = await db.collection('notes').doc(noteId).get();
    const note = noteDoc.data();

    document.getElementById('note-title').value = note.title;
    document.getElementById('note-content').value = note.content;

    const addNoteBtn = document.getElementById('add-note');
    addNoteBtn.textContent = 'Update Note';
    addNoteBtn.onclick = async () => {
        try {
            await db.collection('notes').doc(noteId).update({
                title: document.getElementById('note-title').value,
                content: document.getElementById('note-content').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            resetNoteForm();
            loadNotes();
        } catch (error) {
            alert('Error updating note: ' + error.message);
        }
    };
};

const deleteNote = async (noteId) => {
    if (await showConfirmation('Are you sure you want to delete this note?')) {
        try {
            await db.collection('notes').doc(noteId).delete();
            loadNotes();
        } catch (error) {
            alert('Error deleting note: ' + error.message);
        }
    }
};

const copyNote = async (noteId) => {
    const noteDoc = await db.collection('notes').doc(noteId).get();
    const note = noteDoc.data();

    try {
        await navigator.clipboard.writeText(note.content);
        alert('Note content copied to clipboard!');
    } catch (error) {
        alert('Error copying note: ' + error.message);
    }
};

document.getElementById('add-note').onclick = async () => {
    const title = document.getElementById('note-title').value;
    const content = document.getElementById('note-content').value;

    if (title.trim() === '' || content.trim() === '') {
        alert('Please fill in both title and content');
        return;
    }

    try {
        const user = auth.currentUser;
        await db.collection('notes').add({
            title: title,
            content: content,
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        resetNoteForm();
        loadNotes();
    } catch (error) {
        alert('Error adding note: ' + error.message);
    }
};

// Tasks Functions
const loadTasks = async () => {
    try {
        activeTasks.innerHTML = '<h3>Active Tasks</h3>';
        completedTasks.innerHTML = '<h3>Completed Tasks</h3>';
        
        const user = auth.currentUser;
        const snapshot = await db.collection('tasks').where('uid', '==', user.uid).get();
        snapshot.forEach(doc => {
            const task = doc.data();
            const taskElement = createTaskElement(doc.id, task);
            if (task.completed) {
                completedTasks.appendChild(taskElement);
            } else {
                activeTasks.appendChild(taskElement);
            }
        });
    } catch (error) {
        alert('Error loading tasks: ' + error.message);
    }
};

const createTaskElement = (id, task) => {
    const div = document.createElement('div');
    div.className = `item-card priority-${task.priority}`;
    div.innerHTML = `
        <div class="task-header">
            <input type="checkbox" ${task.completed ? 'checked' : ''} 
                onchange="toggleTaskComplete('${id}', this.checked)">
            <h3>${task.title}</h3>
        </div>
        <p>${task.description}</p>
        <div class="task-meta">
            <span class="task-priority">${task.priority}</span>
            <span class="task-category">${task.category}</span>
        </div>
        <div class="controls">
            <button onclick="editTask('${id}')"><i class="fas fa-edit"></i></button>
            <button onclick="deleteTask('${id}')"><i class="fas fa-trash"></i></button>
        </div>
    `;
    return div;
};

const editTask = async (taskId) => {
    const taskDoc = await db.collection('tasks').doc(taskId).get();
    const task = taskDoc.data();

    document.getElementById('task-title').value = task.title;
    document.getElementById('task-description').value = task.description;
    document.getElementById('task-priority').value = task.priority;
    document.getElementById('task-category').value = task.category;

    const addTaskBtn = document.getElementById('add-task');
    addTaskBtn.textContent = 'Update Task';
    addTaskBtn.onclick = async () => {
        try {
            await db.collection('tasks').doc(taskId).update({
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-description').value,
                priority: document.getElementById('task-priority').value,
                category: document.getElementById('task-category').value,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            resetTaskForm();
            loadTasks();
        } catch (error) {
            alert('Error updating task: ' + error.message);
        }
    };
};

const deleteTask = async (taskId) => {
    if (await showConfirmation('Are you sure you want to delete this task?')) {
        try {
            await db.collection('tasks').doc(taskId).delete();
            loadTasks();
        } catch (error) {
            alert('Error deleting task: ' + error.message);
        }
    }
};

const toggleTaskComplete = async (taskId, completed) => {
    try {
        await db.collection('tasks').doc(taskId).update({
            completed: completed
        });
        loadTasks();
    } catch (error) {
        alert('Error updating task status: ' + error.message);
    }
};

document.getElementById('add-task').onclick = async () => {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-description').value;
    const priority = document.getElementById('task-priority').value;
    const category = document.getElementById('task-category').value;

    if (title.trim() === '' || description.trim() === '') {
        alert('Please fill in both title and description');
        return;
    }

    try {
        const user = auth.currentUser;
        await db.collection('tasks').add({
            title: title,
            description: description,
            priority: priority,
            category: category,
            completed: false,
            uid: user.uid,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        resetTaskForm();
        loadTasks();
    } catch (error) {
        alert('Error adding task: ' + error.message);
    }
};

// Utility Functions
const showConfirmation = (message) => {
    return new Promise((resolve) => {
        const modalMessage = document.getElementById('modal-message');
        const modalConfirm = document.getElementById('modal-confirm');
        const modalCancel = document.getElementById('modal-cancel');

        modalMessage.textContent = message;
        modal.classList.remove('hidden');

        modalConfirm.onclick = () => {
            modal.classList.add('hidden');
            resolve(true);
        };

        modalCancel.onclick = () => {
            modal.classList.add('hidden');
            resolve(false);
        };
    });
};

const resetNoteForm = () => {
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    const addNoteBtn = document.getElementById('add-note');
    addNoteBtn.textContent = 'Add Note';
    addNoteBtn.onclick = document.getElementById('add-note').onclick;
};

const resetTaskForm = () => {
    document.getElementById('task-title').value = '';
    document.getElementById('task-description').value = '';
    document.getElementById('task-priority').value = 'medium';
    document.getElementById('task-category').value = 'work';
    const addTaskBtn = document.getElementById('add-task');
    addTaskBtn.textContent = 'Add Task';
    addTaskBtn.onclick = document.getElementById('add-task').onclick;
};

// Theme management
const loadTheme = () => {
    const theme = localStorage.getItem('theme') || 'light-theme';
    document.body.className = theme;
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    
    // Auth state observer
    auth.onAuthStateChanged(user => {
        if (user) {
            authSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            loadNotes();
            loadTasks();
        } else {
            authSection.classList.remove('hidden');
            appSection.classList.add('hidden');
        }
    });

    // Theme toggle
    document.getElementById('theme-toggle').onclick = () => {
        const currentTheme = document.body.className;
        const newTheme = currentTheme === 'light-theme' ? 'dark-theme' : 'light-theme';
        document.body.className = newTheme;
        localStorage.setItem('theme', newTheme);
    };
});