// === Add listeners that fire when a slide identified by data-slidename="<slideName>" enters or leaves view
var addSlideListener = (function() {
  var listenedSlides = [];

  function onSlideChanged() {
    var slideName = Reveal.getCurrentSlide().dataset.slidename;
    listenedSlides.forEach(function(slide) {
      if (slide.entered && slide.name !== slideName) {
        slide.entered = false;
        slide.onLeave && slide.onLeave();
      }
    });
    listenedSlides.forEach(function(slide) {
      if (slide.name === slideName) {
        slide.entered = true;
        slide.onEnter && slide.onEnter();
      }
    });
  }

  function onReady() {
    Reveal.addEventListener('slidechanged', onSlideChanged);
    onSlideChanged();
  }

  function waitForReady() {
    if (Reveal.isReady()) {
      return onReady();
    }
    setTimeout(waitForReady, 0);
  }

  waitForReady();

  return function(slideName, onEnter, onLeave) {
    listenedSlides.push({name: slideName, onEnter: onEnter, onLeave: onLeave});
  }
}());

// === Special listener for slides containing Pixi canvas elements with resize detection
function initPixiSlide(slideName, onGetRunCodeHook, onEnterSlide, onTeardown, onResize) {
  var renderer;
  var origRequestAnimationFrame;
  var isActive = false;
  var hasBecomeInactive = false;
  var requestReactivate = false;

  function requestUpdateCanvasSize() {
    console.log('request update size')
    window.requestAnimationFrame(function() {
      console.log('update size')
      onResize && onResize();
      renderer && renderer.resize(renderer.view.clientWidth, renderer.view.clientHeight);
    });
  }

  function onEnter() {
    origRequestAnimationFrame = window.requestAnimationFrame;
    isActive = true;
    console.log('replace RAF')
    window.requestAnimationFrame = function() {
      if (isActive) {
        origRequestAnimationFrame.apply(this, arguments);
      } else {
        console.log('inactive frame')
        if (!hasBecomeInactive) {
          hasBecomeInactive = true;
          origRequestAnimationFrame(function() {
            hasBecomeInactive = false;
            if (requestReactivate) {
              console.log('reactivate frame')
              isActive = true;
              requestReactivate();
              requestReactivate = false;
            } else {
              console.log('restore RAF')
              window.requestAnimationFrame = origRequestAnimationFrame;
            }
          });
        }
      }
    };
    onEnterSlide && onEnterSlide();
  }

  function onLeave() {
    onTeardown && onTeardown();
    isActive = false;
    requestReactivate = false;
  }

  function runCode(onRunCode) {
    console.log('actually running code')
    var origAutoDetectRenderer = PIXI.autoDetectRenderer;
    PIXI.autoDetectRenderer = function() {
      renderer = origAutoDetectRenderer.apply(this, arguments);
      return renderer;
    };

    onRunCode();

    PIXI.autoDetectRenderer = origAutoDetectRenderer;
    requestUpdateCanvasSize();
  }

  function requestRunCode(onRunCode) {
    console.log('request run code')
    isActive = false;
    requestReactivate = function() {
      console.log('run reactivated code')
      runCode(onRunCode)
    };
    window.requestAnimationFrame(function() {});
  }

  onGetRunCodeHook(requestRunCode);
  addSlideListener(slideName, onEnter, onLeave);
}

// === Structure slide
(function() {
  var SLIDE_NAME = 'structure';

  function onGetRunCodeHook(runCodeHook) {
    console.log('set window.runCode')
    window.runCode = function() {
      console.log('running code')
      var commands = Array.prototype.slice.call(arguments).map(function(id) {return document.getElementById(id).textContent});
      runCodeHook(function() {eval(commands.join(';'));});
      return false;
    };
  }

  function onEnter() {
  }

  function onTeardown() {
  }

  function onResize() {
  }

  initPixiSlide(SLIDE_NAME, onGetRunCodeHook, onEnter, onTeardown, onResize);
}());

