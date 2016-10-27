self.addEventListener('message', message => {
  console.log('Received: ' + message.data);
  for (let i = 0; i < 1000000000; i++) {
    if (i % 100000000 === 0) self.postMessage(i);
  }
});
