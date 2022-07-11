let toggleThemeButton = document.querySelector("#toggle-theme");
toggleThemeButton.onclick = () => {
    if(document.body.classList.contains("light-theme")) {
        document.body.classList.remove("light-theme");
    }

    else {
        document.body.classList.add("light-theme");
    }
}