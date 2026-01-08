const socket = io();
let locked = false;
let countdown;

const username = sessionStorage.getItem("username") || "Guest";
socket.emit("registerUser", username);

socket.on("newQuestion", (data) => {
  locked = false;
  clearInterval(countdown);

  const { question, time } = data;

  const photo1 = document.getElementById("photo1");
  const photo2 = document.getElementById("photo2");
  photo1.src = question.image1;
  photo2.src = question.image2;
  photo2.style.display = "none";
  document.getElementById("timeText").innerText = time;

  const optionsDiv = document.getElementById("options");
  optionsDiv.innerHTML = "";

  if (!question.options || question.options.length === 0) return;

  const shuffledOptions = [...question.options];

  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [
      shuffledOptions[j],
      shuffledOptions[i],
    ];
  }

  shuffledOptions.forEach((opt) => {
    const btn = document.createElement("button");
    btn.innerText = opt;

    btn.dataset.correct = opt === question.answer;

    btn.onclick = () => {
      if (locked) return;
      locked = true;
      photo2.style.display = "block";

      socket.emit("submitAnswer", opt);

      if (btn.dataset.correct === "true") {
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong");

        // reveal correct answer
        document.querySelectorAll("#options button").forEach((b) => {
          if (b.dataset.correct === "true") {
            b.classList.add("reveal-correct");
          }
        });
      }
    };

    optionsDiv.appendChild(btn);
  });

  startCountdown(time);
});

function startCountdown(time) {
  countdown = setInterval(() => {
    time--;
    document.getElementById("timeText").innerText = time;
    if (time <= 0) clearInterval(countdown);
  }, 1000);
}

// function disableButtons() {
//   document
//     .querySelectorAll("#options button")
//     .forEach(btn => (btn.disabled = true));
// }

socket.on("quizEnd", (scores) => {
  console.log("Received scores:", scores);
  sessionStorage.setItem("quizResults", JSON.stringify(scores));

  alert("Quiz Finished!");
  window.location.href = "/results.html";
});
