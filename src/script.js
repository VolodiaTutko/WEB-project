document.addEventListener("DOMContentLoaded", function() {
    const togglePassword = document.querySelector("#togglePassword");
    const password = document.querySelector("#password");
    const toggleRepeatPassword = document.querySelector("#RetogglePassword");
    const repeatPassword = document.querySelector("#Repassword");

    togglePassword.addEventListener("click", function() {
        const type = password.getAttribute("type") === "password" ? "text" : "password";
        password.setAttribute("type", type);
        this.classList.toggle("bi-eye");
    });

    toggleRepeatPassword.addEventListener("click", function() {
        const type = repeatPassword.getAttribute("type") === "password" ? "text" : "password";
        repeatPassword.setAttribute("type", type);
        this.classList.toggle("bi-eye");
    });

    const form = document.querySelector("form");

    form.addEventListener('submit', function (e) {
        e.preventDefault(); 

        const passwordValue = password.value;
        const repeatPasswordValue = repeatPassword.value;

        if (passwordValue === repeatPasswordValue) {
            form.submit();
        } else {
             alert("Пароль і повторний пароль не співпадають.");
        }
        
    });

const dropdownButton = document.getElementById("dropdown-button");
const dropdownContent = document.getElementById("dropdown-content");


});





