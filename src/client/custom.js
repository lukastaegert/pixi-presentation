window.runCode = (...ids) => {
  eval(ids.map(id => document.getElementById(id).textContent).join(';'));
  return false;
};

window.measure = (prepareId, sourceId, printId) => {
  eval(
    (prepareId && document.getElementById(prepareId).textContent) +
    'const startTime = performance.now();' +
    document.getElementById(sourceId).textContent +
    'const time = performance.now() - startTime;' +
    'document.getElementById("' + printId + '").textContent += time + "\\n";'
  );
  return false;
};
