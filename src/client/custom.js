window.runCode = (id, id2) => {
  eval(document.getElementById(id).textContent);
  if (id2) {
    eval(document.getElementById(id2).textContent);
  }
  return false;
};
