const commentsList = document.getElementById("comments");
const addButton = document.getElementById("add-button");
const nameInput = document.getElementById("name-input");
const textInput = document.getElementById("text-input");
const commentForm = document.getElementById("comment-form");
const authContainer = document.getElementById("auth-container");
const loginForm = document.getElementById("login-form");
const loginInput = document.getElementById("login-input");
const passwordInput = document.getElementById("password-input");
const loginButton = document.getElementById("login-button");
const loginError = document.getElementById("login-error");


const PERSONAL_KEY = "alina-skypro";
const BASE_URL = `https://wedev-api.sky.pro/api/v2/${PERSONAL_KEY}`;
const COMMENTS_URL = `${BASE_URL}/comments`;
const LOGIN_URL = "https://wedev-api.sky.pro/api/user/login";

let comments = [];
let savedName = "";
let savedText = "";
let token = localStorage.getItem("token");
let userName = localStorage.getItem("userName");
let userLogin = localStorage.getItem("userLogin");

nameInput.addEventListener("input", () => {
  savedName = nameInput.value;
});
textInput.addEventListener("input", () => {
  savedText = textInput.value;
});


function updateAuthUI() {
  if (token) {
  
    authContainer.innerHTML = `
      <div style="text-align: right; margin-bottom: 15px;">
        <span>Вы вошли как <strong>${userName}</strong></span>
        <button id="logout-button" style="margin-left: 10px; background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer;">Выйти</button>
      </div>
    `;
    document.getElementById("logout-button").addEventListener("click", logout);
    commentForm.style.display = "block";
    nameInput.value = userName;
  } else {
  
    authContainer.innerHTML = `
      <div style="text-align: center; padding: 15px; background: #e9f7fe; border-radius: 5px; margin-bottom: 20px;">
        Чтобы добавить комментарий, <a href="#" id="show-login" style="color: #007bff; text-decoration: none; font-weight: bold;">авторизуйтесь</a>
      </div>
    `;
    document.getElementById("show-login").addEventListener("click", (e) => {
      e.preventDefault();
      showLoginForm();
    });
    commentForm.style.display = "none";
  }
}


function showLoginForm() {
  commentForm.style.display = "none";
  loginForm.style.display = "block";
}


function hideLoginForm() {
  loginForm.style.display = "none";
  commentForm.style.display = token ? "block" : "none";
}


function loginUser() {
  const login = loginInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!login || !password) {
    showErrorLogin("Заполните все поля");
    return;
  }
  
  loginButton.disabled = true;
  loginButton.textContent = "Вход...";
  loginError.style.display = "none";
  
  fetch(LOGIN_URL, {
    method: "POST",
    body: JSON.stringify({ login, password }),
  })
    .then((response) => {
      if (response.status === 201) {
        return response.json();
      } else if (response.status === 400) {
        return response.json().then((data) => {
          throw new Error(data.error);
        });
      } else if (response.status === 401) {
        throw new Error("Неверный логин или пароль");
      } else if (response.status >= 500) {
        throw new Error("Сервер недоступен. Попробуйте позже.");
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    })
    .then((data) => {
      token = data.user.token;
      userName = data.user.name;
      userLogin = data.user.login;
      localStorage.setItem("token", token);
      localStorage.setItem("userName", userName);
      localStorage.setItem("userLogin", userLogin);
      
      hideLoginForm();
      updateAuthUI();
      fetchComments();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        showErrorLogin("Нет интернета. Проверьте соединение.");
      } else {
        showErrorLogin(error.message);
      }
    })
    .finally(() => {
      loginButton.disabled = false;
      loginButton.textContent = "Войти";
    });
}


function logout() {
  token = null;
  userName = "";
  userLogin = "";
  localStorage.removeItem("token");
  localStorage.removeItem("userName");
  localStorage.removeItem("userLogin");
  updateAuthUI();
}

function showErrorLogin(message) {
  loginError.textContent = message;
  loginError.style.display = "block";
}

function showLoadingMessage(message) {
  commentsList.innerHTML = `<div class="loading">${message}</div>`;
}

function showError(message) {
  commentsList.innerHTML = `<div class="error">${message}</div>`;
}


