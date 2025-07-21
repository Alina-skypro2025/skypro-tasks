const todosList = document.getElementById("todos");
const addForm = document.getElementById("add-form");
const textInput = document.getElementById("text-input");
const addButton = document.getElementById("add-button");
const addUnreliableButton = document.getElementById("add-unreliable-button");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");

const API_URL = "https://wedev-api.sky.pro/api/todos ";
const API_URL_UNRELIABLE = "https://wedev-api.sky.pro/api/todos/with-error ";

let savedText = "";

textInput.addEventListener("input", () => {
  savedText = textInput.value;
});

function showLoading() {
  loadingEl.classList.remove("hidden");
  errorEl.classList.add("hidden");
}

function hideLoading() {
  loadingEl.classList.add("hidden");
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.classList.remove("hidden");
  loadingEl.classList.add("hidden");
}

function clearError() {
  errorEl.classList.add("hidden");
}

function fetchTodos() {
  showLoading();
  return fetch(API_URL)
    .then((response) => {
      if (response.status === 500) {
        throw new Error("Ошибка сервера. Попробуйте позже.");
      }
      if (!response.ok) {
        throw new Error("Ошибка загрузки задач.");
      }
      return response.json();
    })
    .then((data) => {
      renderTodos(data.todos);
      hideLoading();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        showError("Нет интернета. Проверьте соединение.");
      } else {
        showError(error.message);
      }
    });
}

function renderTodos(todos) {
  todosList.innerHTML = "";
  clearError();

  if (todos.length === 0) {
    todosList.innerHTML = "<li>Нет задач</li>";
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    const deleteBtn = document.createElement("button");

    li.textContent = todo.text;
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", () => deleteTodo(todo.id));

    li.appendChild(deleteBtn);
    todosList.appendChild(li);
  });

  textInput.value = savedText;
}

function deleteTodo(id) {
  fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (response.status === 404) {
        showError("Задача не найдена");
        return;
      }
      return fetchTodos();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        showError("Нет интернета. Повторите позже.");
      } else {
        showError(`Ошибка: ${error.message}`);
      }
    });
}

function addTodo(text, isUnreliable = false) {
  showLoading();
  addButton.disabled = true;

  const URL = isUnreliable ? API_URL_UNRELIABLE : API_URL;

  return fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  })
    .then((response) => {
      if (response.status === 400) {
        return response.json().then((data) => {
          throw new Error(data.error || "Неверные данные");
        });
      }

      if (response.status === 500) {
        throw new Error("Сервер не смог сохранить задачу");
      }

      if (!response.ok) {
        throw new Error("Ошибка при добавлении задачи");
      }

      return fetchTodos();
    })
    .catch((error) => {
      if (error.message === "Failed to fetch") {
        showError("Нет интернета. Повторите позже.");
      } else {
        showError(`Ошибка: ${error.message}`);
      }
    })
    .finally(() => {
      addButton.disabled = false;
    });
}

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = textInput.value.trim();

  if (text.length < 3) {
    showError("Задача должна содержать минимум 3 символа");
    return;
  }

  addTodo(text);
});

addUnreliableButton.addEventListener("click", (e) => {
  e.preventDefault();
  const text = textInput.value.trim();

  if (text.length < 3) {
    showError("Задача должна содержать минимум 3 символа");
    return;
  }

  addTodo(text, true);
});


fetchTodos();
