onst commentsList = document.getElementById("comments");
const addButton = document.getElementById("add-button");
const nameInput = document.getElementById("name-input");
const textInput = document.getElementById("text-input");

const API_URL = "https://wedev-api.sky.pro/api/v1/alina-skypro/comments";

let comments = [];

function fetchComments() {
  fetch(API_URL)
    .then((response) => response.json())
    .then((data) => {
      comments = data.comments.map((comment) => ({
        ...comment,
        isLiked: false,
        localLikes: comment.likes,
      }));
      renderComments();
    })
    .catch((error) => {
      console.error("Ошибка загрузки комментариев:", error);
    });
}

function renderComments() {
  commentsList.innerHTML = "";

  comments.forEach((comment, index) => {
    const li = document.createElement("li");
    li.className = "comment";

    li.innerHTML = `
      <div class="comment-header">
        <div>${comment.author.name}</div>
        <div>${new Date(comment.date).toLocaleString()}</div>
      </div>
      <div class="comment-body">
        <div class="comment-text">${comment.text}</div>
      </div>
      <div class="comment-footer">
        <button class="like-button" data-index="${index}">
          ♥️ ${comment.localLikes}
        </button>
      </div>
    `;

    commentsList.appendChild(li);
  });

  document.querySelectorAll(".like-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = button.dataset.index;
      comments[index].isLiked = !comments[index].isLiked;
      comments[index].localLikes += comments[index].isLiked ? 1 : -1;
      renderComments();
    });
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

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, text }),
  })
    .then((response) => {
      if (response.status === 201) {
        return fetchComments();
      } else if (response.status === 400) {
        return response.json().then((data) => {
          throw new Error(data.error);
        });
      } else {
        throw new Error("Ошибка сервера. Попробуйте позже.");
      }
    })
    .catch((error) => {
      alert(`Ошибка: ${error.message}`);
    })
    .finally(() => {
      addButton.disabled = false;
      addButton.textContent = "Добавить";
      nameInput.value = "";
      textInput.value = "";
    });
});
