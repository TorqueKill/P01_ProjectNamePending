const express = require("express");

// creating supabase client
const { createClient } = require('@supabase/supabase-js');
const userAuth = require('./userAuth');

const supabaseUrl = 'https://wikvasjknjglndxhtjnk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpa3Zhc2prbmpnbG5keGh0am5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDE2MjA1MTUsImV4cCI6MjAxNzE5NjUxNX0.L6-OCZNNI0d6xE0bbwsjvX5KPvzv-RdVagKF-QZO7ss';
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

app.use('/auth', userAuth(supabase));

const http = require("http");
const server = http.createServer(app);
const Server = require("socket.io").Server;

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

//quiz is defined as an array of objects with the following properties: question, answer, choices
//quiz = [{question: "question", answer: "answer", choices: ["choice1", "choice2", "choice3", "choice4"]}, ...]]

//rooms = [{roomid: "roomid", users: [socketid, socketid, socketid...], host: socketid, quiz: quiz, answers:[], gameStarted: false, sessionLoaded: [], scores: [], maxPlayers: MIN_PLAYERS_PER_LOBBY, usersNames: [name, name, name...]}]}]
let rooms = [];

//users = [{socketid: socketid, name: name, roomid: roomid}]
let users = [];

const MAX_PLAYERS_PER_LOBBY = 10;
const MIN_PLAYERS_PER_LOBBY = 2;
const TIME_PER_QUESTION = 60; //seconds

//<-------------------------SERVER FUNCTIONS------------------------->

//TODO LATER: add error handling for all functions
function getRoom(roomid) {
  return rooms.find((room) => room.roomid === roomid);
}

function getRoomIndex(roomid) {
  return rooms.findIndex((room) => room.roomid === roomid);
}

function addUserToRoom(roomid, socketid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      room.users.push(socketid);
    } else {
      rooms.push({
        roomid: roomid,
        users: [socketid],
        host: socketid,
        quiz: [],
        answers: {},
        gameStarted: false,
        sessionLoaded: [],
        scores: [],
        maxPlayers: MIN_PLAYERS_PER_LOBBY,
        usersNames: [],
      });
    }
  } catch (e) {
    console.log(e);
  }
}

function getPlayerNum(roomid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      if (room.host) {
        return room.users.length - 1;
      } else {
        return room.users.length;
      }
    } else {
      return 0;
    }
  } catch (e) {
    console.log(e);
  }
}

function setScores(roomid, scores) {
  let room = getRoom(roomid);
  if (room) {
    room.scores = scores;
  }
}

function removeUserFromRoom(roomid, socketid) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let index = room.users.findIndex((id) => id === socketid);
      if (index !== -1) {
        room.users.splice(index, 1);
      }
    }
  } catch (e) {
    console.log(e);
  }
}

function removeRoom(roomid) {
  try {
    let index = getRoomIndex(roomid);
    if (index !== -1) {
      rooms.splice(index, 1);
    }
  } catch (e) {
    console.log(e);
  }
}

