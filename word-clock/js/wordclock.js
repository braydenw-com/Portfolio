document.addEventListener("DOMContentLoaded", handlePageLoaded);

var clockInterval;

function handlePageLoaded() {
 // window.addEventListener("mousemove", HandleMouseMove);
  clockInterval = setInterval(handelClockInterval, 1000);
  updateClock();
}

 function handelClockInterval() {
  console.log("clock interval")
}
/*
function HandleMouseMove(mouseEvent) {
  var xRatio = mouseEvent.pageX / window.innerWidth;
  var yRatio = mouseEvent.pageY / window.innerHeight;
  var hours = Math.floor(24 * xRatio);
  var minutes = Math.floor(60 * yRatio);
  var date = new Date();
  date.setHours(hours);
  date.setMinutes(minutes);

  updateClock(date);
} */

function turnWordOn(className) {
  var lettersToTurnOn = document.getElementsByClassName(className);
  var i;
  var limit = lettersToTurnOn.length;
  for (i = 0; i < limit; i++) {
    const letter = lettersToTurnOn[i];
    letter.classList.add('letterOn');
  }
}

function updateClock(date) {
  if (date == null) {
    date = new Date();
  }

  clearClock();
  turnWordOn("wordITIS")
  turnWordOn("wordINTHE")

  var hours = date.getHours();
  var minutes = date.getMinutes();
  minutes = Math.round(minutes / 10) * 10;


  if (minutes == 60) {
    minutes = 0;
  } else if (minutes == 50) {
    turnWordOn("wordPAST");
  } else if (minutes == 40) {
    turnWordOn("wordPAST");
  } else if (minutes == 30) {
    turnWordOn("wordPAST");
  } else if (minutes == 20) {
    turnWordOn("wordPAST");
  } else if (minutes == 10) {
    turnWordOn("wordPAST");
  }

  if (hours === 0 && minutes === 0) {
    clearClock();
    turnWordOn("wordITIS");
    turnWordOn("wordHours0");
    return;
  } else if (hours === 0 && minutes === 10) {
    clearClock();
    turnWordOn("wordITIS");
    turnWordOn("wordMinutes10");
    turnWordOn("wordPAST");
    turnWordOn("wordHours0");
    return;
  } else if (hours === 0 && minutes === 20) {
    clearClock();
    turnWordOn("wordITIS");
    turnWordOn("wordMinutes20");
    turnWordOn("wordPAST");
    turnWordOn("wordHours0");
    return;
  } else if (hours === 0 && minutes === 30) {
    clearClock();
    turnWordOn("wordITIS");
    turnWordOn("wordMinutes30");
    turnWordOn("wordPAST");
    turnWordOn("wordHours0");
    return;
  } else if (hours === 0 && minutes === 40) {
    clearClock();
    turnWordOn("wordITIS");
    turnWordOn("wordMinutes40");
    turnWordOn("wordPAST");
    turnWordOn("wordHours0");
    return;
  } else if (hours === 0 && minutes === 50) {
    clearClock();
    turnWordOn("wordITIS");
    turnWordOn("wordMinutes50");
    turnWordOn("wordPAST");
    turnWordOn("wordHours0");
    return;
  }
  

  var hours12;
  if (hours == 12) {
    hours12 = hours;
  } else {
    hours12 = hours % 12
  }

  turnWordOn("wordHours" + hours12);
  turnWordOn("wordHours" + hours);
  turnWordOn(getTimeOfDayWord(hours));
  turnWordOn("wordMinutes" + minutes);
  
}

function addOneToHours(hours) {
  if (hours < 23) {
    hours++;
  } else {
    hours = 0;
  }

  return hours;
}


function clearClock() {
  var lettersToTurnOn = document.getElementsByClassName("letter");
  var i;
  var limit = lettersToTurnOn.length;
  for (i = 0; i < limit; i++) {
    const letter = lettersToTurnOn[i];
    letter.classList.remove('letterOn');
  }
}

function getTimeOfDayWord(hours) {
  if (hours >= 5 && hours < 12) {
    return "wordMORNING";
  } else if (hours >= 12 && hours < 17) {
    return "wordAFTERNOON";
  } else if (hours >= 17 && hours < 21) {
    return "wordEVENING";
  } else {
    return "wordNIGHT";
  }
}