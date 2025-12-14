const API = "http://localhost:3000";
let currentUser = null;

const loginModal = document.getElementById("loginModal");
const loginBtn = document.getElementById("loginBtn");
const main = document.getElementById("main");

const spinSound = new Audio("sounds/spineffect.mp3");
const winSound = new Audio("sounds/win.mp3");

loginBtn.onclick = async () => {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Ingresa tu nombre");

  localStorage.setItem("currentUserName", name);

  const res = await fetch(`${API}/user`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  currentUser = await res.json();

  loginModal.style.display = "none";
  main.style.display = "block";

  document.getElementById("welcome").textContent = `Hola ${name}`;
  document.getElementById("chancesCount").textContent = currentUser.spins_left;
  loadUserTasks();
};

document.getElementById("spinBtn").onclick = async () => {
  if (!currentUser) return;

  const res = await fetch(`${API}/spin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: currentUser.name })
  });

  const data = await res.json();
  if (!data.reward) {
    document.getElementById("result").textContent = data.message || "No hay tiradas disponibles.";
    return;
  }

  currentUser.spins_left = data.spins_left;
  document.getElementById("chancesCount").textContent = currentUser.spins_left;

  const prizes = {
    regalo: "img/regalo.png",
    raspa: "img/raspar.png",
    pito: "img/pito.png"
  };

  const reels = [
    document.getElementById("reel1").querySelector(".reel-inner"),
    document.getElementById("reel2").querySelector(".reel-inner"),
    document.getElementById("reel3").querySelector(".reel-inner")
  ];

  //document.getElementById("result").textContent = "Girando";

  const keys = Object.keys(prizes);
  reels.forEach(reel => {
    reel.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const img = document.createElement("img");
      img.src = prizes[randomKey];
      reel.appendChild(img);
    }
  });

  const spinDuration = 2000;
  const start = performance.now();

  function animate(now) {
    const elapsed = now - start;
    const distance = (elapsed * 6) % (80 * 10);
    reels.forEach(reel => {
      reel.style.transform = `translateY(${-distance}px)`;
    });

    if (elapsed < spinDuration) {
      requestAnimationFrame(animate);
    } else {
      stopReels();
    }
  }

  spinSound.currentTime = 0;
  spinSound.play();

  requestAnimationFrame(animate);

  function stopReels() {
    reels.forEach((reel, index) => {
      setTimeout(() => {
        reel.style.transition = "none";
        reel.style.transform = "translateY(0)";
        reel.innerHTML = "";

        for (let i = 0; i < 3; i++) {
          const finalImg = document.createElement("img");
          finalImg.src = prizes[data.reward.code];
          finalImg.style.width = "100%";
          finalImg.style.height = "80px";
          reel.appendChild(finalImg);
        }
      }, index * 300);
    });

    if (data.reward.code === "raspa") {
      const currentUser = localStorage.getItem("currentUserName");
      const chancesKey = `raspaChances_${currentUser}`;
      let chances = parseInt(localStorage.getItem(chancesKey)) || 0;
      localStorage.setItem(chancesKey, chances + 1);
      openScratchPage();
    }

    setTimeout(() => {
      spinSound.pause();
      spinSound.currentTime = 0;
      winSound.play();
      document.getElementById("result").textContent = `¡Ganaste ${data.reward.name}!`;

      if (data.reward.code === "raspa") {
        openScratchPage();
      }
    }, 1000);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  const prizes = {
    regalo: "img/regalo.png",
    raspa: "img/raspar.png",
    pito: "img/pito.png"
  };

  const reels = [
    document.getElementById("reel1").querySelector(".reel-inner"),
    document.getElementById("reel2").querySelector(".reel-inner"),
    document.getElementById("reel3").querySelector(".reel-inner")
  ];

  const keys = Object.keys(prizes);
  reels.forEach(reel => {
    const img = document.createElement("img");
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    img.src = prizes[randomKey];
    reel.appendChild(img);
  });
});

function openScratchPage() {
  window.open("raspado.html", "_blank");
}

const taskModal = document.getElementById("taskModal");
const closeTaskModal = document.getElementById("closeTaskModal");
const taskButtons = document.querySelectorAll(".task-btn");
const taskMessage = document.getElementById("taskMessage");

const today = new Date().toISOString().split("T")[0];

function getTaskKey() {
  const userName = localStorage.getItem("currentUserName") || "anon";
  return `tasksCompleted_${userName}_${today}`;
}

let completedTasks = [false, false, false];

function updateTaskUI() {
  completedTasks.forEach((done, i) => {
    const btn = taskButtons[i];
    if (done) {
      btn.disabled = true;
      btn.style.opacity = 0.6;
    } else {
      btn.disabled = false;
      btn.style.opacity = 1;
    }
  });
}

function loadUserTasks() {
  const taskKey = getTaskKey();
  completedTasks = JSON.parse(localStorage.getItem(taskKey)) || [false, false, false];
  if (!localStorage.getItem(taskKey)) {
    localStorage.setItem(taskKey, JSON.stringify(completedTasks));
  }
  updateTaskUI();
}

document.getElementById("taskBtn").onclick = () => {
  taskModal.style.display = "flex";
  updateTaskUI();
  taskMessage.textContent = "";
};

taskButtons.forEach((btn, i) => {
  btn.addEventListener("click", async () => {
    if (!completedTasks[i]) {
      completedTasks[i] = true;
      localStorage.setItem(getTaskKey(), JSON.stringify(completedTasks));

      const res = await fetch(`${API}/add_spin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: currentUser.name })
      });
      const data = await res.json();

      if (data.spins_left !== undefined) {
        currentUser.spins_left = data.spins_left;
        document.getElementById("chancesCount").textContent = currentUser.spins_left;
      }

      btn.disabled = true;
      btn.style.opacity = 0.6;
      taskMessage.textContent = "¡Has ganado +1 tirada!";
    }
  });
});

closeTaskModal.onclick = () => {
  taskModal.style.display = "none";
};