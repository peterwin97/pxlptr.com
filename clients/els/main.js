(function () {
  "use strict";

  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ============================================================
     COVER — WebGL per-pixel depth parallax
     ============================================================ */
  (function initDepth() {
    var canvas = document.getElementById("cover-canvas");
    if (!canvas) return;

    var gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (!gl) {
      var img = document.createElement("img");
      img.src = "els-bg.png"; img.alt = "";
      canvas.parentNode.replaceChild(img, canvas);
      return;
    }

    var VS = [
      "attribute vec2 a_pos;",
      "varying vec2 v_uv;",
      "void main(){",
      "  v_uv = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);",
      "  gl_Position = vec4(a_pos, 0.0, 1.0);",
      "}"
    ].join("\n");

    /* object-fit:cover UV remapping + depth displacement */
    var FS = [
      "precision mediump float;",
      "uniform sampler2D u_color;",
      "uniform sampler2D u_depth;",
      "uniform vec2 u_mouse;",
      "uniform float u_strength;",
      "uniform vec2 u_scale;",
      "uniform vec2 u_offset;",
      "varying vec2 v_uv;",

      "vec2 cover(vec2 uv){ return uv * u_scale + u_offset; }",

      "void main(){",
      "  vec2 base = cover(v_uv);",
      "  float depth = texture2D(u_depth, base).r;",
      "  vec2 displaced = base + u_mouse * depth * u_strength;",
      "  gl_FragColor = texture2D(u_color, displaced);",
      "}"
    ].join("\n");

    function shader(type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s); return s;
    }
    var prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog); gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1i(gl.getUniformLocation(prog, "u_color"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "u_depth"), 1);
    var uMouse    = gl.getUniformLocation(prog, "u_mouse");
    var uStrength = gl.getUniformLocation(prog, "u_strength");
    var uScale    = gl.getUniformLocation(prog, "u_scale");
    var uOffset   = gl.getUniformLocation(prog, "u_offset");
    gl.uniform1f(uStrength, 0.010);

    var imgW = 1, imgH = 1; /* updated once image loads */

    function tex(unit, imgEl) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imgEl);
    }

    var colorImg;
    var ready = 0;
    function load(src, unit) {
      var i = new Image(); i.crossOrigin = "anonymous";
      i.onload = function() {
        if (unit === 0) { colorImg = i; imgW = i.naturalWidth; imgH = i.naturalHeight; }
        tex(unit, i);
        ready++;
        if (ready === 2) { resize(); loop(); }
      };
      i.src = src;
    }
    load("els-bg.png", 0);
    load("els-depth.png", 1);

    /* Compute UV scale+offset for object-fit:cover behaviour */
    function resize() {
      canvas.width  = canvas.offsetWidth  * (window.devicePixelRatio || 1);
      canvas.height = canvas.offsetHeight * (window.devicePixelRatio || 1);
      gl.viewport(0, 0, canvas.width, canvas.height);

      var canvasAR = canvas.width / canvas.height;
      var imageAR  = imgW / imgH;
      var sx, sy, ox, oy;
      if (canvasAR > imageAR) {
        /* canvas wider — fit width, crop height */
        sx = 1; sy = imageAR / canvasAR;
        ox = 0; oy = (1 - sy) * 0.5;
      } else {
        /* canvas taller — fit height, crop width */
        sx = canvasAR / imageAR; sy = 1;
        ox = (1 - sx) * 0.5; oy = 0;
      }
      gl.uniform2f(uScale, sx, sy);
      gl.uniform2f(uOffset, ox, oy);
    }
    window.addEventListener("resize", resize);

    var mx = 0, my = 0, cx = 0, cy = 0;
    window.addEventListener("mousemove", function(e) {
      if (reduce) return;
      mx = (e.clientX / window.innerWidth  - 0.5) * -1;
      my = (e.clientY / window.innerHeight - 0.5) * -1;
    });

    function loop() {
      cx += (mx - cx) * 0.06;
      cy += (my - cy) * 0.06;
      gl.uniform2f(uMouse, cx, cy);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(loop);
    }
  })();

  if (!window.gsap) { skipAll(); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* Lenis — driven by GSAP ticker so the ticker never freezes */
  var lenis;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.075, smoothWheel: true });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);
  }

  /* ============================================================
     SPLASH
     ============================================================ */
  var splash = document.getElementById("splash");

  function dismissSplash(cb) {
    document.body.classList.remove("is-loading");
    gsap.to(splash, {
      yPercent: -100,
      duration: 0.95,
      ease: "power4.inOut",
      onComplete: function () {
        splash.style.display = "none";
        if (cb) cb();
      }
    });
  }

  if (!splash || reduce) {
    if (splash) splash.style.display = "none";
    document.body.classList.remove("is-loading");
    initPage();
  } else {
    var _dismissed = false;
    function safeDismiss() {
      if (_dismissed) return;
      _dismissed = true;
      dismissSplash(initPage);
    }
    setTimeout(safeDismiss, 4500);

    var tl = gsap.timeline({
      delay: 0.1,
      onComplete: function () { setTimeout(safeDismiss, 520); }
    });

    tl.to(".splash-mark", { opacity: 1, scale: 1, duration: 1.2, ease: "power3.out" });
    tl.to(".splash-wordmark", { opacity: 1, duration: 0.8, ease: "power2.out" }, "-=0.55");
    tl.to(".splash-rule", { width: 64, duration: 0.5, ease: "power2.out" }, "-=0.4");
    tl.to(".splash-sub", { opacity: 1, duration: 0.45, ease: "power2.out" }, "-=0.25");
  }

  /* ============================================================
     PAGE ANIMATIONS
     ============================================================ */
  function initPage() {
    if (reduce) { skipAll(); return; }

    /* ---- Cover ---- */
    gsap.to(".cover-caption", { opacity: 1, duration: 1.2, delay: 0.8 });

    /* ---- Home Statement ---- */
    gsap.to(".home-headline", {
      opacity: 1, y: 0, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: "#home-statement", start: "top 75%", toggleActions: "play none none none" }
    });
    gsap.to(".home-sub", {
      opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.15,
      scrollTrigger: { trigger: "#home-statement", start: "top 72%", toggleActions: "play none none none" }
    });
    gsap.to(".hstat", {
      opacity: 1, y: 0, duration: 0.85, ease: "power3.out", stagger: 0.1, delay: 0.25,
      scrollTrigger: { trigger: ".home-stats", start: "top 82%", toggleActions: "play none none none" }
    });

    /* ---- Home Services Teaser ---- */
    gsap.to(".hsvc-item", {
      opacity: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.07,
      scrollTrigger: { trigger: "#home-services", start: "top 75%", toggleActions: "play none none none" }
    });

    /* ---- Home Work Teaser ---- */
    gsap.to(".hwrk-feature", {
      opacity: 1, y: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: "#home-work", start: "top 75%", toggleActions: "play none none none" }
    });

    /* ---- Home CTA ---- */
    gsap.to(".hcta-pre", {
      opacity: 1, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: "#home-cta", start: "top 78%", toggleActions: "play none none none" }
    });
    gsap.to(".hcta-title", {
      opacity: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.1,
      scrollTrigger: { trigger: "#home-cta", start: "top 75%", toggleActions: "play none none none" }
    });
    gsap.to([".hcta-link", ".hcta-btn"], {
      opacity: 1, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.3,
      scrollTrigger: { trigger: "#home-cta", start: "top 72%", toggleActions: "play none none none" }
    });

    /* Cover image parallax */
    gsap.to(".cover-img-wrap", {
      yPercent: 14, ease: "none",
      scrollTrigger: { trigger: "#cover", start: "top top", end: "bottom top", scrub: true }
    });

    /* ---- Intro ---- */
    gsap.to(".pull-quote", {
      opacity: 1, y: 0, duration: 1.1, ease: "power3.out",
      scrollTrigger: { trigger: "#intro", start: "top 78%", toggleActions: "play none none none" }
    });
    document.querySelectorAll(".intro-body p").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: i * 0.12,
        scrollTrigger: { trigger: "#intro", start: "top 72%", toggleActions: "play none none none" }
      });
    });

    /* ---- Scenes (full-screen parallax interstitials) ---- */
    document.querySelectorAll(".scene").forEach(function (scene) {
      var imgWrap = scene.querySelector(".scene-img-wrap");
      var quote   = scene.querySelector(".scene-quote");
      var cta     = scene.querySelector(".scene-cta");

      if (imgWrap) {
        gsap.to(imgWrap, {
          yPercent: 14, ease: "none",
          scrollTrigger: { trigger: scene, start: "top bottom", end: "bottom top", scrub: true }
        });
      }
      if (quote) {
        gsap.to(quote, {
          opacity: 1, y: 0, duration: 1.3, ease: "power3.out",
          scrollTrigger: { trigger: scene, start: "top 70%", toggleActions: "play none none none" }
        });
      }
      if (cta) {
        gsap.to(cta, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.45,
          scrollTrigger: { trigger: scene, start: "top 65%", toggleActions: "play none none none" }
        });
      }
    });

    /* ---- Services ---- */
    document.querySelectorAll(".service-item").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: "power3.out",
        delay: Math.min(i, 3) * 0.09,
        scrollTrigger: { trigger: "#services .service-list", start: "top 78%", toggleActions: "play none none none" }
      });
    });
    gsap.to(".services-cta", {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: ".services-cta", start: "top 85%", toggleActions: "play none none none" }
    });

    /* ---- Marquee ---- */
    var marqueeTrack = document.querySelector(".marquee-track");
    if (marqueeTrack) {
      gsap.to(marqueeTrack, {
        xPercent: -50, duration: 32, ease: "none", repeat: -1
      });
    }

    /* ---- Work features ---- */
    document.querySelectorAll(".feature").forEach(function (feature) {
      var mask  = feature.querySelector(".feature-mask");
      var img   = feature.querySelector(".feature-mask img");
      var tag   = feature.querySelector(".feature-tag");
      var title = feature.querySelector(".feature-title");
      var body  = feature.querySelector(".feature-body");
      var data  = feature.querySelector(".feature-data");
      var loc   = feature.querySelector(".feature-loc");

      if (mask) {
        gsap.to(mask, {
          clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "power4.out",
          scrollTrigger: { trigger: feature, start: "top 80%", toggleActions: "play none none none" }
        });
      }
      if (img) {
        gsap.to(img, {
          yPercent: -10, ease: "none",
          scrollTrigger: { trigger: feature, start: "top bottom", end: "bottom top", scrub: true }
        });
      }
      var textEls = [loc, tag, title, body, data].filter(Boolean);
      if (textEls.length) {
        gsap.to(textEls, {
          opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.1,
          scrollTrigger: { trigger: feature, start: "top 74%", toggleActions: "play none none none" }
        });
      }
    });

    /* ---- Philosophy ---- */
    document.querySelectorAll(".phil-stmt").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out",
        delay: (i % 2) * 0.12,
        scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none none" }
      });
    });

    /* ---- Archive ---- */
    document.querySelectorAll(".archive-item").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: i * 0.1,
        scrollTrigger: { trigger: "#archive", start: "top 78%", toggleActions: "play none none none" }
      });
    });

    /* ---- Letter / About ---- */
    var letterMask = document.querySelector(".letter-mask");
    if (letterMask) {
      gsap.to(letterMask, {
        clipPath: "inset(0% 0 0 0)", duration: 1.4, ease: "power4.out",
        scrollTrigger: { trigger: "#letter", start: "top 80%", toggleActions: "play none none none" }
      });
      var lImg = letterMask.querySelector("img");
      if (lImg) {
        gsap.to(lImg, {
          yPercent: -8, ease: "none",
          scrollTrigger: { trigger: "#letter", start: "top bottom", end: "bottom top", scrub: true }
        });
      }
    }
    gsap.to(".letter-credit", {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2,
      scrollTrigger: { trigger: "#letter", start: "top 75%", toggleActions: "play none none none" }
    });
    document.querySelectorAll(".letter-opener").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 1, ease: "power3.out", delay: 0.1 + i * 0.15,
        scrollTrigger: { trigger: "#letter", start: "top 72%", toggleActions: "play none none none" }
      });
    });
    document.querySelectorAll(".letter-text p").forEach(function (el, i) {
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.85, ease: "power3.out", delay: 0.3 + i * 0.1,
        scrollTrigger: { trigger: ".letter-body", start: "top 80%", toggleActions: "play none none none" }
      });
    });
    gsap.to(".letter-sig", {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.7,
      scrollTrigger: { trigger: ".letter-body", start: "top 80%", toggleActions: "play none none none" }
    });

    /* ---- Contact ---- */
    var contactLines = document.querySelectorAll("#contact .contact-title .ln > span");
    gsap.to(contactLines, {
      y: 0, duration: 1.3, ease: "power4.out", stagger: 0.1,
      scrollTrigger: { trigger: "#contact", start: "top 78%", toggleActions: "play none none none" }
    });
    gsap.to(".contact-link", {
      opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.3,
      scrollTrigger: { trigger: "#contact", start: "top 75%", toggleActions: "play none none none" }
    });
    gsap.to(".contact-avail", {
      opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.5,
      scrollTrigger: { trigger: "#contact", start: "top 75%", toggleActions: "play none none none" }
    });

    /* ---- Nav color: cream on dark sections, ink everywhere else ---- */
    var nav = document.getElementById("nav");
    ["#scene-1", "#services", "#scene-2", "#philosophy", "#contact", "#home-services", "#home-cta", ".page-cta"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      ScrollTrigger.create({
        trigger: el,
        start: "top 56px",
        end: "bottom 56px",
        onEnter:      function () { nav.classList.add("nav--lt"); },
        onLeave:      function () { nav.classList.remove("nav--lt"); },
        onEnterBack:  function () { nav.classList.add("nav--lt"); },
        onLeaveBack:  function () { nav.classList.remove("nav--lt"); }
      });
    });
  }

  function skipAll() {
    document.body.classList.remove("is-loading");
    if (splash) splash.style.display = "none";
    document.querySelectorAll(
      ".ln > span, .cover-edition, .cover-caption, " +
      ".pull-quote, .intro-body p, " +
      ".service-item, .services-cta, .scene-quote, .scene-cta, " +
      ".feature-tag, .feature-title, .feature-body, .feature-data, .feature-loc, " +
      ".phil-stmt, .archive-item, .letter-credit, .letter-opener, .letter-text p, " +
      ".letter-sig, .contact-link, .contact-avail, " +
      ".home-headline, .home-sub, .hstat, .hsvc-item, .hwrk-feature, .hcta-pre, .hcta-title, .hcta-link, .hcta-btn"
    ).forEach(function (el) {
      el.style.transform = "none";
      el.style.opacity = "1";
    });
    document.querySelectorAll(".feature-mask, .letter-mask").forEach(function (el) {
      el.style.clipPath = "none";
    });
  }

})();
