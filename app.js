let db;

// ======================
// BANCO
// ======================
const request = indexedDB.open("MiniMailDB", 1);

request.onupgradeneeded = (event) => {
  db = event.target.result;

  if (!db.objectStoreNames.contains("emails")) {
    db.createObjectStore("emails", { keyPath: "id", autoIncrement: true });
  }
};

request.onsuccess = (event) => {
  db = event.target.result;
  console.log("Banco carregado ✅");

  abrirSistema();
};

request.onerror = (event) => {
  console.error("Erro ao abrir banco:", event.target.error);
};

// ======================
// CENSURA
// ======================
function censurarTexto(texto) {
  const palavroes = [
    "porra", "caralho", "merda", "bosta", "cacete", "fdp", "puta"
  ];

  let textoCensurado = texto;

  palavroes.forEach(palavra => {
    const regex = new RegExp(`\\b${palavra}\\b`, "gi");
    textoCensurado = textoCensurado.replace(regex, "****");
  });

  return textoCensurado;
}

// ======================
// USUÁRIO
// ======================
function getUsuario() {
  const usuario = localStorage.getItem("usuarioLogado");

  if (usuario) {
    verificarPrimeiroAcesso(usuario);
  }

  return usuario;
}

function verificarPrimeiroAcesso(usuario) {
  if (!db) return;

  const jaEntrou = localStorage.getItem("user_" + usuario);

  if (!jaEntrou) {
    criarEmailBoasVindas(usuario);
    localStorage.setItem("user_" + usuario, "true");
  }
}

function criarEmailBoasVindas(usuario) {
  if (!db) return;

  const tx = db.transaction("emails", "readwrite");
  const store = tx.objectStore("emails");

  store.add({
    de: "zapmail@oficial.com",
    para: usuario,
    titulo: "Bem-vindo!",
    conteudo: `Olá ${usuario}, bem-vindo ao ZapMail!`
  });
}

// ======================
// MENU
// ======================
function toggleMenu() {
  const menu = document.getElementById("dropdown");
  menu.style.display = menu.style.display === "flex" ? "none" : "flex";
}

// ======================
// ABAS
// ======================
function abrirAba(nome) {
  document.querySelectorAll(".aba").forEach(el => {
    el.classList.remove("ativa");
  });

  document.getElementById(nome).classList.add("ativa");

  if (nome === "inbox") {
    carregarInbox();
  }

  const menu = document.getElementById("dropdown");
  if (menu) menu.style.display = "none";
}

// ======================
// INBOX
// ======================
function carregarInbox() {
  if (!db) return;

  const usuario = getUsuario();
  const inbox = document.getElementById("inbox");

  if (!usuario) {
    inbox.innerHTML = "<p>Faça login primeiro.</p>";
    return;
  }

  inbox.innerHTML = "";

  const tx = db.transaction("emails", "readonly");
  const store = tx.objectStore("emails");

  const req = store.getAll();

  req.onsuccess = () => {
    const emails = req.result;

    const filtrados = emails.filter(
      e => e.para === usuario
    );

    if (filtrados.length === 0) {
      inbox.innerHTML = "<p>Nenhum email pra você ainda...</p>";
      return;
    }

    filtrados.reverse().forEach(email => {
      const div = document.createElement("div");
      div.className = "email-item";

      div.innerHTML = `
        <strong>${email.titulo}</strong>
        <p style="font-size:12px;color:gray;">De: ${email.de}</p>
        <p style="font-size:12px;color:gray;">Para: ${email.para}</p>
      `;

      div.onclick = () => abrirEmail(email);
      inbox.appendChild(div);
    });
  };
}

// ======================
// ABRIR EMAIL
// ======================
function abrirEmail(email) {
  const view = document.getElementById("view");

  view.innerHTML = `
    <h2>${email.titulo}</h2>
    <p><strong>De:</strong> ${email.de}</p>
    <p><strong>Para:</strong> ${email.para}</p>
    <hr>
    <p>${email.conteudo}</p>
    <button onclick="deletarEmail(${email.id})">Excluir</button>
  `;

  abrirAba("view");
}

// ======================
// ENVIAR
// ======================
function enviarEmail() {
  if (!db) {
    alert("Banco ainda não carregou");
    return;
  }

  const de = getUsuario();

  if (!de) {
    alert("Você precisa estar logado.");
    abrirAba("login");
    return;
  }

  let para = document.getElementById("para").value.trim().toLowerCase();
  const titulo = document.getElementById("titulo").value.trim();
  let conteudo = document.getElementById("conteudo").value.trim();

  if (!para || !titulo || !conteudo) {
    alert("Preenche tudo direito.");
    return;
  }

  conteudo = censurarTexto(conteudo);

  const tx = db.transaction("emails", "readwrite");
  const store = tx.objectStore("emails");

  store.add({ de, para, titulo, conteudo });

  tx.oncomplete = () => {
    document.getElementById("para").value = "";
    document.getElementById("titulo").value = "";
    document.getElementById("conteudo").value = "";

    abrirAba("inbox");
  };
}

// ======================
// DELETAR
// ======================
function deletarEmail(id) {
  const tx = db.transaction("emails", "readwrite");
  const store = tx.objectStore("emails");

  store.delete(id);

  tx.oncomplete = () => {
    abrirAba("inbox");
  };
}

// ======================
// LOGIN
// ======================
function fazerLogin() {
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();

  if (!email) {
    alert("Digite um email.");
    return;
  }

  localStorage.setItem("usuarioLogado", email);
  abrirSistema();
}

function abrirSistema() {
  const usuario = localStorage.getItem("usuarioLogado");

  if (!usuario) {
    abrirAba("login");
  } else {
    abrirAba("inbox");
  }
}

// ======================
// LOGOUT (extra útil)
// ======================
function logout() {
  localStorage.removeItem("usuarioLogado");
  abrirAba("login");
}