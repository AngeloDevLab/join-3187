const dialog = document.getElementById("addTaskDialog");
const openBtn = document.getElementById("openAddTask");
const closeBtn = document.getElementById("closeDialog");

openBtn.addEventListener("click", () => {
  dialog.showModal();
});

closeBtn.addEventListener("click", () => {
  dialog.close();
});