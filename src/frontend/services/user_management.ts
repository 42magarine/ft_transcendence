document.addEventListener("DOMContentLoaded", function () {
    const createForm = document.getElementById("create-form") as HTMLFormElement;
    const readAllForm = document.getElementById("read-all") as HTMLButtonElement;
    const readOneForm = document.getElementById("read-one-form") as HTMLFormElement;
    const updateForm = document.getElementById("update-form") as HTMLFormElement;
    const deleteForm = document.getElementById("delete-form") as HTMLFormElement;

    createForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();
        const name = (document.getElementById("create-name") as HTMLInputElement).value;
        const username = (document.getElementById("create-username") as HTMLInputElement).value;

        const response = await fetch("/api/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username })
        });
        createForm.reset();
    });

    readAllForm.addEventListener("click", async (event: MouseEvent) => {
        event.preventDefault();

        const response = await fetch("/api/users", {
            method: "GET"
        });

        const users = await response.json();
        const list = document.getElementById("user-list") as HTMLUListElement;
        list.innerHTML = "";
        users.forEach((user: any) => {
            const li = document.createElement("li");
            li.textContent = `id: ${user.id} name: ${user.name} username: ${user.username}`;
            list.appendChild(li);
        });
    });

    readOneForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();
        const id = (document.getElementById("user-id") as HTMLInputElement).value;

        const response = await fetch(`/api/users/${id}`, {
            method: "GET"
        });

        const user = await response.json();
        const div = document.getElementById("read-result") as HTMLDivElement;
        div.textContent = `id: ${user.id} name: ${user.name} username: ${user.username}`;
        readOneForm.reset();
    });

    updateForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();
        const id = (document.getElementById("update-id") as HTMLInputElement).value;
        const name = (document.getElementById("update-name") as HTMLInputElement).value;
        const username = (document.getElementById("update-username") as HTMLInputElement).value;

        const response = await fetch(`/api/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, username })
        });
        updateForm.reset();
    });

    deleteForm.addEventListener("submit", async (event: SubmitEvent) => {
        event.preventDefault();
        const id = (document.getElementById("delete-id") as HTMLInputElement).value;

        const response = await fetch(`/api/users/${id}`, {
            method: "DELETE"
        });
        deleteForm.reset();
    });

})
