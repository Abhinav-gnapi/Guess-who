let name1 = document.getElementById("name");
let option1 = document.getElementById("option1");
let option2 = document.getElementById("option2");
let option3 = document.getElementById("option3");
let file1 = document.getElementById("file");
let submit = document.getElementById("submit");

submit.addEventListener("click", function (e) {
  e.preventDefault();
  Myfunction();
});

function Myfunction() {
  if (!name1.value) {
    alert("Please enter the correct answer!");
    return;
  }

  if (!option1.value || !option2.value || !option3.value) {
    alert("Please fill all options!");
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

      const options = [
        option1.value,
        option2.value,
        option3.value,
        name1.value
      ].filter((v, i, a) => a.indexOf(v) === i);

      return fetch("http://localhost:3000/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: name1.value,
          image: imageUrl,
          options
        })
      });
    })
    .then(res => res.json())
    .then(result => {
      alert("Question added successfully!");

      // Clear form
      name1.value = "";
      option1.value = "";
      option2.value = "";
      option3.value = "";
      file1.value = "";
    })
    .catch(err => console.error("Error:", err));
}
