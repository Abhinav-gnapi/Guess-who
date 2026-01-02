const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const dataFile = path.join(__dirname, "details.json");

function readData() {
  const data = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(data);
}

function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.post("/details", (req, res) => {
  console.log("POST /details hit", req.body);
  const { answer, image, options } = req.body;

  if (!answer || !image || !options) {
    return res.status(400).json({ message: "Missing data" });
  }

  const data = readData();

  const newEntry = {
    id: Date.now(),
    answer,
    image,
    options
  };

  data.details.push(newEntry);
  writeData(data);

  res.status(201).json({
    message: "Data saved successfully",
    data: newEntry
  });
});


app.get("/details", (req, res) => {
  const data = readData();
  res.json(data.details);
});


let currentIndex = 0;
let timer = null;
let users = {};
let finalResults = null;


io.on("connection", socket => {
  console.log("Connected:", socket.id);

  socket.on("registerUser", username => {
    users[socket.id] = {
      username,
      score: 0
    };
    console.log("User registered:", username);
  });

  socket.on("startQuiz", () => {
    currentIndex = 0;
    finalResults = null;
    sendQuestion();
  });

  socket.on("submitAnswer", answer => {
    const data = readData();
    const questions = data.details;
    const q = questions[currentIndex];

    if (users[socket.id] && q && answer === q.answer) {
      users[socket.id].score += 1;
    }
  });

  socket.on("getResults", () => {
    if (finalResults) {
      socket.emit("quizResults", finalResults);
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    delete users[socket.id];
  });
});


function sendQuestion() {
  const data = readData();
  const questions = data.details;

  if (currentIndex >= questions.length) {
    finalResults = users;
    io.emit("quizEnd", users);
    return;
  }

  io.emit("newQuestion", {
    question: questions[currentIndex],
    time: 15
  });

  clearTimeout(timer);
  timer = setTimeout(() => {
    currentIndex++;
    sendQuestion();
  }, 15000);
}


app.delete("/details/:id", (req, res) => {
  const id = Number(req.params.id);
 
  const data = readData();
 
  const index = data.details.findIndex(item => item.id === id);
 
  if (index === -1) {
    return res.status(404).json({ message: "Item not found" });
  }
 
  const deletedItem = data.details.splice(index, 1);
 
  writeData(data);
 
  res.json({
    message: "Item deleted successfully",
    deleted: deletedItem[0]
  });
});


server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
