/* ===== 塗色樂園 ===== */
(function(){
  "use strict";
  var cvs = document.getElementById("cvs");
  var ctx = cvs.getContext("2d");
  var W = cvs.width, H = cvs.height;
  var color = "#ff6b81", size = 10, erasing = false;
  var drawing = false, lastX = 0, lastY = 0;

  var PALETTE = ["#ff6b81","#ff9f43","#ffd93d","#6bcb77","#4d96ff","#9b59b6","#ff8fab","#6c5ce7","#00cec9","#f368e0","#8854d0","#a4b0be","#ffffff","#000000"];
  var pal = document.getElementById("palette");
  pal.innerHTML = PALETTE.map(function(c,i){
    return '<button class="swatch' + (i===0?" on":"") + '" data-c="' + c + '" style="background:' + c + '"></button>';
  }).join("");
  pal.addEventListener("click", function(e){
    var b = e.target.closest(".swatch"); if(!b) return;
    color = b.getAttribute("data-c"); erasing = false;
    document.querySelectorAll(".swatch").forEach(function(s){ s.classList.toggle("on", s===b); });
    document.getElementById("eraser").classList.remove("on");
    hint("現在用「" + color + "」塗色");
  });

  document.querySelectorAll(".size-btn").forEach(function(b){
    b.addEventListener("click", function(){
      size = +b.getAttribute("data-s");
      document.querySelectorAll(".size-btn").forEach(function(s){ s.classList.toggle("on", s===b); });
    });
  });
  document.getElementById("eraser").addEventListener("click", function(){
    erasing = !erasing;
    this.classList.toggle("on", erasing);
    hint(erasing ? "🧽 橡皮擦模式" : "恢復塗色模式");
  });
  document.getElementById("clearBtn").addEventListener("click", function(){
    drawScene(cur);
    hint("已清空，重新開始！");
  });
  document.getElementById("saveBtn").addEventListener("click", function(){
    var a = document.createElement("a");
    a.download = "塗色-" + cur.name + ".png";
    a.href = cvs.toDataURL("image/png");
    a.click();
    toast("📸 圖片已儲存！");
  });
  document.querySelectorAll(".stamp").forEach(function(s){
    s.addEventListener("click", function(){ stampEmoji = this.getAttribute("data-e"); hint("點畫布蓋「" + stampEmoji + "」印章"); });
  });

  var stampEmoji = "";

  function toast(m){ var t=document.getElementById("toast"); t.textContent=m; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(function(){t.classList.remove("show");},1800); }
  function hint(m){ var h=document.getElementById("hint"); if(h) h.textContent=m||""; }

  /* ----- 场景线稿 ----- */
  var SCENES = [
    {name:"小魚", emoji:"🐟", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
      // fish body
      ctx.beginPath(); ctx.ellipse(320,340,150,95,0,0,Math.PI*2); ctx.stroke();
      // tail
      ctx.beginPath(); ctx.moveTo(470,340); ctx.lineTo(560,280); ctx.lineTo(560,400); ctx.closePath(); ctx.stroke();
      // eye
      ctx.beginPath(); ctx.arc(250,310,16,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(252,312,6,0,Math.PI*2); ctx.stroke();
      // mouth
      ctx.beginPath(); ctx.arc(215,345,22,0.6,2.4); ctx.stroke();
      // fin
      ctx.beginPath(); ctx.moveTo(300,245); ctx.quadraticCurveTo(360,160,420,245); ctx.stroke();
      // bubbles
      [[180,220],[150,160],[210,130]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],14,0,Math.PI*2); ctx.stroke(); });
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("魚",150,480);
    }},
    {name:"小船", emoji:"⛵", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
      // hull
      ctx.beginPath(); ctx.moveTo(160,420); ctx.quadraticCurveTo(320,480,480,420); ctx.lineTo(430,460); ctx.quadraticCurveTo(320,500,210,460); ctx.closePath(); ctx.stroke();
      // mast
      ctx.beginPath(); ctx.moveTo(320,420); ctx.lineTo(320,140); ctx.stroke();
      // sail
      ctx.beginPath(); ctx.moveTo(320,140); ctx.quadraticCurveTo(440,200,320,320); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(320,140); ctx.quadraticCurveTo(200,200,320,320); ctx.stroke();
      // flag
      ctx.beginPath(); ctx.moveTo(320,140); ctx.lineTo(400,110); ctx.lineTo(320,80); ctx.closePath(); ctx.stroke();
      // waves
      for(var i=0;i<5;i++){ ctx.beginPath(); ctx.moveTo(80+i*120,500); ctx.quadraticCurveTo(100+i*120,480,120+i*120,500); ctx.stroke(); }
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("船",120,560);
    }},
    {name:"小羊", emoji:"🐑", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
      // body (cloud)
      ctx.beginPath(); ctx.arc(320,400,90,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(240,370,55,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(400,370,55,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(280,450,50,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(360,450,50,0,Math.PI*2); ctx.stroke();
      // head
      ctx.beginPath(); ctx.ellipse(320,290,42,50,0,0,Math.PI*2); ctx.stroke();
      // ears
      ctx.beginPath(); ctx.ellipse(272,265,20,30,-0.7,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(368,265,20,30,0.7,0,Math.PI*2); ctx.stroke();
      // eyes
      ctx.beginPath(); ctx.arc(302,285,6,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(338,285,6,0,Math.PI*2); ctx.stroke();
      // nose/mouth
      ctx.beginPath(); ctx.moveTo(308,315); ctx.lineTo(332,315); ctx.stroke();
      ctx.beginPath(); ctx.arc(320,315,10,0,Math.PI); ctx.stroke();
      // legs
      [[250,480],[290,480],[350,480],[390,480]].forEach(function(p){ ctx.beginPath(); ctx.moveTo(p[0],440); ctx.lineTo(p[0],500); ctx.stroke(); });
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("羊",140,530);
    }},
    {name:"星星", emoji:"⭐", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round";
      star(320,330,5,190,90); 
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("星",250,560);
      function star(cx,cy,spikes,outer,inner){
        var rot=Math.PI/2*3, step=Math.PI/spikes;
        ctx.beginPath();
        for(var i=0;i<spikes;i++){
          var x=cx+Math.cos(rot)*outer, y=cy+Math.sin(rot)*outer;
          ctx.lineTo(x,y); rot+=step;
          x=cx+Math.cos(rot)*inner; y=cy+Math.sin(rot)*inner;
          ctx.lineTo(x,y); rot+=step;
        }
        ctx.closePath(); ctx.stroke();
      }
    }},
    {name:"大樹", emoji:"🌳", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
      // trunk
      ctx.beginPath(); ctx.moveTo(320,420); ctx.lineTo(320,280); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(280,500); ctx.lineTo(280,400); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(360,500); ctx.lineTo(360,400); ctx.stroke();
      // branches
      ctx.beginPath(); ctx.moveTo(320,300); ctx.lineTo(220,240); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(320,300); ctx.lineTo(420,240); ctx.stroke();
      // canopy circles
      [[250,220],[390,220],[320,150],[320,280]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],85,0,Math.PI*2); ctx.stroke(); });
      // fruit
      [[280,240],[360,240],[320,180]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],12,0,Math.PI*2); ctx.stroke(); });
      // grass
      for(var i=0;i<8;i++){ ctx.beginPath(); ctx.moveTo(120+i*70,520); ctx.quadraticCurveTo(140+i*70,500,160+i*70,520); ctx.stroke(); }
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("樹",120,560);
    }},
    {name:"愛心", emoji:"💖", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round";
      ctx.beginPath();
      ctx.moveTo(320,480);
      ctx.bezierCurveTo(500,360,470,180,320,260);
      ctx.bezierCurveTo(170,180,140,360,320,480);
      ctx.stroke();
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("愛",270,560);
    }},
    {name:"十字架", emoji:"✝️", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=6; ctx.lineJoin="round"; ctx.lineCap="round";
      ctx.beginPath(); ctx.moveTo(320,120); ctx.lineTo(320,500); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(210,260); ctx.lineTo(430,260); ctx.stroke();
      // rays
      ctx.lineWidth=3;
      [[140,120],[500,120],[120,430],[520,430]].forEach(function(p){
        ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(p[0]-60,p[1]-60); ctx.stroke();
      });
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("耶穌愛你",200,560);
    }},
    {name:"鴿子", emoji:"🕊️", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
      // body
      ctx.beginPath(); ctx.ellipse(320,360,120,70,0,0,Math.PI*2); ctx.stroke();
      // head
      ctx.beginPath(); ctx.arc(240,280,45,0,Math.PI*2); ctx.stroke();
      // beak
      ctx.beginPath(); ctx.moveTo(200,280); ctx.lineTo(160,275); ctx.lineTo(200,265); ctx.stroke();
      // wings up
      ctx.beginPath(); ctx.moveTo(340,320); ctx.quadraticCurveTo(480,180,560,140); ctx.quadraticCurveTo(470,260,430,330); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(300,320); ctx.quadraticCurveTo(400,200,480,180); ctx.quadraticCurveTo(400,280,370,330); ctx.stroke();
      // eye
      ctx.beginPath(); ctx.arc(230,268,6,0,Math.PI*2); ctx.stroke();
      // tail
      ctx.beginPath(); ctx.moveTo(430,380); ctx.lineTo(520,420); ctx.lineTo(430,420); ctx.stroke();
      // olive branch
      ctx.beginPath(); ctx.moveTo(200,290); ctx.quadraticCurveTo(120,380,80,430); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(110,400,18,8,-0.6,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("鴿",120,530);
    }},
    {name:"彩虹", emoji:"🌈", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round";
      for(var i=0;i<4;i++){ ctx.beginPath(); ctx.arc(320,420,190-i*40,Math.PI,0); ctx.stroke(); }
      // clouds
      [[140,240],[500,240]].forEach(function(p){ ctx.beginPath(); ctx.arc(p[0],p[1],34,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(p[0]-26,p[1]+14,24,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(p[0]+26,p[1]+14,24,0,Math.PI*2); ctx.stroke(); });
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("虹",270,560);
    }},
    {name:"房子", emoji:"🏠", draw:function(){
      ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
      // walls
      ctx.strokeRect(180,320,280,190);
      // roof
      ctx.beginPath(); ctx.moveTo(140,320); ctx.lineTo(320,180); ctx.lineTo(500,320); ctx.stroke();
      // door
      ctx.strokeRect(280,380,80,130);
      // windows
      ctx.strokeRect(205,360,55,55); ctx.strokeRect(380,360,55,55);
      // chimney
      ctx.strokeRect(410,200,40,70);
      // sun
      ctx.beginPath(); ctx.arc(520,120,30,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle="#d9d0ea"; ctx.font="26px sans-serif"; ctx.fillText("家",140,560);
    }},
  ];

  var cur = SCENES[0];
  var sceneBox = document.getElementById("scenes");
  sceneBox.innerHTML = SCENES.map(function(s,i){
    return '<button class="scene-tab' + (i===0?" on":"") + '" data-i="' + i + '">' + s.emoji + ' ' + s.name + '</button>';
  }).join("");
  sceneBox.addEventListener("click", function(e){
    var b = e.target.closest(".scene-tab"); if(!b) return;
    cur = SCENES[+b.getAttribute("data-i")];
    document.querySelectorAll(".scene-tab").forEach(function(s){ s.classList.toggle("on", s===b); });
    drawScene(cur);
    hint("來幫「" + cur.name + "」塗上顏色吧！");
  });

  function drawScene(sc){
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle="#ffffff"; ctx.fillRect(0,0,W,H);
    ctx.strokeStyle="#d9d0ea"; ctx.lineWidth=4; ctx.lineJoin="round"; ctx.lineCap="round";
    sc.draw();
  }

  /* ----- 繪畫 ----- */
  function pos(e){
    var r = cvs.getBoundingClientRect();
    var t = e.touches ? e.touches[0] : e;
    var scaleX = W / r.width, scaleY = H / r.height;
    return { x: (t.clientX - r.left) * scaleX, y: (t.clientY - r.top) * scaleY };
  }
  cvs.addEventListener("mousedown", function(e){ drawing = true; var p = pos(e); lastX = p.x; lastY = p.y; paint(p.x,p.y); e.preventDefault(); });
  cvs.addEventListener("mousemove", function(e){ if(!drawing) return; var p = pos(e); paint(p.x,p.y); lastX = p.x; lastY = p.y; e.preventDefault(); });
  window.addEventListener("mouseup", function(){ drawing = false; });
  cvs.addEventListener("touchstart", function(e){ drawing = true; var p = pos(e); lastX = p.x; lastY = p.y; paint(p.x,p.y); e.preventDefault(); }, {passive:false});
  cvs.addEventListener("touchmove", function(e){ if(!drawing) return; var p = pos(e); paint(p.x,p.y); lastX = p.x; lastY = p.y; e.preventDefault(); }, {passive:false});
  cvs.addEventListener("touchend", function(){ drawing = false; });

  function paint(x, y){
    if(stampEmoji){
      ctx.font = "90px sans-serif";
      ctx.fillText(stampEmoji, x - 45, y + 30);
      return;
    }
    ctx.strokeStyle = erasing ? "#ffffff" : color;
    ctx.lineWidth = erasing ? size * 2.5 : size;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  drawScene(cur);
  hint("選一支畫筆，開始塗色吧！");
})();
