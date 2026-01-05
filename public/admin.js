let name1 = document.getElementById("name");
let genderEl = document.getElementById("gender");
let file1 = document.getElementById("file");
let submit = document.getElementById("submit");

submit.addEventListener("click", function (e) {
  e.preventDefault();
  Myfunction();
});

function Myfunction() {
  if (!name1.value) {
    alert("Please enter the name!");
    return;
  }

  if (!genderEl.value) {
    alert("Please select gender!");
    return;
  }

  if (file1.files.length === 0) {
    alert("Please select an image!");
    return;
  }

  const file = file1.files[0];

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "my_upload_preset");
  formData.append("folder", "uploads");

  fetch("https://api.cloudinary.com/v1_1/dbompxovn/image/upload", {
    method: "POST",
    body: formData
  })
    .then(res => res.json())
    .then(data => {
      const imageUrl = data.secure_url;

      return fetch("http://localhost:3000/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: name1.value,
          image: imageUrl,
          gender: genderEl.value
        })
      });
    })
    .then(res => res.json())
    .then(() => {
      alert("Person added successfully!");

      // Clear form
      name1.value = "";
      genderEl.value = "";
      file1.value = "";
    })
    .catch(err => console.error("Error:", err));
}
