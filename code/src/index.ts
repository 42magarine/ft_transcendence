const message: string = "Hello World!";

document.addEventListener("DOMContentLoaded", () => {
    const app = document.getElementById("app");
    if (app) app.textContent = message;
    console.log(app);
});
