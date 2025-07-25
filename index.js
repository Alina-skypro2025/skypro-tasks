const commentsList = document.getElementById("comments");
const addButton = document.getElementById("add-button");
const nameInput = document.getElementById("name-input");
const textInput = document.getElementById("text-input");
const commentForm = document.querySelector(".comment-form");

const API_URL = "https://wedev-api.sky.pro/api/v1/alina-skypro/comments";

let comments = [];
let savedName = "";
let savedText = "";

nameInput.addEventListener("input", () => {
  savedName = nameInput.value;
});
textInput.addEventListener("input", () => {
  savedText = textInput.value;
});

function showLoadingMessage(message) {
  commentsList.innerHTML = `<div class="loading">${message}</div>`;
}

function fetchComments() {
  showLoadingMessage("Загрузка комментариев...");
  return fetch(API_URL)
    .then((response) => {
      if (response.status >= 500) {
        throw new Error("Сервер недоступен. Попробуйте позже.");
      }
      return response.json();
    })
    .then((data) => {
      comments = data.comments.map((comment) => ({
        ...comment,
        isLiked: false,
        localLikes: comment.likes,
      }));
      renderComments();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        commentsList.innerHTML = `<div class="error">Нет интернета. Проверьте соединение.</div>`;
      } else {
        commentsList.innerHTML = `<div class="error">${error.message}</div>`;
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
        <i class="like-button ${comment.isLiked ? "active" : ""}" data-index="${index}">❤️</i>
        <span>${comment.localLikes}</span>
      </div>
    `;

    commentsList.appendChild(li);
  });

  nameInput.value = savedName;
  textInput.value = savedText;

  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = button.dataset.index;
      comments[index].isLiked = !comments[index].isLiked;
      comments[index].localLikes += comments[index].isLiked ? 1 : -1;
      renderComments();
    });
  });
}

function addComment({ name, text }) {
  commentForm.style.display = "none";
  commentsList.insertAdjacentHTML("beforebegin", `<div id="adding">Комментарий добавляется...</div>`);

  // Исправлено: отправляем данные в формате JSON
  return fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: name,
      text: text
    }),
  })
    .then((response) => {
      if (response.status === 201) {
        savedName = "";
        savedText = "";
        nameInput.value = "";
        textInput.value = "";
        return fetchComments();
      } else if (response.status === 400) {
        return response.json().then((data) => {
          throw new Error(data.error + " Неверные данные");
        });
      } else if (response.status >= 500) {
        throw new Error("Ошибка сервера. Попробуйте позже.");
      } else {
        throw new Error(`Ошибка сервера: ${response.status}`);
      }
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        alert("Нет интернета. Повторите позже.");
      } else {
        alert(`Ошибка: ${error.message}`);
      }
    })
    .finally(() => {
      const addingEl = document.getElementById("adding");
      if (addingEl) addingEl.remove();
      commentForm.style.display = "block";
    });
}

addButton.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const text = textInput.value.trim();

  if (name.length < 3 || text.length < 3) {
    alert("Имя и комментарий должны содержать минимум 3 символа.");
    return;
  }

  addButton.disabled = true;
  addButton.textContent = "Отправка...";

  addComment({ name, text }).finally(() => {
    addButton.disabled = false;
    addButton.textContent = "Написать";
  });
});

fetchComments();