function fetchComments() {
  showLoadingMessage("Загрузка комментариев...");
  
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  return fetch(COMMENTS_URL, { headers })
    .then((response) => {
      if (response.status === 401) {
        logout();
        throw new Error("Сессия истекла. Пожалуйста, авторизуйтесь снова.");
      }
      if (response.status >= 500) {
        throw new Error("Сервер недоступен. Попробуйте позже.");
      }
      return response.json();
    })
    .then((data) => {
      comments = data.comments.map((comment) => ({
        ...comment,
        isLiked: comment.isLiked || false,
        localLikes: comment.likes,
      }));
      renderComments();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        showError("Нет интернета. Проверьте соединение.");
      } else {
        showError(error.message);
      }
    });
}


function renderComments() {
  commentsList.innerHTML = "";

  if (comments.length === 0) {
    commentsList.innerHTML = `<div class="empty-state">Нет комментариев</div>`;
    return;
  }

  comments.forEach((comment, index) => {
    const li = document.createElement("li");
    li.className = "comment";
    li.innerHTML = `
      <div class="comment-header">
        <div class="comment-name">${comment.author.name}</div>
        <div class="comment-date">${new Date(comment.date).toLocaleString()}</div>
      </div>
      <div class="comment-text">${comment.text}</div>
      <div class="likes">
        <span class="like-button ${comment.isLiked ? "active" : ""}" data-id="${comment.id}" style="cursor: pointer; font-size: 1.2em;">❤️</span>
        <span>${comment.likes}</span>
      </div>
    `;
    commentsList.appendChild(li);
  });

  nameInput.value = savedName;
  textInput.value = savedText;


  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", () => {
      if (!token) {
        alert("Для лайка необходимо авторизоваться");
        return;
      }
      
      const commentId = button.dataset.id;
      toggleLike(commentId, button);
    });
  });
}


function toggleLike(commentId, buttonElement) {
  const headers = {
    "Authorization": `Bearer ${token}`
  };
  
  fetch(`${COMMENTS_URL}/${commentId}/toggle-like`, {
    method: "POST",
    headers
  })
  .then(response => {
    if (response.status === 401) {
      logout();
      throw new Error("Сессия истекла. Пожалуйста, авторизуйтесь снова.");
    }
    if (response.status >= 500) {
      throw new Error("Сервер недоступен. Попробуйте позже.");
    }
    return response.json();
  })
  .then(data => {
    
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      comment.isLiked = data.result.isLiked;
      comment.likes = data.result.likes;
      
      // Обновляем UI
      buttonElement.classList.toggle("active", comment.isLiked);
      buttonElement.nextElementSibling.textContent = comment.likes;
    }
  })
  .catch(error => {
    if (error.message === "Failed to fetch") {
      alert("Нет интернета. Повторите позже.");
    } else {
      alert("Ошибка: " + error.message);
    }
  });
}


function addComment({ text }) {
  if (!token) {
    alert("Для добавления комментария необходимо авторизоваться");
    return Promise.resolve();
  }

  commentForm.style.display = "none";
  commentsList.insertAdjacentHTML("beforebegin", '<div id="adding">Комментарий добавляется...</div>');


  const headers = {
    "Authorization": `Bearer ${token}`
  };

  return fetch(COMMENTS_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ text }),
  })
    .then((response) => {
      if (response.status === 201) {
        return { status: response.status };
      } else if (response.status === 400) {
        return response.json().then((data) => {
          throw new Error(data.error);
        });
      } else if (response.status === 401) {
        logout();
        throw new Error("Сессия истекла. Пожалуйста, авторизуйтесь снова.");
      } else if (response.status >= 500) {
        throw new Error("Сервер недоступен. Попробуйте позже.");
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    })
    .then(() => {
      savedName = "";
      savedText = "";
      textInput.value = "";
      return fetchComments();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        alert("Нет интернета. Повторите позже.");
      } else {
        alert("Ошибка: " + error.message);
      }
    })
    .finally(() => {
      const addingEl = document.getElementById("adding");
      if (addingEl) addingEl.remove();
      commentForm.style.display = "block";
    });
}


addButton.addEventListener("click", () => {
  const text = textInput.value.trim();

  if (text.length < 3) {
    alert("Комментарий должен содержать минимум 3 символа.");
    return;
  }

  if (!token) {
    alert("Для добавления комментария необходимо авторизоваться");
    return;
  }

  addButton.disabled = true;
  addButton.textContent = "Отправка...";

  addComment({ text }).finally(() => {
    addButton.disabled = false;
    addButton.textContent = "Написать";
  });
});


loginButton.addEventListener("click", loginUser);


updateAuthUI();
fetchComments();