//make sure id is unique
function makeid(length) {
  let unique = false;
  let result = "";
  let characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  while (!unique) {
    for (let i = 0; i < length; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    unique = !rooms.find((room) => room.roomid === result);
  }
  return result;
}

function getRoomQuiz(roomid) {
  let room = getRoom(roomid);
  if (room) {
    return room.quiz;
  } else {
    return null;
  }
}

function setRoomQuiz(roomid, quiz) {
  let room = getRoom(roomid);
  if (room) {
    room.quiz = quiz;
  }
}

function setRoomMaxPlayers(roomid, maxPlayers) {
  let room = getRoom(roomid);
  if (room) {
    room.maxPlayers = maxPlayers;
  }
}

function getRoomMaxPlayers(roomid) {
  let room = getRoom(roomid);
  if (room) {
    return room.maxPlayers;
  } else {
    return MIN_PLAYERS_PER_LOBBY;
  }
}

function makeDummyStringList(length) {
  let result = [];
  for (let i = 0; i < length; i++) {
    result.push("");
  }
  return result;
}

function handleAnswer(roomid, socketid, answer, questionIndex) {
  try {
    let room = getRoom(roomid);
    let choicesIdx = answer;

    if (room) {
      if (!room.answers[socketid]) {
        room.answers[socketid] = makeDummyStringList(room.quiz.length);
      }
      let answer = room?.quiz[questionIndex]?.choices[choicesIdx];

      //if answer is undefined, set answer to a default value
      if (!answer) {
        // answer = room.quiz[questionIndex].choices[0];
        answer = "default_value_time_ran_out";
      }

      // if answerIndex -1 then that means time ran out for that user
      // so answer is set to emtpy string

      // if (answerIndex === -1) {
      //   answer = 'default_value_time_ran_out';
      // }


      room.answers[socketid][questionIndex] = answer;
    }
  } catch (e) {
    console.log(e);
  }
}

function checkAllAnswered(roomid, questionIndex) {
  try {
    let room = getRoom(roomid);
    if (room) {
      let numAnswers = 0;
      console.log(room.answers);
      for (let key in room.answers) {
        if (room.answers[key][questionIndex]) {
          numAnswers++;
        }
      }
      if (numAnswers === room.users.length - 1) {
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log(e);
  }
}

//for each id, get the number of correct answers in the form of a list of 1s and 0s = [1, 0, 1, 1, 0, 1, 0, 1, 1, 1] where length = number of questions
function getFinalScores(roomid, socketid) {
  try {
    let room = getRoom(roomid);
    let scores = [];
    if (room) {
      if (room.answers[socketid]) {
        let quiz = room.quiz;
        let answers = room.answers[socketid];
        for (let i = 0; i < quiz.length; i++) {
          if (quiz[i].answer === answers[i]) {
            scores.push(1);
          } else {
            scores.push(0);
          }
        }
      }
    }
    return scores;
  } catch (e) {
    console.log(e);
  }
}

function setName(socketid, roomid, name) {
  let room = getRoom(roomid);
  if (room) {
    room.usersNames.push(name);
    users.push({ socketid: socketid, name: name, roomid: roomid });
  }
}

function removeName(socketid, roomid) {
  try {
    let room = getRoom(roomid);
    let _name = users.find((user) => user.socketid === socketid).name;
    if (room) {
      //find matching name in room.usersNames and remove it
      let index = room.usersNames.findIndex((name) => name === _name);
      if (index !== -1) {
        room.usersNames.splice(index, 1);
      }
    }
    //remove user from users
    let index = users.findIndex((user) => user.socketid === socketid);
    if (index !== -1) {
      users.splice(index, 1);
    }
  } catch (e) {
    console.log(e);
  }
}

function getAllNames(roomid, includeHost) {
  let room = getRoom(roomid);
  let names = [];
  if (room) {
    if (includeHost) {
      names.push(room.usersNames[0]);
    }
    for (let i = 1; i < room.usersNames.length; i++) {
      names.push(room.usersNames[i]);
    }
  }
  return names;
}

//<-------------------------SERVER EVENTS ------------------------->

server.listen(process.env.PORT || 3001, () => {
  if (process.env.PORT) {
    console.log("listening on port " + process.env.PORT);
  } else {
    console.log("listening on port 3001");
  }
});

//TODO LATER: everytime a user is connected make sure they are sent to the home screen

io.on("connection", async (socket) => {
  console.log("a user connected with id: " + socket.id);

  socket.on("disconnect", () => {
    console.log("user disconnected");

    //emit to all users in room that user left and remove user from room
    let room = rooms.find((room) => room.users.includes(socket.id));

    if (room) {
      //remove user from users
      removeName(socket.id, room.roomid);
      removeUserFromRoom(room.roomid, socket.id);

      //broadcast to all users in room that user left
      let playernum = getPlayerNum(room.roomid);
      let names = getAllNames(room.roomid, false);
      io.to(room.roomid).emit("user-left", socket.id, playernum, names);
    }
  });

  socket.on("create-room", (quiz, maxPlayers, name) => {
    // create room and add user to it, check if room already exists then create new room and remove user from old room

    //first check if host already has a room
    let host = rooms.find((room) => room.host === socket.id);

    //if host already has a room, remove host from that room
    if (host) {
      removeRoom(host.roomid);
      console.log("removed host from room: " + host.roomid);
    }

    //create new room
    let roomid = makeid(6);
    socket.join(roomid);
    addUserToRoom(roomid, socket.id);
    setRoomQuiz(roomid, quiz);
    setRoomMaxPlayers(roomid, maxPlayers);
    setName(socket.id, roomid, name);
    socket.emit("room-created", roomid);
    console.log("user created room: " + roomid);
    console.log("Quiz received, first question: " + quiz[0].question);
  });

  socket.on("join-room", (roomid, name) => {
    //check if room is full or game has started, if so emit error
    if (
      getRoom(roomid)?.gameStarted ||
      getRoom(roomid)?.users.length - 1 >= getRoomMaxPlayers(roomid)
    ) {
      socket.emit("room-full");
      return;
    }

    //check if room exists, return
    if (!getRoom(roomid)) {
      return;
    }

    setName(socket.id, roomid, name);

    //add user to room and emit to all users in room that user joined
    console.log("user joined room: " + roomid);
    socket.join(roomid);
    addUserToRoom(roomid, socket.id);

    //emit to all users in room that user joined
    let playernum = getPlayerNum(roomid);
    let names = getAllNames(roomid, false);
    io.to(roomid).emit("user-joined", socket.id, playernum, names);

    //if room is full, emit game start
    if (playernum >= getRoomMaxPlayers(roomid)) {
      rooms[getRoomIndex(roomid)].gameStarted = true;
      io.to(roomid).emit("game-start", getRoomQuiz(roomid));
    }
  });

  socket.on("session-loaded", (roomid, screenid) => {
    console.log("session loaded: " + socket.id);
    let room = getRoom(roomid);
    if (room) {
      //count number of users that have loaded session, if all users have loaded session, emit next question
      //TODO LATER: implement dictionary of users that have loaded session and it is true or false
      room.sessionLoaded.push(socket.id);
      if (room.sessionLoaded.length === room.users.length) {
        console.log("all users have loaded session: " + screenid);

        //screen = 4 is game screen
        if (screenid == 4) {
          io.to(roomid).emit("next-question", 0);
          //reset session loaded
          room.sessionLoaded = [];
        }

        if (screenid == 5) {
          io.to(roomid).emit("final-scores", room.scores);
          //reset session loaded
          room.sessionLoaded = [];
        }
      }
    }
  });

  //TODO LATER : answers must be within a certain time limit
  socket.on("handle-answer", (roomid, answer, questionIndex) => {
    console.log(
      "answer received: " + answer + " questionIndex: " + questionIndex,
      "roomid: " + roomid
    );

    if (answer === undefined || questionIndex === undefined) {
      return;
    }

    let room = getRoom(roomid);
    if (room) {
      handleAnswer(roomid, socket.id, answer, questionIndex);
    }
    //check if all players have answered, emit next question
    //if last question, emit final scores

    if (checkAllAnswered(roomid, questionIndex)) {
      let scores = [];
      if (questionIndex === getRoomQuiz(roomid).length - 1) {
        //emit final scores for each player (not host)
        for (let i = 0; i < room.users.length; i++) {
          if (room.users[i] !== room.host) {
            scores.push(getFinalScores(roomid, room.users[i]));
          }
        }

        //set scores
        setScores(roomid, scores);
        io.to(roomid).emit("game-end");
      } else {
        io.to(roomid).emit("next-question", questionIndex + 1);
      }
    }
  });
});
