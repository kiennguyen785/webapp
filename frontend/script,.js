function register() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    localStorage.setItem("user", user);
    localStorage.setItem("pass", pass);

    alert("Đăng ký thành công!");
    window.location.href = "login.html";
}

function login() {
    let user = document.getElementById("username").value;
    let pass = document.getElementById("password").value;

    let savedUser = localStorage.getItem("user");
    let savedPass = localStorage.getItem("pass");

    if(user === savedUser && pass === savedPass){
        window.location.href = "home.html";
    } else {
        alert("Sai thông tin!");
    }
}

function logout(){
    window.location.href = "login.html";
}