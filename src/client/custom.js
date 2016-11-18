// === Reconfigure PIXI to enable hooking into autoDetectRenderer
(function() {
  var newPixi = {};
  var propertyDescriptors = Object.getOwnPropertyDescriptors(PIXI);
  Object.keys(propertyDescriptors)
    .filter(function(prop) {return prop !== 'autoDetectRenderer';})
    .forEach(function(prop) {
      Object.defineProperty(newPixi, prop, propertyDescriptors[prop]);
    });
  newPixi.autoDetectRenderer = PIXI.autoDetectRenderer;
  window.PIXI = newPixi;
}());

// === Enable stopping running animation loops
var animFrameActive = true;
var requestRunAfterAnimFrameReset = null;

(function() {
  var origRequestAnimationFrame = window.requestAnimationFrame;
  var animFrameHasBecomeInactive = false;

  window.requestAnimationFrame = function() {
    if (animFrameActive) {
      origRequestAnimationFrame.apply(this, arguments);
    } else {
      if (!animFrameHasBecomeInactive) {
        animFrameHasBecomeInactive = true;
        origRequestAnimationFrame(function() {
          animFrameHasBecomeInactive = false;
          animFrameActive = true;
          if (requestRunAfterAnimFrameReset) {
            requestRunAfterAnimFrameReset();
            requestRunAfterAnimFrameReset = null;
          }
        });
      }
    }
  };
}());

function restartAnimationFrames() {
  animFrameActive = false;
  window.requestAnimationFrame(function() {});
}

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

// === Special listener for slides containing Pixi canvas elements
function initPixiSlide(slideName, onGetRunCodeHook, onEnterSlide, onResize) {
  var renderer;
  var lastRenderTarget = null;

  function requestUpdateCanvasSize() {
    window.requestAnimationFrame(function() {
      onResize && onResize();
      renderer && renderer.resize(renderer.view.clientWidth, renderer.view.clientHeight);
    });
  }

  function onEnter() {
    onGetRunCodeHook(requestRunCode);
    onEnterSlide && onEnterSlide();
  }

  function onLeave() {
    restartAnimationFrames();
    recreateCanvas();
  }

  function recreateCanvas() {
    if (renderer) {
      // To work around a bug when Graphics objects are only rendererd once
      if (lastRenderTarget) {
        renderer.render(lastRenderTarget);
      }
      renderer.destroy();
      renderer = null;
      lastRenderTarget = null;
    }
    var oldCanvas = document.getElementById('canvas-' + slideName);
    var canvasParent = oldCanvas.parentNode;
    var newCanvas = document.createElement('canvas');
    newCanvas.id = oldCanvas.id;
    newCanvas.style.width = '100%';
    newCanvas.style.height = '100%';
    canvasParent.removeChild(oldCanvas);
    canvasParent.appendChild(newCanvas);
  }

  function runCode(onRunCode) {
    recreateCanvas();
    var origAutoDetectRenderer = PIXI.autoDetectRenderer;
    PIXI.autoDetectRenderer = function() {
      renderer = origAutoDetectRenderer.apply(this, arguments);
      var origRender = renderer.render;
      renderer.render = function() {
        lastRenderTarget = arguments[0];
        origRender.apply(this, arguments);
      };
      return renderer;
    };

    onRunCode();

    PIXI.autoDetectRenderer = origAutoDetectRenderer;
    requestUpdateCanvasSize();
  }

  function requestRunCode(onRunCode) {
    requestRunAfterAnimFrameReset = function() {
      runCode(onRunCode)
    };
    restartAnimationFrames();
  }

  addSlideListener(slideName, onEnter, onLeave);
}

// === Run editable code
function initEditSlide(slideName) {
  function onGetRunCodeHook(runCodeHook) {
    window.runCode = function() {
      var commands = Array.prototype.slice.call(arguments).map(function(id) {return document.getElementById(id).textContent});
      runCodeHook(function() {eval(commands.join(';'));});
      return false;
    };
  }

  initPixiSlide(slideName, onGetRunCodeHook);
}

initEditSlide('structure');
initEditSlide('coordinates');
initEditSlide('animations');
initEditSlide('resources');
initEditSlide('interactions');

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
        'Lukas Taegert', {fontFamily: 'Arial', fontSize: 24, fill: 0x101010, align: 'center'}
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

      function handleClick() {
        if (!isLogoRotating) {
          isLogoRotating = true;
          logoContainer.removeChild(title);
        } else {
          addCats(Math.min(Math.max(cats.length, 1), MAX_CATS - cats.length));
        }
      }

      logoContainer.on('click', handleClick);
      logoContainer.on('touchend', handleClick);
    }

    function createSubtitle() {
      var title = new PIXI.Text('denn Dein Canvas will mehr…', {fontFamily: 'Arial', fontSize: 48, fill: 0x101010, align: 'center'});
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

  function onResize() {
    logoContainer.position.set(canvas.clientWidth / 2, canvas.clientHeight / 2);
    backgroundContainer.position.set(canvas.clientWidth / 2, canvas.clientHeight);
  }

  initPixiSlide(SLIDE_NAME, onGetRunCodeHook, onEnter, onResize);
}());