// === Initial presentation
(function() {
  var SLIDE_NAME = 'intro';
  var runCode;
  var canvas, renderer, stage, backgroundContainer, logoContainer;
  var cats;
  var isLogoRotating;

  function onGetRunCodeHook(runCodeHook) {
    runCode = runCodeHook;
  }

  function onRunCode() {
    var MAX_CATS = 1000;
    canvas = document.getElementById('canvas-' + SLIDE_NAME);
    isLogoRotating = false;
    cats = [];

    renderer = new PIXI.autoDetectRenderer(canvas.clientWidth, canvas.clientHeight, {
      transparent: true,
      autoResize: false,
      view: canvas
    });

    stage = new PIXI.Container();
    backgroundContainer = new PIXI.Container();
    stage.addChild(backgroundContainer);

    var catContainer = new PIXI.Container();
    stage.addChild(catContainer);

    logoContainer = new PIXI.Container();
    stage.addChild(logoContainer);

    var loader = new PIXI.loaders.Loader()
      .add('img/pixi-logo.png')
      .add('img/cats.json')
      .add('img/tng.png')
      .once('complete', setupBackground)
      .once('complete', setupPixiLogo)
      .once('complete', performAnimationLoop)
      .load();

    function setupBackground() {
      var tngLogo = createTNGLogo();
      createTextAboveLogo(tngLogo);
    }

    function createTNGLogo() {
      var tngLogo = PIXI.Sprite.fromFrame('img/tng.png');
      tngLogo.scale.set(0.5, 0.5);
      tngLogo.position.set(-tngLogo.width / 2, -tngLogo.height - 10);
      backgroundContainer.addChild(tngLogo);
      return tngLogo;
    }

    function createTextAboveLogo(tngLogo) {
      var text = new PIXI.Text(
        'Lukas Taegert', {font: '24px Arial', fill: 0x101010, align: 'center'}
      );
      text.anchor.set(0.5, 1);
      text.position.set(0, -tngLogo.height - 28);
      // using double resolution provides better rendered text when it is not perfectly aligned
      text.resolution = 2;
      backgroundContainer.addChild(text);
    }

    var currentCatSpriteIndex = 0;

    function addCats(numberOfCats) {
      for (var i = 0; i < numberOfCats; i++) {
        var sprite = PIXI.Sprite.fromFrame(String(currentCatSpriteIndex));
        resetCatSprite(sprite);
        cats.push({sprite: sprite, speed: 1 + Math.random() * 4});
        currentCatSpriteIndex = (currentCatSpriteIndex + 1) % 9;
        catContainer.addChild(sprite);
      }
    }

    function setupPixiLogo() {
      createLogoSprite();
      var title = createSubtitle();

      logoContainer.on('mouseover', function() {
        var colorMatrix = new PIXI.filters.ColorMatrixFilter();
        colorMatrix.greyscale(0.5);

        logoContainer.filters = [colorMatrix];
      });

      logoContainer.on('mouseout', function() {
        logoContainer.filters = null;
      });

      logoContainer.on('click', function() {
        if (!isLogoRotating) {
          isLogoRotating = true;
          logoContainer.removeChild(title);
        } else {
          console.log('cats.length', cats.length)
          console.log('add', Math.min(Math.max(cats.length, 1), MAX_CATS - cats.length))
          addCats(Math.min(Math.max(cats.length, 1), MAX_CATS - cats.length));
        }
      });
    }

    function createSubtitle() {
      var title = new PIXI.Text('denn Dein Canvas will mehr…', {font: '48px Arial', fill: 0x101010, align: 'center'});
      title.anchor.set(0.5, 0);
      title.resolution = 2;
      title.position.y = 80;
      logoContainer.addChild(title);
      return title;
    }

    function createLogoSprite() {
      var logoSprite = PIXI.Sprite.fromFrame('img/pixi-logo.png');
      logoSprite.position.set(-logoSprite.width / 2, -logoSprite.height / 2);
      logoContainer.addChild(logoSprite);
      // without this flag, mouse events will not be passed to this container
      logoContainer.interactive = true;
    }

    function resetCatSprite(sprite) {
      sprite.position.x = -sprite.width;
      sprite.position.y = -sprite.height / 2 + Math.random() * canvas.clientHeight;
    }

    function updateStage() {
      if (isLogoRotating) {
        logoContainer.rotation += 0.01;
      }
      cats.forEach(function(cat) {
        cat.sprite.position.x += cat.speed;
        if (cat.sprite.position.x >= canvas.clientWidth) {
          resetCatSprite(cat.sprite);
        }
      });
    }

    function performAnimationLoop() {
      updateStage();
      renderer.render(stage);
      window.requestAnimationFrame(performAnimationLoop);
    }
  }

  function onEnter() {
    runCode && runCode(onRunCode);
  }

  function onTeardown() {
  }

  function onResize() {
    logoContainer.position.set(canvas.clientWidth / 2, canvas.clientHeight / 2);
    backgroundContainer.position.set(canvas.clientWidth / 2, canvas.clientHeight);
  }

  initPixiSlide(SLIDE_NAME, onGetRunCodeHook, onEnter, onTeardown, onResize);
}());

