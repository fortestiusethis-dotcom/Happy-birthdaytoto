'use strict';
(() => {
  const config = window.BIRTHDAY_CONFIG;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const sceneIds = ['intro', 'letter', 'birthday', 'surprises'];
  let scene = 'intro', openTimer, toastTimer, blown = false;
  let audioContext, soundTimer, audioNodes = [], confettiFrame;

  $$('[data-text]').forEach(el => {
    if (Object.hasOwn(config, el.dataset.text)) el.textContent = config[el.dataset.text];
  });
  document.title = `For ${config.to} · A little birthday surprise`;
  $('#open-envelope').setAttribute('aria-label', `Open ${config.to}'s birthday letter — افتحي الرسالة`);
  $('.postage > span').textContent = config.age;
  $('#birthday-message').textContent = config.birthdayMessage;
  $('#keepsake-text').textContent = config.keepsake;
  $('#music-title').textContent = config.playlistTitle;
  const n = Number(config.age), lastTwo = n % 100;
  const suffix = lastTwo >= 11 && lastTwo <= 13 ? 'th' : ({1:'st',2:'nd',3:'rd'}[n % 10] || 'th');
  $('#ordinal-age').textContent = `${n}${suffix}`;
  config.letter.forEach(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    $('#letter-body').append(paragraph);
  });
  try {
    if (config.playlistUrl) {
      const url = new URL(config.playlistUrl);
      if (url.protocol === 'https:') {
        $('#playlist-link').href = url.href;
        $('#playlist-link').hidden = false;
        $('#playlist-description').textContent = 'أغاني مختارة ليومك، ونغمة صغيرة للمفاجأة.';
      }
    }
  } catch { /* An invalid optional URL leaves the placeholder intact. */ }

  function toast(message) {
    clearTimeout(toastTimer);
    $('#toast').textContent = message;
    $('#toast').classList.add('visible');
    toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3500);
  }
  function showScene(id, moveFocus = true) {
    if (!sceneIds.includes(id)) id = 'intro';
    clearTimeout(openTimer);
    const changed = id !== scene;
    scene = id;
    $$('.scene').forEach(el => { el.hidden = el.id !== id; });
    $$('.journey a').forEach(el => {
      if (el.hash === `#${id}`) el.setAttribute('aria-current', 'step');
      else el.removeAttribute('aria-current');
    });
    $('#open-envelope').classList.remove('opening');
    $('#open-envelope').disabled = false;
    $('#open-envelope').removeAttribute('aria-busy');
    if (changed || moveFocus) {
      window.scrollTo({top: 0, behavior: 'instant'});
      if (moveFocus) $(`#${id} h1`).focus({preventScroll:true});
    }
  }
  function go(id) {
    if (location.hash === `#${id}`) showScene(id);
    else location.hash = id;
  }
  window.addEventListener('hashchange', () => showScene(location.hash.slice(1)));
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    $('#main').setAttribute('tabindex','-1');
    $('#main').focus();
  });
  $$('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
  $('#open-envelope').addEventListener('click', () => {
    const button = $('#open-envelope');
    button.classList.add('opening');
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    openTimer = setTimeout(() => go('letter'), reducedMotion.matches ? 0 : 1000);
  });
  showScene(location.hash.slice(1) || 'intro', false);

  function confetti() {
    if (reducedMotion.matches) return;
    cancelAnimationFrame(confettiFrame);
    const canvas = $('#confetti'), ctx = canvas.getContext('2d');
    const w = innerWidth, h = innerHeight, ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * ratio; canvas.height = h * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const colors = ['#efdab4','#bf8c70','#ab5d73','#dec58b','#f9e7d0'];
    const particles = Array.from({length:100}, () => ({
      x:w*.5, y:h*.5, vx:(Math.random()-.5)*14,
      vy:-Math.random()*12-3, size:4+Math.random()*5,
      rotation:Math.random()*Math.PI, spin:(Math.random()-.5)*.2,
      color:colors[Math.floor(Math.random()*colors.length)]
    }));
    let start, previous;
    function frame(time) {
      if (!start) { start = time; previous = time; }
      const dt = Math.min((time - previous)/16.67, 2); previous = time;
      const elapsed = time-start;
      ctx.clearRect(0,0,w,h);
      ctx.globalAlpha = Math.max(0, 1-Math.max(0,elapsed-2300)/1200);
      particles.forEach(p => {
        p.vy += .15*dt; p.x += p.vx*dt; p.y += p.vy*dt; p.rotation += p.spin*dt;
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rotation); ctx.fillStyle=p.color;
        ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size*.55); ctx.restore();
      });
      if (elapsed < 3500) confettiFrame = requestAnimationFrame(frame);
      else {ctx.clearRect(0,0,w,h);canvas.width=canvas.height=0;}
    }
    confettiFrame = requestAnimationFrame(frame);
  }
  $('#cake-button').addEventListener('click', () => {
    if (blown) return;
    blown = true;
    $('#cake-button').classList.add('blown');
    $('#cake-button').disabled = true;
    $('#cake-button').setAttribute('aria-label', 'The candles are out. Your wish is on its way.');
    $('#cake-note').textContent = 'here’s to your next chapter ♡';
    $('#cake-instruction').textContent = 'A little wish. A whole year of possibilities.';
    $('#wish-result').textContent = 'يا رب كل اللي بتتمنيه يبقى حقيقة ✨';
    $('#relight').hidden = false;
    confetti();
  });
  $('#relight').addEventListener('click', () => {
    blown = false;
    $('#cake-button').classList.remove('blown');
    $('#cake-button').disabled = false;
    $('#cake-button').setAttribute('aria-label','Blow out the birthday candles — اطفي الشمع');
    $('#cake-note').textContent = 'make a little wish…';
    $('#cake-instruction').textContent = 'tap the cake to blow out the candles';
    $('#wish-result').textContent = '';
    $('#relight').hidden = true;
    $('#cake-button').focus({preventScroll:true});
  });

  $$('[data-dialog]').forEach(button => button.addEventListener('click', () => {
    const dialog = document.getElementById(button.dataset.dialog);
    dialog.showModal(); document.body.classList.add('modal-open');
  }));
  $$('dialog').forEach(dialog => {
    $('.close-dialog',dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const r = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX<r.left || event.clientX>r.right || event.clientY<r.top || event.clientY>r.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {document.body.classList.remove('modal-open');stopChime();});
  });

  function stopChime() {
    clearTimeout(soundTimer);
    audioNodes.forEach(node => { try {node.stop();} catch {} });
    audioNodes = [];
    $('#play-chime').setAttribute('aria-pressed','false');
    $('#play-chime').textContent = 'Play a little birthday chime ♪';
    $('.modal-record').classList.remove('playing');
    $('#music-status').textContent = 'Sound only plays when you press play.';
  }
  $('#play-chime').addEventListener('click', async () => {
    if ($('#play-chime').getAttribute('aria-pressed') === 'true') {stopChime();return;}
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      audioContext ||= new Audio();
      await audioContext.resume();
      if (!$('#music-dialog').open) return;
      // An original, short pentatonic chime. No external recording or invented track.
      const notes = [523.25,659.25,783.99,1046.5,880,783.99,659.25,783.99,1046.5];
      const start = audioContext.currentTime + .05;
      notes.forEach((frequency, i) => {
        const osc = audioContext.createOscillator(), gain = audioContext.createGain();
        osc.type = 'sine'; osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0,start+i*.42);
        gain.gain.linearRampToValueAtTime(.11,start+i*.42+.02);
        gain.gain.exponentialRampToValueAtTime(.001,start+i*.42+1.1);
        osc.connect(gain); gain.connect(audioContext.destination);
        osc.start(start+i*.42); osc.stop(start+i*.42+1.15);
        osc.onended = () => {osc.disconnect();gain.disconnect();};
        audioNodes.push(osc);
      });
      $('#play-chime').textContent = 'Stop the little chime ◼';
      $('#play-chime').setAttribute('aria-pressed','true');
      $('.modal-record').classList.add('playing');
      $('#music-status').textContent = 'A little original chime, made for this surprise.';
      soundTimer = setTimeout(stopChime, 4800);
    } catch {toast('Sound is unavailable in this browser. Try opening the site in your browser.');stopChime();}
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopChime();
      cancelAnimationFrame(confettiFrame);
      $('#confetti').width=$('#confetti').height=0;
    }
  });

  function wrapText(ctx, text, maxWidth) {
    const words = text.split(' '), lines = []; let line = '';
    words.forEach(word => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {lines.push(line);line=word;}
      else line=next;
    });
    if (line) lines.push(line);
    return lines;
  }
  async function downloadCard(kind, treat) {
    await document.fonts.ready;
    const canvas = document.createElement('canvas'); canvas.width=1080;canvas.height=1350;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle='#571f30';ctx.fillRect(0,0,1080,1350);
    ctx.fillStyle='#f7eedc';ctx.fillRect(70,80,940,1190);
    ctx.strokeStyle='#c2a780';ctx.lineWidth=2;ctx.strokeRect(95,105,890,1140);
    ctx.textAlign='center';ctx.direction='ltr';
    ctx.fillStyle='#946b53';ctx.font='20px "Segoe UI",sans-serif';
    ctx.fillText(kind==='note'?'THE NOVEMBER POST · A NOTE TO KEEP':'THE NOVEMBER POST · ONE VERY GOOD DAY',540,195);
    ctx.fillStyle='#82384b';ctx.font='110px Georgia,serif';ctx.fillText('✧',540,365);
    ctx.font='italic 76px PostSerif,Georgia,serif';ctx.fillText(`For ${config.to}`,540,490);
    ctx.direction='rtl';ctx.fillStyle='#643849';ctx.font='42px PostArabic,"Segoe UI",Tahoma,sans-serif';
    const message = kind==='note' ? config.keepsake : `${treat} ♡\nالعزومة عليّا، واليوم نختاره سوا.\nكارت ليوم حلو، من غير تاريخ انتهاء.`;
    let y=620;
    message.split('\n').forEach(paragraph => {
      wrapText(ctx,paragraph,730).forEach(line => {ctx.fillText(line,540,y);y+=82;});
      y+=20;
    });
    ctx.fillStyle='#8b6957';ctx.font='36px PostArabic,"Segoe UI",Tahoma,sans-serif';
    ctx.fillText(`من ${config.fromArabic} ♡`,540,1070);
    ctx.direction='ltr';ctx.font='italic 29px PostSerif,Georgia,serif';
    ctx.fillText(`${config.date} · ${config.age} years of you`,540,1160);
    canvas.toBlob(blob => {
      if (!blob) {toast('The card could not be saved. Please try again.');return;}
      const url=URL.createObjectURL(blob), link=document.createElement('a');
      link.href=url;link.download=`${config.to.toLowerCase().replace(/[^a-z0-9-]/g,'')||'birthday'}-${kind==='note'?'birthday-note':'treat-card'}.png`;
      document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),30000);
      toast('Your card is ready — check your downloads ♡');
    },'image/png');
  }
  $('#download-note').addEventListener('click', () => downloadCard('note'));
  $('#treat-form').addEventListener('submit', event => {
    event.preventDefault();
    const treat = new FormData(event.currentTarget).get('treat');
    downloadCard('treat',treat);
    $('#treat-status').textContent = `اختيارك: ${treat} ♡ احتفظي بالكارت وابعتيه لمصطفى.`;
  });
})();
