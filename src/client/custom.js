window.runCode = id => {
  eval(document.getElementById(id).textContent);
  return false;
};
