var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var qs = require('./questionair.js');

app.set('view engine','ejs')

server.listen(8080);
// WARNING: app.listen(80) will NOT work here!

console.log("Server listening to port 8080");

//meta-data
let playerCount = 0; 
let players = [];
let replyCount = 0;
let replyAnswers = [];
let replyAnswersTemp = [];
let replyAnswersFinal = [];
let psych = [];
let score = [];
let readyList = [];
let readyCount = 0;
let gameQues = qs.questions;

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
  
    return array;
  }

app.get('/', function (req, res) {
    res.render('index');
});

io.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });

//   socket.on('my other event', function (data) {
//     console.log(data);
//   });

  socket.on('username', function(username) {
    socket.username = username;
    playerCount += 1;
    console.log("user Conected: " + username);
    players.push(username);
    io.emit('playerAdded', players);
  });

  socket.on('start', (inc) => {
    console.log("started");
    score = []
    players.forEach(el => {
        score.push({name: el, point: 0});
        readyList.push({name: el, status: false})
    })
    io.emit('started', {msg: "matchStarted", ques: gameQues[Math.floor(Math.random() * gameQues.length)] + " Answer as if you are: " + players[Math.floor(Math.random() * players.length)]});
  });

  socket.on('ansSubmit', (ans) => {
    replyCount += 1;
    // console.log(socket.username + " has answered "+ ans);
    let ann = {name: socket.username, answer: ans}
    
    if(replyAnswersTemp.length == players.length) replyAnswersTemp = []
    if(replyAnswers.length == players.length) replyAnswers = []

    replyAnswers.push(ann);
    replyAnswersTemp.push(ans)
    if(replyCount < players.length){
        console.log("in wait area");
        socket.emit('waitArea' , "you have submitted wait for others answers");
    }
    if(replyCount == players.length){
        console.log("in all answered area");
        let tmp = replyAnswersTemp;
        replyCount = 0;
        tmp = shuffle(tmp)
        io.emit('allAnswered', tmp);
    }
  });

  socket.on('ansSubmitFinal', (ans) => {
    // console.log(socket.username + " has answered "+ ans);
    replyCount += 1;
    let ann = {name: socket.username, answer: ans}

    if(replyAnswersTemp.length == players.length) replyAnswersTemp = []
    if(psych.length == players.length) psych = []
    if(replyAnswersFinal.length == players.length) replyAnswersFinal = []
    
    replyAnswers.forEach(el => {
        if (ans == el.answer){
            let p = {victim: socket.username, pysche: el.name}
            psych.push(p);
        }
    })

    replyAnswersFinal.push(ann);
    replyAnswersTemp.push(ans);
    if(replyCount < players.length){
        console.log("in wait area");
        replyAnswersTemp = [];
        socket.emit('waitArea' , "you have submitted wait for others answers");
    }
    if(replyCount == players.length){
        console.log(replyAnswers, replyAnswersFinal);
        console.log("in all answered area");
        score.forEach((player, i) => {
            psych.forEach(el => {
                if(el.pysche == player.name) score[i].point += 1;
            });
        });
        replyCount = 0;
        replyAnswersTemp = [];
        replyAnswersFinal = [];
        replyAnswers = [];
        let psy = psych;
        pysch = [];
        io.emit('allAnsweredFinal', {psychList: psy, scorebd: score});
    }
  });

  socket.on('ready', (user) => {
    // replyCount = 0;
    
    // if(readyList.length == players.length) readyList = []
    readyList.forEach((el, i) => {
        if(el.name == socket.username) readyList[i].status = true;
    })
    readyCount += 1;
    if(readyCount < players.length){
        io.emit('readyWait', readyList);
    }
    if(readyCount == players.length){
        readyList = [];
        readyCount = 0;
        players.forEach(el => {
            readyList.push({name: el, status: false})
        });
        io.emit('startRound', {ques: gameQues[Math.floor(Math.random() * gameQues.length)] + " Answer as if you are: " + players[Math.floor(Math.random() * players.length)]});
    }
  });

  socket.on('disconnect', function(){
    console.log('user disconnected');
    playerCount -= 1;
    const index = players.indexOf(socket.username);
    if (index > -1) {
        players.splice(index, 1);
    }
    // players.pop(socket.username);
    io.emit('playerAdded', players);
  });

});