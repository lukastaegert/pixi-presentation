self.addEventListener('message', function(message) {
  console.log('Received: ', message.data);
  for (var i = 0; i < 1000000000; i++) {
    if (i % 100000000 === 0) self.postMessage(i);
  }
});
