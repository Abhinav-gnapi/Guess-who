
document.addEventListener("DOMContentLoaded", fetchDetails);

function fetchDetails() {
  fetch("/details")
    .then(response => response.json())
    .then(data => displayDetails(data))
    .catch(error => console.error("Error fetching data:", error));
}

function displayDetails(details) {
  const mainDiv = document.getElementById("main");
  mainDiv.innerHTML = "";

  details.forEach(item => {
    const card = document.createElement("div");
    card.style.border = "1px solid #ccc";
    card.style.padding = "10px";
    card.style.margin = "10px";
    card.style.textAlign = "center";

    const name = document.createElement("h3");
    name.textContent = item.name;

    const img = document.createElement("img");
    img.src = item.image;
    img.style.width = "150px";
    img.style.height = "150px";
    img.style.objectFit = "cover";

    card.appendChild(img);
    card.appendChild(name);

    mainDiv.appendChild(card);
  });
}
