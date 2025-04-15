document.addEventListener("DOMContentLoaded", function () {
    const createForm = document.getElementById("create-form");
    const readAllForm = document.getElementById("read-all");
    const readOneForm = document.getElementById("read-one-form");
    const updateForm = document.getElementById("update-form");
    const deleteForm = document.getElementById("delete-form");
    createForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("create-name").value;
        const username = document.getElementById("create-username").value;
        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username })
        });
        createForm.reset();
    });
    readAllForm.addEventListener("click", async (event) => {
        event.preventDefault();
        const response = await fetch("/api/users", {
            method: "GET"
        });
        const users = await response.json();
        const list = document.getElementById("user-list");
        list.innerHTML = "";
        users.forEach((user) => {
            const li = document.createElement("li");
            li.textContent = `id: ${user.id} name: ${user.name} username: ${user.username}`;
            list.appendChild(li);
        });
    });
    readOneForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = document.getElementById("user-id").value;
        const response = await fetch(`/api/users/${id}`, {
            method: "GET"
        });
        const user = await response.json();
        const div = document.getElementById("read-result");
        div.textContent = `id: ${user.id} name: ${user.name} username: ${user.username}`;
        readOneForm.reset();
    });
    updateForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = document.getElementById("update-id").value;
        const name = document.getElementById("update-name").value;
        const username = document.getElementById("update-username").value;
        const response = await fetch(`/api/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username })
        });
        updateForm.reset();
    });
    deleteForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const id = document.getElementById("delete-id").value;
        const response = await fetch(`/api/users/${id}`, {
            method: "DELETE"
        });
        deleteForm.reset();
    });
});
export {};
