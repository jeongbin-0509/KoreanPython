document.getElementById("btnRun").onclick = async () => {
  const code = document.getElementById("editor").value;

  const resp = await fetch("/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code })
  });

  const data = await resp.json();
  const out = document.getElementById("output");

  out.value = "";
  if (data.output) out.value += data.output;
  if (data.error) out.value += "\n" + data.error;
};
