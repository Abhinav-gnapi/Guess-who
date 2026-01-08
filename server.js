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

let usedPersonIds = new Set();
let currentCorrectAnswer = null;

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const dataFile = path.join(__dirname, "details.json");

function readData() {
  const data = fs.readFileSync(dataFile, "utf-8");
  return JSON.parse(data);
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function pickCorrectPerson(people) {
  const available = people.filter(p => !usedPersonIds.has(p.id));

  if (available.length === 0) {
    usedPersonIds.clear(); // reset if all used
    return people[Math.floor(Math.random() * people.length)];
  }

  return available[Math.floor(Math.random() * available.length)];
}

function generateOptions(correctPerson, people) {
  // same gender first
  let wrongOptions = people.filter(
    p => p.gender === correctPerson.gender && p.id !== correctPerson.id
  );

  // fallback if not enough
  if (wrongOptions.length < 3) {
    wrongOptions = people.filter(p => p.id !== correctPerson.id);
  }

  wrongOptions = shuffle(wrongOptions).slice(0, 3);

  return shuffle([
    correctPerson.answer,
    ...wrongOptions.map(p => p.answer)
  ]);
}


function writeData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

app.post("/details", (req, res) => {
  const { answer, image1, image2, gender } = req.body;

  if (!answer || !image1 || !image2 || !gender) {
    return res.status(400).json({ message: "Missing data" });
  }

  const data = readData();

  const newEntry = {
    id: Date.now(),
    answer,
    image1,
    image2,
    gender
  };

  data.details.push(newEntry);
  writeData(data);

  res.status(201).json({
    message: "Data saved successfully",
    data: newEntry
  });
});


// app.get("/admin/results", (req, res) => {
//   res.json(adminResults);
// });


// app.delete("/admin/results", (req, res) => {
//   adminResults = null;
//   console.log("Admin cleared all results");
//   res.json({ cleared: true });
// });


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
  usedPersonIds.clear(); // reset repetition tracking
  sendQuestion();
});


  socket.on("submitAnswer", answer => {
  if (users[socket.id] && answer === currentCorrectAnswer) {
    users[socket.id].score += 1;
  }
});


  socket.on("getResults", () => {
    if (finalResults) {
      console.log(finalResults);
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
  const people = data.details;

  if (people.length < 2) {
    console.error("At least 4 entries required");
    return;
  }

  if (usedPersonIds.size >= people.length) {
  console.log(users);
  console.log(finalResults);
  finalResults = users;
  console.log(finalResults);

  // adminResults = {
  //   results: users,
  //   endedAt: new Date()
  // };

  io.emit("quizEnd", users);
  return;
}


  const correctPerson = pickCorrectPerson(people);
  usedPersonIds.add(correctPerson.id);

  currentCorrectAnswer = correctPerson.answer; // ✅ STORE

  const options = generateOptions(correctPerson, people);

  io.emit("newQuestion", {
    question: {
      image1: correctPerson.image1,
      image2: correctPerson.image2,
      options,
      answer: correctPerson.answer
    },
    time: 15
  });

  clearTimeout(timer);
  timer = setTimeout(sendQuestion, 15000);
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
