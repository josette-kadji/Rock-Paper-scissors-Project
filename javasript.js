let video = document.querySelector("#player-Video");
let playerVideo;
let playerScore = 0;
let computerScore = 0;

async function init() {
   
  UI.setStatusMessage("Initializing - Please wait a moment");
  const videoPromise = UI.initPlayerVideo(config);
  const predictPromise = Prediction.init();

  Promise.all([videoPromise, predictPromise]).then((resolve) => {
    playerVideo = resolve[0];
    playerVideo.play();

    console.log("Initialization finished");

    // game is ready
    waitForPlayer();
  });
}

function waitForPlayer() {
  const isMobile = UI.mobileAndTabletCheck();

  // show a blinking start message
  if (isMobile) {
    UI.setStatusMessage("Touch the screen to start");  
  } else {
    UI.setStatusMessage("Press any key to start");
  }

  UI.startAnimateMessage();

  const startGame = () => {
    UI.stopAnimateMessage();
   
  playOneRound();
  };

  if (UI.isMobile()) {
    document.addEventListener("touchstart", startGame, { once: true });
  } else {
    window.addEventListener("keypress", startGame, { once: true });
  }
}

async function playOneRound() {
  // show robot waiting for player
  console.log("here")
  UI.showRobotImage(true);
  console.log("here")
  // hide the timer circle
  UI.showTimer(false);
  console.log("here")
  UI.setTimerProgress(0);
  UI.setPlayerHand("");
console.log("here")
  // ready - set - show
  // wait for countdown to finish
  await UI.startCountdown();

  // show the timer circle
  UI.showTimer(true);

  // start detecting player gestures
  // required duration 150ms ~ 4-5 camera frames
  detectPlayerGesture(150);
}

function detectPlayerGesture(requiredDuration) {
  let lastGesture = "";
  let gestureDuration = 0;

  const predictNonblocking = () => {
    setTimeout(() => {
      const predictionStartTS = Date.now();

      // predict gesture (require high confidence)
      Prediction.predictGesture(playerVideo, 9).then((playerGesture) => {
        if (playerGesture != "") {
          if (playerGesture == lastGesture) {
            // player keeps holding the same gesture
            // -> keep timer running
            const deltaTime = Date.now() - predictionStartTS;
            gestureDuration += deltaTime;
          } else {
            // detected a different gesture
            // -> reset timer
            UI.setPlayerHand(playerGesture);
            lastGesture = playerGesture;
            gestureDuration = 0;
          }
        } else {
          UI.setPlayerHand(false);
          lastGesture = "";
          gestureDuration = 0;
        }

        if (gestureDuration < requiredDuration) {
          // update timer and repeat
          UI.setTimerProgress(gestureDuration / requiredDuration);
          predictNonblocking();
        } else {
          // player result available
          // -> stop timer and check winner
          UI.setTimerProgress(1);
          UI.animatePlayerHand();

          // let computer make its move
          const computerGesture = getRandomGesture();

          // check the game result
          checkResult(playerGesture, computerGesture);
        }
      });
    }, 0);
  };

  predictNonblocking();
}

function checkResult(playerGesture, computerGesture) {
  let statusText;
  let playerWins = false;
  let computerWins = false;

  if (playerGesture == computerGesture) {
    // draw
    statusText = "It's a draw!";
  } else {
    // check whinner
    if (playerGesture == "rock") {
      if (computerGesture == "scissors") {
        playerWins = true;
        statusText = "Rock beats scissors";
      } else {
        computerWins = true;
        statusText = "Paper beats rock";
      }
    } else if (playerGesture == "paper") {
      if (computerGesture == "rock") {
        playerWins = true;
        statusText = "Paper beats rock";
      } else {
        computerWins = true;
        statusText = "Scissors beat paper";
      }
    } else if (playerGesture == "scissors") {
      if (computerGesture == "paper") {
        playerWins = true;
        statusText = "Scissors beat paper";
      } else {
        computerWins = true;
        statusText = "Rock beats scissors";
      }
    }
  }

  if (playerWins) {
    playerScore++;
    statusText += " - You win!";
  } else if (computerWins) {
    computerScore++;
    statusText += " - The robot wins!";
  }
  

  UI.showRobotHand(true);
  UI.setRobotGesture(computerGesture);

  UI.setStatusMessage(statusText);

  UI.setPlayerScore(playerScore);
  UI.setComputerScore(computerScore);

  // wait for 3 seconds, then start next round
  setTimeout(playOneRound, 3000);
}

function getRandomGesture() {
  const gestures = ["rock", "paper", "scissors"];
  const randomNum = Math.floor(Math.random() * gestures.length);
  return gestures[randomNum];
}
//-----


init()