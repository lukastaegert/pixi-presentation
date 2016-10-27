window.runCode = (id, id2) => {
  eval(document.getElementById(id).textContent);
  if (id2) {
    eval(document.getElementById(id2).textContent);
  }
  return false;
};

window.measure = (prepareId, sourceId, printId) => {
  eval(document.getElementById(prepareId).textContent);
  const startTime = performance.now();
  eval(document.getElementById(sourceId).textContent);
  document.getElementById(printId).textContent += (performance.now() - startTime) + '\n';
  return false;
};
