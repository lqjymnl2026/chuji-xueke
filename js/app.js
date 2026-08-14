/* ===== 學課互動樂園 邏輯 ===== */
(function(){
  "use strict";

  var KEY = "chuji_stars_v1";

  function getLessons(){ return window.LESSONS || []; }
  function getProgress(){
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; }
  }
  function saveProgress(p){ localStorage.setItem(KEY, JSON.stringify(p)); }
  function lessonStars(id){
    var p = getProgress()[id] || {};
    return [!!p.story, !!p.verse, !!p.third];
  }
  function setStar(id, which){
    var p = getProgress();
    if(!p[id]) p[id] = {};
    p[id][which] = true;
    saveProgress(p);
  }
  function totalStars(){
    var sum = 0, max = 0;
    getLessons().forEach(function(l){
      max += 3;
      lessonStars(l.id).forEach(function(g){ if(g) sum++; });
    });
    return {sum:sum, max:max};
  }
  function toast(msg){
    var t = document.getElementById("toast");
    if(!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function(){ t.classList.remove("show"); }, 2200);
  }
  function confetti(){
    var emojis = ["⭐","🌟","🎉","💖","🌈","✨","🎊"];
    for(var i=0;i<14;i++){
      var s = document.createElement("span");
      s.className = "confetti";
      s.textContent = emojis[Math.floor(Math.random()*emojis.length)];
      s.style.left = (10 + Math.random()*80) + "vw";
      s.style.top = (20 + Math.random()*30) + "vh";
      s.style.animationDelay = (Math.random()*.3) + "s";
      document.body.appendChild(s);
      setTimeout(function(el){ el.remove(); }, 1500);
    }
  }

  /* ---------- 朗讀：Edge 神經語音 + 瀏覽器兜底 ---------- */
  var VOICE_KEY = "xueke_voice_v1";
  var voices = [];
  function loadVoices(){ voices = window.speechSynthesis ? speechSynthesis.getVoices() : []; }
  if(window.speechSynthesis){
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }
  function getVoicePref(){
    try { return localStorage.getItem(VOICE_KEY) || "auto"; } catch(e){ return "auto"; }
  }
  function setVoicePref(v){ try { localStorage.setItem(VOICE_KEY, v); } catch(e){} }

  var VOICE_OPTIONS = [
    {id:"auto",     name:"✨ 自動（推薦）", desc:"根據瀏覽器自動選最好的中文聲音"},
    {id:"xiaoxiao", name:"👩 曉曉（溫柔女聲）", desc:"Edge 神經語音 zh-CN-XiaoxiaoNeural"},
    {id:"yunxi",    name:"🧑 雲希（陽光男聲）", desc:"Edge 神經語音 zh-CN-YunxiNeural"},
    {id:"xiaoyi",   name:"🧒 曉伊（卡通活潑）", desc:"Edge 神經語音 zh-CN-XiaoyiNeural"},
  ];
  function voiceServerName(id){
    var m = {auto:"xiaoxiao", xiaoxiao:"xiaoxiao", yunxi:"yunxi", xiaoyi:"xiaoyi"};
    return m[id] || "xiaoxiao";
  }

  /* 语音：使用浏览器内置 TTS（GitHub Pages 无 /tts 后端，直接浏览器朗读，稳定不卡）*/
  var serverTTS = false;
  function probeServerTTS(){
    return Promise.resolve(false);
  }

  var audioEl = null;
  function stopSpeak(){
    if(window.speechSynthesis) speechSynthesis.cancel();
    if(audioEl){ audioEl.pause(); audioEl = null; }
  }

  function speakTextViaServer(text, onend){
    var name = voiceServerName(getVoicePref());
    var url = "/tts?text=" + encodeURIComponent(text.slice(0, 800)) + "&voice=" + name;
    audioEl = new Audio();
    audioEl.id = "ttsAudio";
    audioEl.src = url;
    audioEl.style.display = "none";
    if(!document.getElementById("ttsAudio")) document.body.appendChild(audioEl);
    audioEl.onended = function(){ if(onend) onend(); };
    audioEl.onerror = function(){ serverTTS = false; if(onend) onend(); };
    audioEl.play().catch(function(){ serverTTS = false; if(onend) onend(); });
  }

  function pickVoice(){
    var pref = getVoicePref();
    var zh = voices.filter(function(v){ return /zh|cmn|Chinese/i.test(v.lang + " " + v.name); });
    function find(pat){
      for(var i=0;i<zh.length;i++){
        if(pat.test(zh[i].name) || pat.test(zh[i].lang)) return zh[i];
      }
      return null;
    }
    var targets = {
      xiaoxiao: /xiaoxiao|晓晓|曉曉/i,
      yunxi: /yunxi|云希|雲希/i,
      xiaoyi: /xiaoyi|晓伊|曉伊/i,
    };
    if(pref !== "auto" && targets[pref]){
      var v = find(targets[pref]);
      if(v) return v;
    }
    var order = ["zh-TW","zh-HK","zh-CN","zh"];
    for(var i2=0;i2<order.length;i2++){
      for(var j=0;j<zh.length;j++){
        if(zh[j].lang && zh[j].lang.toLowerCase().indexOf(order[i2].toLowerCase()) === 0) return zh[j];
      }
    }
    return zh[0] || null;
  }

  function synthSpeak(text, onend){
    if(!window.speechSynthesis){ if(onend) onend(); return; }
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = "zh-TW";
    u.rate = 0.85; u.pitch = 1.05;
    var v = pickVoice();
    if(v){ u.voice = v; u.lang = v.lang; }
    if(onend) u.onend = onend;
    speechSynthesis.speak(u);
  }
  function speak(text, onend){
    if(!window.speechSynthesis && !audioEl){ if(onend) onend(); return; }
    if(serverTTS === true){ speakTextViaServer(text, onend); return; }
    if(serverTTS === null){
      probeServerTTS().then(function(ok){
        if(ok){ speakTextViaServer(text, onend); return; }
        synthSpeak(text, onend);
      });
      return;
    }
    synthSpeak(text, onend);
  }

  /* 语音设置面板 */
  function initVoiceUI(){
    var fab = document.getElementById("voiceFab");
    if(!fab) return;
    var panel = document.getElementById("voicePanel");
    fab.addEventListener("click", function(){ panel.classList.toggle("show"); });
    var list = document.getElementById("voiceList");
    list.innerHTML = VOICE_OPTIONS.map(function(o){
      return '<button class="vopt" data-v="' + o.id + '"><b>' + o.name + '</b><span>' + o.desc + '</span></button>';
    }).join("");
    function refresh(){
      var cur = getVoicePref();
      list.querySelectorAll(".vopt").forEach(function(b){
        b.classList.toggle("on", b.getAttribute("data-v") === cur);
      });
    }
    list.addEventListener("click", function(e){
      var b = e.target.closest(".vopt"); if(!b) return;
      setVoicePref(b.getAttribute("data-v"));
      refresh();
      toast("🎙️ 語音已切換：" + (b.querySelector("b")||{}).textContent || "");
    });
    refresh();
    document.getElementById("voiceClose").addEventListener("click", function(){ panel.classList.remove("show"); });
    panel.addEventListener("click", function(e){ if(e.target === panel) panel.classList.remove("show"); });
    // 显示服务器/浏览器引擎状态
    probeServerTTS().then(function(ok){
      var st = document.getElementById("voiceStatus");
      if(st) st.textContent = ok ? "🔊 引擎：Edge 神經語音（伺服器）" : "🔊 引擎：瀏覽器語音（Edge 開啟時可選曉曉/雲希）";
    });
  }

  /* ================= 首頁 ================= */
  function renderHome(){
    var lessons = getLessons();
    if(!lessons.length) return;
    var track = "chuji";

    function quartersOf(t){
      var qs = [];
      lessons.forEach(function(l){ if(l.track === t && qs.indexOf(l.quarter) < 0) qs.push(l.quarter); });
      return qs;
    }

    function draw(){
      var qs = quartersOf(track);
      var cur = qs[0];
      var t = document.getElementById("qtabs");
      t.innerHTML = qs.map(function(q, i){
        return '<button class="qtab' + (i===0?" on":"") + '" data-q="' + q + '">' + q + '</button>';
      }).join("");
      function drawQ(q){
        cur = q;
        var list = lessons.filter(function(l){ return l.quarter === q; });
        var box = document.getElementById("lessons");
        box.innerHTML = list.map(function(l){
          var st = lessonStars(l.id);
          var got = st.filter(Boolean).length;
          var stars = st.map(function(g){ return g ? "⭐" : "☆"; }).join("");
          return '<a class="lesson-card" href="lesson.html?id=' + l.id + '">' +
            '<span class="icon">' + l.emoji + '</span>' +
            '<div class="lno">第 ' + l.lesson_no + ' 課</div>' +
            '<div class="ltitle">' + l.title + '</div>' +
            '<div class="stars">' + stars + '</div>' +
            '<span class="go" style="background:' + l.qcolor + '">' + (got>0 ? "繼續 ▶" : "開始 ▶") + '</span>' +
          '</a>';
        }).join("");
        document.querySelectorAll("#qtabs .qtab").forEach(function(b){
          b.classList.toggle("on", b.getAttribute("data-q") === q);
        });
      }
      t.addEventListener("click", function(e){
        var b = e.target.closest(".qtab");
        if(b) drawQ(b.getAttribute("data-q"));
      });
      drawQ(cur);
      document.getElementById("qh").textContent = track === "chuji" ? "🧸 初級學課 · 選擇學季" : "📖 高級學課 · 選擇學季";
    }

    document.querySelectorAll(".track-btn").forEach(function(b){
      b.addEventListener("click", function(){
        if(b.classList.contains("paint")) return;
        track = b.getAttribute("data-track");
        document.querySelectorAll(".track-btn").forEach(function(x){ x.classList.toggle("on", x === b && !x.classList.contains("paint")); });
        draw();
      });
    });
    draw();

    var ts = totalStars();
    document.getElementById("starTotal").textContent = ts.sum;
    document.getElementById("starMax").textContent = ts.max;
    document.getElementById("barFill").style.width = (ts.max ? Math.round(ts.sum/ts.max*100) : 0) + "%";
    document.getElementById("pct").textContent = (ts.max ? Math.round(ts.sum/ts.max*100) : 0) + "%";
  }

  /* ================= 課程頁 ================= */
  function splitSentences(text){
    var parts = text.split(/(?<=[。！？!?])/);
    var out = [];
    parts.forEach(function(p){
      p = p.replace(/[「」"“”·•\s]/g, "").trim();
      if(p.length >= 8 && p.length <= 40) out.push(p);
    });
    return out.slice(0, 4);
  }

  function renderMatching(l, onDone){
    var lessons = getLessons();
    var box = document.getElementById("matchBox");
    if(!box) return;
    var quotes = splitSentences(l.story.join ? l.story.join("") : l.story);
    if(quotes.length < 3) quotes = [l.title].concat(quotes);
    quotes = quotes.slice(0, 4);
    // 干扰标题：同轨其他课
    var others = lessons.filter(function(x){ return x.track === l.track && x.id !== l.id; });
    var distractor = [];
    var idx = lessons.indexOf(l);
    var need = quotes.length - 1;
    for(var k=1; distractor.length < need && k <= others.length; k++){
      var o = others[(idx + k * 7) % others.length];
      if(distractor.indexOf(o.title) < 0 && o.title !== l.title) distractor.push(o.title);
    }
    var titles = [l.title].concat(distractor);
    // shuffle titles
    var tOrder = titles.map(function(t,i){ return i; });
    for(var i=tOrder.length-1;i>0;i--){ var j=Math.floor(Math.random()*(i+1)); var tmp=tOrder[i]; tOrder[i]=tOrder[j]; tOrder[j]=tmp; }
    var qOrder = quotes.map(function(q,i){ return i; });
    for(var i2=qOrder.length-1;i2>0;i2--){ var j2=Math.floor(Math.random()*(i2+1)); var tmp2=qOrder[i2]; qOrder[i2]=qOrder[j2]; qOrder[j2]=tmp2; }

    box.innerHTML =
      '<div class="match-wrap" id="matchWrap">' +
        '<div class="match-col">' + qOrder.map(function(i){
          return '<div class="mcard mq" data-q="' + i + '">' + quotes[i] + '</div>';
        }).join("") + '</div>' +
        '<div class="match-col">' + tOrder.map(function(i){
          return '<div class="mcard mt" data-t="' + i + '">' + titles[i] + '</div>';
        }).join("") + '</div>' +
        '<svg class="match-lines" id="matchLines"></svg>' +
      '</div>';

    var selQ = -1;
    var matched = {};
    var done = 0;
    box.querySelectorAll(".mq").forEach(function(c){
      c.addEventListener("click", function(){
        var i = +c.getAttribute("data-q");
        if(matched[i]) return;
        box.querySelectorAll(".mq").forEach(function(x){ x.classList.remove("sel"); });
        c.classList.add("sel");
        selQ = i;
      });
    });
    box.querySelectorAll(".mt").forEach(function(c){
      c.addEventListener("click", function(){
        var ti = +c.getAttribute("data-t");
        if(selQ < 0) return;
        if(titles[ti] === l.title){
          // correct
          matched[selQ] = true; done++;
          var qc = box.querySelector('.mq[data-q="' + selQ + '"]');
          qc.classList.remove("sel"); qc.classList.add("ok");
          c.classList.add("ok");
          drawLine(qc, c);
          selQ = -1;
          if(done >= quotes.length){
            if(onDone) onDone();
            box.querySelectorAll(".mt,.mq").forEach(function(x){ x.classList.add("dim"); });
          }
        } else {
          c.classList.add("bad");
          setTimeout(function(){ c.classList.remove("bad"); }, 500);
        }
      });
    });

    function drawLine(a, b){
      var svg = document.getElementById("matchLines");
      var wrap = document.getElementById("matchWrap");
      var wr = wrap.getBoundingClientRect();
      var ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
      var x1 = ar.right - wr.left, y1 = ar.top + ar.height/2 - wr.top;
      var x2 = br.left - wr.left, y2 = br.top + br.height/2 - wr.top;
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1); line.setAttribute("y1", y1);
      line.setAttribute("x2", x2); line.setAttribute("y2", y2);
      line.setAttribute("stroke", "#3ecf8e"); line.setAttribute("stroke-width", "3");
      svg.appendChild(line);
    }
  }

  function renderLesson(){
    var id = new URLSearchParams(location.search).get("id");
    var l = getLessons().filter(function(x){ return x.id === id; })[0];
    if(!l){ location.href = "index.html"; return; }

    document.title = l.title + " - 學課互動樂園";
    var ltop = document.getElementById("ltop");
    ltop.style.setProperty("--lc1", l.qcolor);
    ltop.style.setProperty("--lc2", "#fecfef");
    document.getElementById("qchip").textContent = (l.track === "chuji" ? "🧸 " : "📖 ") + l.quarter;
    document.getElementById("lico").textContent = l.emoji;
    document.getElementById("ltitle").textContent = l.title;
    document.getElementById("ljingwen").textContent = l.jingwen || "（見課本）";
    document.getElementById("lxinxi").textContent = l.xinxi || l.summary || "耶穌愛你！";
    document.getElementById("laction").textContent = l.action || "和同學分享今天學到的故事。";

    var m = l.cunxin && l.cunxin.match(/^「(.+?)」?\s*[（(]([^）)]+)[）)]/);
    var vText, ref;
    if(m){ vText = m[1]; ref = m[2]; }
    else {
      vText = l.cunxin ? l.cunxin.replace(/^「|」+$/g, "") : "上帝就是愛。";
      var rm = l.cunxin ? l.cunxin.match(/[（(]([^）)]+)[）)]/) : null;
      ref = rm ? rm[1] : "";
    }
    document.getElementById("lcunxin").textContent = "「" + vText + "」";
    document.getElementById("lref").textContent = ref ? "—— " + ref : "";

    /* 故事：初级多段 / 高级一大段 */
    var paras = Array.isArray(l.story) ? l.story.slice() : [l.story];
    if(paras.length === 1 && paras[0].length > 600){
      var big = paras[0];
      var chunks = [];
      var sentences = big.split(/(?<=[。！？!?])/);
      var curChunk = "";
      sentences.forEach(function(s){
        if((curChunk + s).length > 260 && curChunk){ chunks.push(curChunk); curChunk = s; }
        else curChunk += s;
      });
      if(curChunk) chunks.push(curChunk);
      paras = chunks;
    }
    var storyBox = document.getElementById("story");
    storyBox.innerHTML = paras.map(function(p, i){
      return '<div class="story-para"><span class="pnum">' + (i+1) + '</span>' + p +
        '<button class="say" data-i="' + i + '" title="朗讀">🔊</button></div>';
    }).join("");
    storyBox.querySelectorAll(".say").forEach(function(btn){
      btn.addEventListener("click", function(){
        speak(paras[+btn.getAttribute("data-i")]);
      });
    });
    document.getElementById("playAll").addEventListener("click", function(){ playStorySeq(paras, 0); });
    document.getElementById("stopAll").addEventListener("click", stopSpeak);
    document.getElementById("sayAll2").addEventListener("click", function(){ playStorySeq(paras, 0); });
    document.getElementById("doneStory").addEventListener("click", function(){
      earnStar("story", "⭐ 太棒了！故事關完成！");
    });

    document.getElementById("sayVerse").addEventListener("click", function(){ speak(l.cunxin || l.xinxi); });
    document.getElementById("doneVerse").addEventListener("click", function(){
      earnStar("verse", "💎 你記住存心節了，好厲害！");
    });

    /* 涂色链接 */
    document.getElementById("paintLink").href = "coloring.html";

    var isChuji = l.track === "chuji";
    document.getElementById("quizCard").style.display = isChuji ? "" : "none";
    document.getElementById("matchCard").style.display = isChuji ? "" : "";

    if(isChuji){
      renderQuiz(l);
      renderMatching(l, function(){ earnStar("third", "🔗 配對成功！你得到了配對星！"); }); // 额外娱乐
      document.getElementById("matchCard").style.display = "";
      var hint = document.getElementById("quizHint");
      if(hint) hint.textContent = "答對全部問題，就可以得到 ⭐";
    } else {
      document.getElementById("quizCard").style.display = "none";
      renderMatching(l, function(){ earnStar("third", "🔗 全部配對成功！你得到了配對星！"); });
    }

    function renderQuiz(lesson){
      var quizBox = document.getElementById("quiz");
      quizBox.innerHTML = lesson.questions.map(function(q, qi){
        var opts = lesson.options[qi].map(function(o, oi){
          return '<button class="qopt" data-q="' + qi + '" data-o="' + oi + '"><span class="key">' + "ABC"[oi] + '</span><span>' + o + '</span></button>';
        }).join("");
        return '<div class="q-item"><div class="qq">' + (qi+1) + '. ' + q + '</div><div class="q-opts">' + opts + '</div></div>';
      }).join("");
      quizBox.querySelectorAll(".qopt").forEach(function(btn){
        btn.addEventListener("click", function(){
          var qi = +btn.getAttribute("data-q");
          var oi = +btn.getAttribute("data-o");
          var opts = quizBox.querySelectorAll('.qopt[data-q="' + qi + '"]');
          if(btn.classList.contains("dim")) return;
          if(oi === lesson.answers[qi]){
            opts.forEach(function(b){ b.classList.add("dim"); });
            btn.classList.remove("dim");
            btn.classList.add("ok");
            var allOk = true;
            lesson.questions.forEach(function(_, q2){
              if(!quizBox.querySelector(".qopt[data-q=\"" + q2 + "\"].ok")) allOk = false;
            });
            if(allOk) earnStar("third", "🎉 全部答對！你得到了問答星！");
          } else {
            btn.classList.add("bad");
            setTimeout(function(){ btn.classList.remove("bad"); }, 500);
          }
        });
      });
    }

    function earnStar(which, msg){
      setStar(id, which);
      refreshStars();
      toast(msg);
      confetti();
    }
    function refreshStars(){
      var st = lessonStars(id);
      document.getElementById("stStory").classList.toggle("got", st[0]);
      document.getElementById("stVerse").classList.toggle("got", st[1]);
      document.getElementById("stThird").classList.toggle("got", st[2]);
      document.getElementById("stThird").querySelector(".sico").textContent = isChuji ? "⭐" : "⭐";
    }
    refreshStars();

    var all = getLessons();
    var idx = all.findIndex(function(x){ return x.id === id; });
    var nx = all[idx+1] || all[0];
    var nextBtn = document.getElementById("nextBtn");
    nextBtn.textContent = nx ? ("下一課 ▶ " + nx.emoji + " " + nx.title) : "✅ 完成！回到樂園";
    nextBtn.href = nx ? ("lesson.html?id=" + nx.id) : "index.html";
  }

  function playStorySeq(story, i){
    if(i >= story.length) return;
    speak(story[i], function(){ playStorySeq(story, i+1); });
  }

  function init(){
    if(document.getElementById("lessons")) renderHome();
    if(document.getElementById("ltop")) renderLesson();
    initVoiceUI();
  }
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else init();
})();
