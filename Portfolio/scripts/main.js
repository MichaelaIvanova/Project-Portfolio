
(function () {
    var heightRefreshThreshold = 120;
    var virtualWindowHeight = 0;
    var win = window;
    var dpi = win.devicePixelRatio;
    var doc = document;
    var body = doc.body;
    var html = doc.documentElement;
    var sunSize = 100;
    var shaders = {
        vert: 'attribute vec3 position;void main(){gl_Position=vec4(position,1.0);}',
        frag: 'uniform float t;uniform float s;uniform vec2 r;uniform sampler2D i;void main(){vec2 pixel=vec2(1.0)/r;vec2 p=gl_FragCoord.xy/r;p=vec2(p.x,1.0-p.y);if(p.y>0.5){float dist=(p.y-0.5)/0.5;float w=(dist*8.5)-t*1.0;float x=(sin(w*3.0-(t*4.0))+3.0)*0.5;w-=x*0.15;w=w-floor(w);w=(floor(w*4.0)-0.4)/4.0;p.y+=w*0.35*dist*s;}gl_FragColor=texture2D(i,p);}',
    };
    shaders.frag = document.getElementById('fs').textContent;

    function getScroll() {
        return win.pageYOffset || html.scrollTop;
    }
    function documentHeight() {
        return Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    }
    function createCanvas(width, height, userDPI) {
        if (typeof userDPI == "undefined") userDPI = dpi;
        var canvas = doc.createElement('canvas');
        setAttribute('width', width * userDPI, canvas);
        setAttribute('height', height * userDPI, canvas);
        return canvas;
    }
    function drawStar(x, y, size, scale, ctx) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-size / 2, -size / 2, size, size);
        ctx.restore();
    }
    function addColorStop(pos, color, gradient) {
        gradient.addColorStop(pos, color);
    }
    function querySelector(selector) {
        return doc.querySelector(selector);
    }
    function querySelectorAll(selector) {
        var nodes = doc.querySelectorAll(selector);
        return [].slice.call(nodes);
    }
    function getContext(canvas) {
        return canvas.getContext('2d', {

        });
    }
    function getBounds(element) {
        return element.getBoundingClientRect();
    }
    function setAttribute(attr, value, element) {
        element.setAttribute(attr, value);
    }
    function setFillStyle(fill, ctx) {
        ctx.fillStyle = fill;
    }
    function random(max) {
        return Math.random() * max;
    }
    function smooth(x) {
        return x * x * (3 - 2 * x);
    }
    function repeat(times, callback) {
        for (var i = 0; i < times; i++) {
            callback(i);
        }
    }
    function forEach(array, callback) {
        for (var i = 0; i < array.length; i++) {
            callback(array[i], i);
        }
    }
    var raf = requestAnimationFrame;
    function sizeToBounds(bounds, dpi, element) {
        setAttribute('width', bounds.width * dpi, element);
        setAttribute('height', bounds.height * dpi, element);
    }


    function mountains() {
        var stopAnim = false;
        var canvases = querySelectorAll('.Scene-mountains');
        var texture = null;
        forEach(canvases, function (canvas) {
            var bounds = getBounds(canvas);
            sizeToBounds(bounds, dpi, canvas);
            var middle = {
                x: bounds.width / 2,
                y: bounds.height / 2
            }
            if (texture == null) {
                texture = createMountains();
            }
            var textureMountains = texture;
            var createdGL = createGL();
            canvas.style.opacity = 0.9999;

            function createGL() {
                var vertexShader = shaders.vert;
                var fragmentShader = shaders.frag;
                var currentProgram;
                var timeLocation;
                var sunSizeLocation;
                var resolutionLocation;
                var scrollLocation;
                var buffer;
                var gl;
                var startTime = new Date().getTime();
                var time = 0;

                if (!init()) return false;
                animate();

                function init() {
                    try {
                        gl = canvas.getContext('experimental-webgl', {
                            premultipliedAlpha: true,
                            alpha: true,
                        });
                    } catch (error) { }
                    if (!gl) {
                        return false;
                    }
                    buffer = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([- 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0]), gl.STATIC_DRAW);
                    currentProgram = createProgram(vertexShader, fragmentShader);
                    if (currentProgram == null) return false;
                    function getUniformLocation() {
                        return gl.getUniformLocation.apply(gl, arguments);
                    }
                    timeLocation = getUniformLocation(currentProgram, 't');
                    resolutionLocation = getUniformLocation(currentProgram, 'r');
                    scrollLocation = getUniformLocation(currentProgram, 's');
                    sunSizeLocation = getUniformLocation(currentProgram, 'sunSize');


                    function texParameteri() {
                        return gl.texParameteri.apply(gl, arguments);
                    }
                    var gl_TEXTURE_2D = gl.TEXTURE_2D;

                    // Create a texture.
                    var texture = gl.createTexture();
                    gl.bindTexture(gl_TEXTURE_2D, texture);

                    // Set the parameters so we can render any size image.
                    texParameteri(gl_TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                    texParameteri(gl_TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                    texParameteri(gl_TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                    texParameteri(gl_TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                    // Upload the image into the texture.
                    gl.texImage2D(gl_TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureMountains);
                    return true;
                }

                function createProgram(vertex, fragment) {
                    var program = gl.createProgram();

                    var vs = createShader(vertex, gl.VERTEX_SHADER);
                    var fs = createShader('#ifdef GL_ES\nprecision highp float;\n#endif\n\n' + fragment, gl.FRAGMENT_SHADER);
                    if (vs == null || fs == null) return null;

                    gl.attachShader(program, vs);
                    gl.attachShader(program, fs);

                    gl.deleteShader(vs);
                    gl.deleteShader(fs);

                    gl.linkProgram(program);

                    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                        // console.log( "ERROR:\n" +
                        // "VALIDATE_STATUS: " + gl.getProgramParameter( program, gl.VALIDATE_STATUS ) + "\n" +
                        // "ERROR: " + gl.getError() + "\n\n" +
                        // "- Vertex Shader -\n" + vertex + "\n\n" +
                        // "- Fragment Shader -\n" + fragment );
                        return null;
                    }
                    return program;
                }

                function createShader(src, type) {
                    var shader = gl.createShader(type);

                    gl.shaderSource(shader, src);
                    gl.compileShader(shader);

                    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                        // console.log( ( type == gl.VERTEX_SHADER ? "VERTEX" : "FRAGMENT" ) + " SHADER:\n" + gl.getShaderInfoLog( shader ) );
                        return null;
                    }
                    return shader;
                }

                function animate() {
                    var top = canvas.getAttribute('data-stop-on-scroll') == 'true';
                    var scroll = getScroll();
                    if (
                        (top && scroll < win.innerHeight) ||
                            (!top && scroll > documentHeight() - win.innerHeight - 200)
                    ) {
                        render();
                    }
                    if (!stopAnim)
                        raf(animate);
                }

                var renderedStatic = false;
                var lastS = -1;
                function render() {
                    if (!currentProgram) return;

                    var s = Math.max(0, 1 - (getScroll() / (win.innerHeight * 0.5)));
                    if (s == 0 && lastS == 0) return;
                    lastS = s;

                    time = new Date().getTime() - startTime;
                    gl.clearColor(0, 0, 0, 0);
                    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
                    gl.useProgram(currentProgram);
                    gl.uniform1f(timeLocation, time / 1000);
                    gl.uniform1f(scrollLocation, canvas.getAttribute('data-stop-on-scroll') == 'true' ? s : 0);
                    gl.uniform2f(resolutionLocation, bounds.width * dpi, bounds.height * dpi);
                    gl.uniform1f(sunSizeLocation, sunSize);

                    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

                    var vertexPosition;
                    gl.vertexAttribPointer(vertexPosition, 2, gl.FLOAT, false, 0, 0);
                    gl.enableVertexAttribArray(vertexPosition);
                    gl.drawArrays(gl.TRIANGLES, 0, 6);
                    gl.disableVertexAttribArray(vertexPosition);
                    gl.viewport(0, 0, bounds.width * dpi, bounds.height * dpi);
                }
                return true;
            }

            function createMountains() {
                var textureCanvas = createCanvas(bounds.width, bounds.height);
                sizeToBounds(bounds, dpi, textureCanvas);
                var ctx = getContext(textureCanvas);
                var factor = 20;
                if (win.innerWidth < 700) factor = 15;
                var cols = Math.round(bounds.width / factor);
                // if(bounds.width>1200){
                //   cols=55;
                // }
                var gridSize = bounds.width / cols;
                var mountains = {
                    left: [
                        '......kkkkjjjkkjjkjkkjjkkkkkjjjjjj..kkjj',
                        '....kkkjjj..kkkkjkkjjjj.......kkkkjjjjj',
                        '...kkjj...kkkkjjj..kkkjkjjjj.....kkkkjjkjjj',
                    ],
                    right: [
                        '......kkkkjjjkkjjjkkkjjkkkkkjjjjjkjj..kkkjjj',
                        '....kkkjjjkkkkjjjkkjj.......kkkkjjjjj',
                        '...kkjj.kkkkjjkkjjjjkkkkjkjjjj...kkkkjkjjjj',
                    ]
                }
                function drawLayer(layer, directionX, directionY) {
                    ctx.beginPath();
                    var pos = 0;
                    var started = false;
                    repeat(layer.length, function (i) {
                        var dir = layer.charAt(i);
                        pos += dir == '.' ? 0 : (dir == 'j' ? -1 : 1);
                        if (pos != 0 && !started) {
                            started = true;
                            ctx.moveTo((middle.x + ((i - 1) * gridSize * directionX)) * dpi, middle.y * dpi);
                        }
                        ctx.lineTo(
                            (middle.x + (i * gridSize) * directionX) * dpi,
                            (middle.y + (pos * gridSize) * directionY) * dpi
                        )
                    });
                    ctx.closePath();
                    ctx.fill();
                    // ctx.stroke();
                }
                function drawLayers(i, color1, color2) {
                    setFillStyle(color1, ctx);
                    ctx.strokeStyle = color1;
                    ctx.lineWidth = 4;
                    ctx.lineJoin = 'round'
                    drawLayer(mountains.left[i], -1, -1);
                    drawLayer(mountains.right[i], 1, -1);
                    setFillStyle(color2, ctx);
                    ctx.strokeStyle = color2;
                    drawLayer(mountains.left[i], -1, 1);
                    drawLayer(mountains.right[i], 1, 1);
                    ctx.strokeStyle = 'transparent';
                }
                drawLayers(2, colors.pink, colors.green);
                drawLayers(1, colors.purple, colors.pink);
                drawLayers(0, colors.blackish, colors.purple);

                var glow = createCanvas(bounds.width, bounds.height);
                var glowCtx = getContext(glow);
                glowCtx.drawImage(textureCanvas, 0, 0);

                // glowCtx.save();
                // glowCtx.globalCompositeOperation='screen';
                // glowCtx.globalAlpha=0.75;
                // var glowRadius=Math.max(250*dpi,(bounds.width*dpi)/4);

                // var gradient=glowCtx.createRadialGradient(
                //   middle.x*dpi,middle.y*dpi,0,
                //   middle.x*dpi,middle.y*dpi,glowRadius
                // );
                // // addColorStop(0,colors.whiteish,gradient);
                // // addColorStop(0.0,colors.pink,gradient);
                // // addColorStop(0.5,colors.purple,gradient);
                // // addColorStop(1,'rgba(0,0,0,0)',gradient);
                // addColorStop(0,'#e89c5d',gradient);
                // addColorStop(0.11,'#e86328',gradient);
                // addColorStop(0.22,'#dc1d00',gradient);
                // addColorStop(0.33,'#c10000',gradient);
                // addColorStop(0.44,'#990000',gradient);
                // addColorStop(0.55,'#6c0000',gradient);
                // addColorStop(0.66,'#490000',gradient);
                // addColorStop(0.77,'#490000',gradient);
                // addColorStop(0.88,'#280000',gradient);
                // addColorStop(0.99,'#000000',gradient);
                // glowCtx.fillStyle=gradient;
                // glowCtx.beginPath();
                // glowCtx.arc(middle.x*dpi,middle.y*dpi,glowRadius,0,Math.PI*2);
                // glowCtx.fill();

                // var bowRadius=gridSize*8*dpi;
                // var bow=glowCtx.createRadialGradient(
                //   middle.x*dpi,middle.y*dpi,0,
                //   middle.x*dpi,middle.y*dpi,bowRadius
                // )
                // addColorStop(0.7,'black',bow);
                // addColorStop(0.8,colors.pink,bow);
                // addColorStop(0.84,colors.whiteish,bow);
                // addColorStop(0.9,colors.green,bow);
                // addColorStop(0.95,colors.purple,bow);
                // addColorStop(1,'rgba(0,0,0,0)',bow);
                // glowCtx.globalAlpha=0.045;
                // glowCtx.fillStyle=bow;
                // glowCtx.beginPath();
                // glowCtx.arc(middle.x*dpi,middle.y*dpi,bowRadius,0,Math.PI*2);
                // glowCtx.fill();

                ctx.save();
                ctx.globalCompositeOperation = 'source-atop';
                ctx.drawImage(glow, 0, 0);

                glowCtx.clearRect(0, 0, bounds.width * dpi, bounds.height * dpi);
                glowCtx.restore();
                glowCtx.drawImage(textureCanvas, 0, 0);

                ctx.clearRect(0, 0, bounds.width * dpi, bounds.height * dpi);
                ctx.restore();
                setFillStyle(colors.whiteish, ctx);
                ctx.beginPath();
                sunSize = gridSize * 2.5 * dpi;
                ctx.arc(middle.x * dpi, middle.y * dpi, sunSize, Math.PI, Math.PI * 2);
                ctx.fill();
                ctx.drawImage(glow, 0, 0);
                return textureCanvas;
            }
        });
        return {
            stop: function () {
                stopAnim = true;
            }
        }
    };

    function initStars() {
        var canvas = querySelector('.Scene-stars');
        var stopAnim = false;
        var ctx = getContext(canvas);
        var bounds = getBounds(canvas);
        sizeToBounds(bounds, dpi, canvas);
        var stars = [];
        function createStar() {
            return {
                x: random(bounds.width),
                y: random(bounds.height),
                s: 0,
                speed: 0.01 + random(0.035),
                growing: true,
                maxSize: 1 + (Math.pow(random(1), 4) * 10),
            }
        }

        var flares = [
            { p: 2.1, a: 0.01, s: 50 },
            { p: 1.7, a: 0.01, s: 30 },
            { p: 1.5, a: 0.01, s: 350 },
            { p: 1.3, a: 0.012, s: 35 },
            { p: 1, a: 0.02, s: 100 },
            { p: 0.94, a: 0.025, s: 50 },
            { p: 0.85, a: 0.036, s: 60 },
            { p: 0.65, a: 0.03, s: 50 },
            { p: 0.5, a: 0.035, s: 150 },
            { p: 0.47, a: 0.05, s: 40 },
            { p: 0.4, a: 0.055, s: 50 },
            { p: 0.25, a: 0.07, s: 70 },
            { p: -0.19, a: 0.06, s: 30 },
            { p: -0.3, a: 0.06, s: 70 },
            { p: -0.6, a: 0.04, s: 45 },
            { p: -0.9, a: 0.07, s: 30 },
            { p: -1.2, a: 0.06, s: 25 },
            { p: -1.5, a: 0.04, s: 50 },
            { p: -1.9, a: 0.02, s: 100 },
        ];
        ; (function draw(now) {
            var scroll = getScroll();
            if (scroll < win.innerHeight) {
                ctx.clearRect(0, 0, bounds.width * dpi, bounds.height * dpi);
                setFillStyle(colors.whiteish, ctx);
                var newStars = [];
                forEach(stars, function (star) {
                    star.s += star.speed * (star.growing ? 1 : -1);
                    if (star.s > 1) star.growing = false;
                    if (star.s < 0) {
                        return;
                    } else {
                        newStars.push(star);
                    }
                    drawStar(
                        star.x * dpi,
                        star.y * dpi,
                        1,
                        smooth(star.s) * star.maxSize * dpi,
                        ctx
                    );
                });
                if (random(1) < 0.0000005 * (win.innerWidth * win.innerHeight)) newStars.push(createStar());
                stars = newStars;

                var source = (virtualWindowHeight * 0.75) - scroll;

                forEach(flares, function (flare) {
                    ctx.globalAlpha = flare.a;
                    var p = flare.p;
                    var ip = 1 - p;
                    var flarePos = scroll + (source * ip) + ((virtualWindowHeight - source) * p);
                    drawStar(
                        (bounds.width / 2) * dpi,
                        flarePos * dpi,
                        1,
                        flare.s * dpi,
                        ctx
                    );
                });
                ctx.globalAlpha = 1;
            }
            if (!stopAnim)
                raf(draw);
        }());
        return {
            stop: function () {
                stopAnim = true;
            }
        }
    };

    (function () {
        var animMountains = mountains();
        var animStars = initStars();
        var lastResizeW = win.innerWidth;
        var lastResizeH = win.innerHeight;
        var resizeTimer = null;
        win.addEventListener('resize', function () {
            function resize() {
                var ww = win.innerWidth;
                var wh = win.innerHeight;
                if (ww != lastResizeW) {
                    lastResizeW = ww;
                    animMountains.stop();
                    animStars.stop();
                    var canvases = querySelectorAll('.Scene-mountains');
                    forEach(canvases, function (canvas) {
                        canvas.removeAttribute('width');
                        canvas.removeAttribute('height');
                    });
                    raf(function () {
                        animMountains = mountains();
                        animStars = initStars();
                    });
                }
                if (Math.abs(wh - lastResizeH) > heightRefreshThreshold) {
                    lastResizeH = wh;
                    animStars.stop();
                    raf(function () {
                        animStars = initStars();
                    });
                }
            }
            if (resizeTimer != null) {
                clearTimeout(resizeTimer);
                resizeTimer = null;
            }
            resizeTimer = setTimeout(resize, 1000);
        });
    }());

    function get100vh() {
        var dummy = document.createElement('div');
        dummy.style.position = 'absolute';
        dummy.style.height = '100vh';
        document.body.appendChild(dummy);
        var maxHeight = dummy.getBoundingClientRect().height;
        dummy.remove();
        if (maxHeight == 0) maxHeight = win.innerHeight;
        return maxHeight;
    }

    ; (function () {
        var lastUpdate = win.innerHeight;
        function update() {
            var maxHeight = get100vh();
            forEach(querySelectorAll('.js-HasVH'), function (el) {
                el.style.height = (maxHeight * (parseFloat(el.getAttribute('data-vh')))) + 'px';
            });
            virtualWindowHeight = maxHeight;
            updateVideosBounds();
        }
        update();
        win.addEventListener('resize', function () {
            var wh = win.innerHeight;
            if (Math.abs(wh - lastUpdate) > heightRefreshThreshold) {
                update();
                lastUpdate = wh;
            }
        });
    }());

    ; (function () {
        forEach(querySelectorAll('.js-Lazyload'), function (el) {
            el.classList.remove('js-Lazyload--hidden');
            var img = document.createElement('img');
            var hires = (el.getAttribute('data-hires') == 'true') && dpi > 1;
            var file = el.getAttribute('data-image');
            if (hires) {
                var dot = file.lastIndexOf('.');
                file = file.substr(0, dot) + '@2x' + file.substr(dot);
            }
            setAttribute('src', file, img);
            setAttribute('role', 'presentation', img);
            el.appendChild(img);
        });
    }())


    function updateVideoBounds(video) {
        var bounds = getBounds(video.video);
        bounds = { top: bounds.top + getScroll(), height: bounds.height };
        video.bounds = bounds;
    }
    function updateVideosBounds() {
        if (typeof videos == "undefined") return;
        forEach(videos, updateVideoBounds);
    }

    var videos = querySelectorAll('.Work-video').map(function (video) {
        var r = {
            video: video,
            bounds: null,
            initialized: false,
            playing: false,
        }
        updateVideoBounds(r);
        video.addEventListener('play', function () {
            r.playing = true;
            video.classList.add('Work-video--playing');
            video.classList.remove('Work-video--paused');
        });
        video.addEventListener('pause', function () {
            r.playing = false;
            video.classList.remove('Work-video--playing');
            video.classList.add('Work-video--paused');
        });
        video.classList.add('Work-video--paused');
        document.addEventListener('touchstart', function videoTouchstart() {
            initializeVideo();
            document.removeEventListener('touchstart', videoTouchstart);
        });
        function initializeVideo() {
            if (!r.initialized) {
                video.play();
                video.pause();
                r.initialized = true;
            }
        }
        return r;
    });

    ; (function () {
        var lastScroll = 0;
        ; (function updateVideos() {
            var scroll = getScroll();
            if (scroll != lastScroll) {
                var scrollMiddle = scroll + (virtualWindowHeight / 2);
                forEach(videos, function (video) {
                    var dist = 120;
                    var middle = video.bounds.top + (video.bounds.height / 2);
                    if (scrollMiddle > middle - dist && scrollMiddle < middle + dist) {
                        if (!video.playing) {
                            video.video.play();
                        }
                    } else {
                        if (video.playing) {
                            video.video.pause();
                        }
                    }
                });
            }
            raf(updateVideos);
        }());
    }());

    ; (function () {
        var email = querySelector('.Email');
        setAttribute('href', 'mailto:lucasbbebber@gmail.com', email);
        email.innerHTML = '<strong>lucasbbebber</strong>@<strong>gmail</strong>.com';
    }());

    var blockHashChange = false;
    window.addEventListener('hashchange', function (event) {
            if (blockHashChange)
                event.preventDefault();
        })

        ; (function () {
        // var curDPI=dpi;
        // var transitionCanvas=createCanvas(win.innerWidth,win.innerHeight,curDPI);
        // transitionCanvas.style.position="fixed";
        // transitionCanvas.style.top=0;
        // transitionCanvas.style.left=0;
        // transitionCanvas.style.width="100%";
        // transitionCanvas.style.height="100%";
        // transitionCanvas.style.pointerEvents="none";
        // transitionCanvas.style.display="none";
        // var transitionCtx=getContext(transitionCanvas);
        // body.appendChild(transitionCanvas);
        var links = querySelectorAll('.Nav-link');
        forEach(links, function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
                var wrapper = querySelector('.ScrollWrapper');
                // transitionCanvas.style.display="block";
                var target = link.getAttribute('href');
                var offset = win.innerWidth <= 768 ? 60 : 80;
                if (target != '#about') offset = 30;
                blockHashChange = true;
                window.history.pushState('', {}, target);
                requestAnimationFrame(function () {
                    blockHashChange = false;
                });
                target = querySelector(target);
                var targetBounds = getBounds(target);
                var targetPos = Math.round(targetBounds.top) - offset;
                var docHeight = documentHeight();
                if (targetPos + win.innerHeight > docHeight) {
                    targetPos = docHeight - win.innerHeight;
                }
                win.scrollTo(0, targetPos);
                wrapper.style.transform = "translate3d(0," + (targetPos) + "px,0)";
                var duration = 300 + (targetPos * 0.3);
                var cur = 0;
                var initialPos = targetPos;
                var destPos = 0;
                var deltaPos = destPos - initialPos;
                var lastPos = initialPos;
                var inOutQuad = function (t) { return t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t };
                var outQuad = function (t) { return t * (2 - t) };
                var outQuart = function (t) { return 1 - (--t) * t * t * t };
                var inOutQuart = function (t) { return t < .5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t };
                var goingFast = targetPos > 1000;
                var easing = function (t) {
                    if (!goingFast) return inOutQuad(t);
                    else return inOutQuart(t);
                }
                // function distributeInRect(bounds,num){
                //   var curStreaks=[];
                //   repeat(num,function(i){
                //     curStreaks.push({
                //       x:bounds.left+random(bounds.width),
                //       y:bounds.top+random(bounds.height),
                //     });
                //   });
                //   return curStreaks;
                // }
                // function makeStreaks(obj,color,num,padding,w){
                //   var bounds=[];
                //   if(typeof obj=='string'){
                //     var els=querySelectorAll(obj);
                //     forEach(els,function(el){
                //       bounds.push(getBounds(el));
                //     });
                //   }else{
                //     bounds=[obj];
                //   }
                //   if(typeof padding!="undefined"){
                //     forEach(bounds,function(bound){
                //       bound.left+=padding;
                //       bound.top+=padding;
                //       bound.width-=padding*2;
                //       bound.height-=padding*2;
                //     });
                //   }
                //   var curStreaks=[];
                //   // bounds.forEach(function(bound){
                //   //   curStreaks=curStreaks.concat(distributeInRect(bound,num));
                //   // });
                //   bounds.forEach(function(bound){
                //     curStreaks=curStreaks.concat([{
                //       x:bound.left,
                //       y:bound.top,
                //       w:bound.width,
                //     }]);
                //   });
                //   forEach(curStreaks,function(streak){
                //     streak.c=color;
                //     // streak.w=typeof w=="undefined"?2:w;
                //   });
                //   return curStreaks;
                // }
                // var streaksObjs=[
                //   // {obj:'.Title-Center-left',num:1,color:colors.green},
                //   // {obj:'.Title-Center-right',num:1,color:colors.green},
                //   // {obj:{
                //   //   left:0,
                //   //   top:win.innerHeight*0.4,
                //   //   width:win.innerWidth,
                //   //   height:50,
                //   // },num:5,color:colors.pink},
                //   // {obj:{
                //   //   left:0,
                //   //   top:win.innerHeight*0.2,
                //   //   width:win.innerWidth,
                //   //   height:50,
                //   // },num:5,color:colors.purple},
                //   // {obj:{
                //   //   left:0,
                //   //   top:0,
                //   //   width:win.innerWidth,
                //   //   height:win.innerHeight*0.55,
                //   // },num:10,color:colors.whiteish},
                //   {obj:'.Work-link',color:colors.pink},
                //   // {obj:'.Work-link',num:,color:colors.whiteish},
                //   // {obj:'p',num:20,color:colors.blackish,padding:20,w:0.5},
                //   // {obj:'p',num:6,color:colors.whiteish},
                //   // {obj:'.Work-image',num:12,color:'#fff'},
                // ];
                // var streaks=[];
                // forEach(streaksObjs,function(streak){
                //   streaks=streaks.concat(makeStreaks(streak.obj,streak.color,streak.num,streak.padding,streak.w));
                // });
                raf(function () {
                    var start = Date.now();
                    var time = Date.now();
                    var fps = 60;
                    var step = 1000 / fps;
                    var maxStep = step * 1.5;
                    var totalDist = 0;
                    var lastDists = [];
                    ; (function updateScroll() {
                        var now = Date.now();
                        var deltaTime = now - time;
                        time = now;
                        var last = cur;
                        cur = ((time - start) / duration);
                        if (cur > 1) cur = 1;
                        var pos = initialPos + (easing(cur) * deltaPos);
                        var dist = Math.min(0, pos - lastPos + 5);

                        if (cur < 1)
                            lastDists = [dist].concat(lastDists.slice(0, 2));
                        else
                            lastDists = lastDists.slice(0, lastDists.length - 1);
                        // var avgDist=(lastDists.reduce(function(sum,cur){return sum+cur;},0))/1;
                        lastPos = pos;
                        totalDist += dist;
                        // if(goingFast){
                        //   transitionCtx.clearRect(0,0,win.innerWidth*curDPI,win.innerHeight*curDPI);
                        //   forEach(streaks,function(streak){
                        //     var x=streak.x;
                        //     var targetY=streak.y+(deltaPos+pos);
                        //     var y=targetY;
                        //     var height=Math.max(0,Math.abs(avgDist)-9);
                        //     var width=streak.w;
                        //     transitionCtx.fillStyle=streak.c;
                        //     transitionCtx.fillRect(x*curDPI,y*curDPI,width*curDPI,height*curDPI);
                        //   });
                        // }
                        wrapper.style.transform = "translate3d(0," + pos + "px,0)";
                        if (cur < 1 || lastDists.length > 0) raf(updateScroll);
                        else {
                            // transitionCanvas.style.display="none";
                        }
                    }());
                });
            });
        });
    }());
}());
