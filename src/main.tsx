import { invoke } from "@tauri-apps/api/core";

window.addEventListener("DOMContentLoaded", async () => {
  alert(await invoke("sum", { nums: [2, 2] }));
});
