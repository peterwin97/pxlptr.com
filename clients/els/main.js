(function(){
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  try{ if(hasGSAP) gsap.registerPlugin(ScrollTrigger); }catch(err){ hasGSAP=false; }

  /* ---------- loader ---------- */
  var loader=document.getElementById("loader");
  function clearLoader(){document.body.classList.remove("is-loading");if(loader)loader.style.display="none";}
  window.addEventListener("load",function(){
    if(reduce || !hasGSAP || !loader){clearLoader();return;}
    try{
      var tl=gsap.timeline({onComplete:clearLoader});
      tl.to("#loader .word span",{y:0,duration:.9,ease:"power3.out",delay:.2})
        .to("#loader",{yPercent:-100,duration:.7,ease:"power3.inOut",delay:.25});
    }catch(err){clearLoader();}
  });
  setTimeout(clearLoader, 3000);

  if(!hasGSAP){
    document.querySelectorAll(".ln span, .reveal, .reveal-img").forEach(function(el){el.style.transform="none";el.style.opacity="1"});
    return;
  }

  /* ---------- 01 Belief (home hero) ---------- */
  if(document.getElementById("ch1")){
    gsap.to("#ch1 h1 .ln span",{y:0,duration:1.2,ease:"power3.out",stagger:.1,delay:.5});
    gsap.set("#ch1 .cue",{opacity:0,y:36});
    gsap.to("#ch1 .meta .reveal, #ch1 .cue",{opacity:1,y:0,duration:1,ease:"power3.out",delay:1});
    gsap.to("#ch1 .frame",{scale:1.12,ease:"none",scrollTrigger:{trigger:"#ch1",start:"top top",end:"bottom top",scrub:true}});
    gsap.to("#ch1 h1",{y:-40,opacity:.4,ease:"none",scrollTrigger:{trigger:"#ch1",start:"top top",end:"bottom top",scrub:true}});
  }

  /* ---------- page hero (sub-pages): line reveal + fade ---------- */
  document.querySelectorAll(".page-hero .ln span").forEach(function(el){
    gsap.to(el,{y:0,duration:1.1,ease:"power3.out",delay:.35});
  });
  gsap.utils.toArray(".page-hero .reveal").forEach(function(el,i){
    gsap.to(el,{opacity:1,y:0,duration:1,ease:"power3.out",delay:.6+i*0.08});
  });

  /* ---------- 02 Perspective / statement list ---------- */
  gsap.utils.toArray("#ch2 .obs").forEach(function(el){
    gsap.to(el,{opacity:1,y:0,duration:1,ease:"power3.out",
      scrollTrigger:{trigger:el,start:"top 85%",toggleActions:"play none none none"}});
  });

  /* ---------- 03 The Work collage ---------- */
  gsap.utils.toArray("#ch3 .head .reveal").forEach(function(el,i){
    gsap.to(el,{opacity:1,y:0,duration:.9,ease:"power3.out",delay:i*0.08,
      scrollTrigger:{trigger:"#ch3 .head",start:"top 85%",toggleActions:"play none none none"}});
  });
  gsap.utils.toArray("#ch3 .piece").forEach(function(el,i){
    gsap.to(el,{opacity:1,y:0,duration:1,ease:"power3.out",delay:(i%2)*0.1,
      scrollTrigger:{trigger:el,start:"top 88%",toggleActions:"play none none none"}});
    var img = el.querySelector("img");
    if(img) gsap.to(img,{yPercent:-8,ease:"none",
      scrollTrigger:{trigger:el,start:"top bottom",end:"bottom top",scrub:true}});
  });

  /* ---------- 04 Community ---------- */
  if(document.getElementById("ch4")){
    gsap.to("#ch4 h2",{opacity:1,y:0,duration:1,ease:"power3.out",
      scrollTrigger:{trigger:"#ch4",start:"top 75%",toggleActions:"play none none none"}});
    gsap.to("#ch4 .portrait",{opacity:1,y:0,duration:1,ease:"power3.out",
      scrollTrigger:{trigger:"#ch4",start:"top 75%",toggleActions:"play none none none"}});
    document.querySelectorAll("#ch4 .row .ln span").forEach(function(el,i){
      gsap.to(el,{x:0,y:0,duration:.9,ease:"power3.out",delay:(i%6)*0.05,
        scrollTrigger:{trigger:el,start:"top 90%",toggleActions:"play none none none"}});
    });
    gsap.set("#ch4 .row .n",{opacity:0,x:-12});
    document.querySelectorAll("#ch4 .row .n").forEach(function(el,i){
      gsap.to(el,{opacity:1,x:0,duration:.9,ease:"power3.out",delay:(i%6)*0.05,
        scrollTrigger:{trigger:el,start:"top 90%",toggleActions:"play none none none"}});
    });
  }

  /* ---------- 05 Founder ---------- */
  if(document.getElementById("ch5")){
    gsap.to("#ch5 .reveal, #ch5 .reveal-img",{opacity:1,y:0,scale:1,duration:1,ease:"power3.out",stagger:.1,
      scrollTrigger:{trigger:"#ch5",start:"top 75%",toggleActions:"play none none none"}});
  }

  /* ---------- generic reveal (sections beyond the named chapters) ---------- */
  gsap.utils.toArray(".reveal").forEach(function(el){
    if(el.closest("#ch1, #ch2, #ch3, #ch4, #ch5, #ch6, .page-hero")) return;
    gsap.to(el,{opacity:1,y:0,duration:.9,ease:"power3.out",
      scrollTrigger:{trigger:el,start:"top 90%",toggleActions:"play none none none"}});
  });
  gsap.utils.toArray(".reveal-img").forEach(function(el){
    if(el.closest("#ch5")) return;
    gsap.to(el,{opacity:1,scale:1,duration:1.2,ease:"power3.out",
      scrollTrigger:{trigger:el,start:"top 90%",toggleActions:"play none none none"}});
  });

  /* ---------- 06 Invitation / close ---------- */
  if(document.getElementById("ch6")){
    document.querySelectorAll("#ch6 .ln span").forEach(function(el){
      gsap.to(el,{y:0,duration:1,ease:"power3.out",
        scrollTrigger:{trigger:el,start:"top 90%",toggleActions:"play none none none"}});
    });
    gsap.set("#ch6 .go, #ch6 .footline",{opacity:0,y:24});
    gsap.to("#ch6 .go, #ch6 .footline",{opacity:1,y:0,duration:1,ease:"power3.out",delay:.2,
      scrollTrigger:{trigger:"#ch6",start:"top 70%",toggleActions:"play none none none"}});
  }

  /* ---------- magnetic buttons ---------- */
  document.querySelectorAll(".magnet").forEach(function(btn){
    var inner = btn.querySelector(".magnet-inner") || btn;
    btn.addEventListener("mousemove",function(e){
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width/2) * .35;
      var y = (e.clientY - r.top - r.height/2) * .35;
      gsap.to(inner,{x:x,y:y,duration:.4,ease:"power2.out"});
    });
    btn.addEventListener("mouseleave",function(){
      gsap.to(inner,{x:0,y:0,duration:.5,ease:"elastic.out(1,.4)"});
    });
  });

  /* ---------- contact form (placeholder submit) ---------- */
  var form=document.getElementById("startForm");
  if(form) form.addEventListener("submit",function(e){
    e.preventDefault();
    var btn=form.querySelector(".submit");
    var orig=btn.textContent;
    btn.textContent="Thank you!";
    setTimeout(function(){form.reset();btn.textContent=orig;},2200);
  });

  /* ---------- smooth in-page anchor nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener("click",function(e){
      var target=document.querySelector(a.getAttribute("href"));
      if(!target)return;
      e.preventDefault();
      target.scrollIntoView({behavior: reduce?"auto":"smooth"});
    });
  });
})();
