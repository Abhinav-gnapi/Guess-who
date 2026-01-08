let name1 = document.getElementById("name");
let gender = document.getElementById("gender");
let file1 = document.getElementById("file");
let submit = document.getElementById("submit");

submit.addEventListener("click", function (e) {
  e.preventDefault();
  Myfunction();
});

function uploadImage(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "my_upload_preset"); // your preset
  formData.append("folder", "uploads");

  return fetch("https://api.cloudinary.com/v1_1/dbompxovn/image/upload", {
    method: "POST",
    body: formData
  }).then(res => res.json());
}


function Myfunction() {
  if (!name1.value) {
    alert("Please enter the name!");
    return;
  }

  if (!gender.value) {
    alert("Please select gender!");
    return;
  }

  if (file1.files.length !== 2) {
    alert("Please select exactly 2 images!");
    return;
  }

  const imageFile1 = file1.files[0];
  const imageFile2 = file1.files[1];

  Promise.all([
    uploadImage(imageFile1),
    uploadImage(imageFile2)
  ])
    .then(([data1, data2]) => {
      const imageUrl1 = data1.secure_url;
      const imageUrl2 = data2.secure_url;

      return fetch("https://guess-who-amw8.onrender.com/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answer: name1.value,
          image1: imageUrl1,
          image2: imageUrl2,
          gender: gender.value
        })
      });
    })
    .then(res => res.json())
    .then(() => {
      alert("Person added successfully!");

      // clear form
      name1.value = "";
      gender.value = "";
      file1.value = "";
    })
    .catch(err => console.error("Error:", err));

  fetch("https://your-backend-name.onrender.com/admin/results")
  .then(res => res.json())
  .then(data => {
    console.log("Admin Results:", data);
  });

}

