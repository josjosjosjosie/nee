// Interactive features for the 'Nee' site
// - copy buttons
// - search filtering for examples
// - reveal animations (staggered + IntersectionObserver)
// - smooth anchor scrolling with header offset and reduced-motion support
// - inline SVG inlining + stroke/fill animations triggered on reveal

document.addEventListener('DOMContentLoaded', ()=>{
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const headerEl = document.querySelector('.header');
  const headerOffset = headerEl ? headerEl.offsetHeight + 16 : 88;

  // COPY BUTTONS
  document.querySelectorAll('.btn.copy').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const txt = btn.dataset.text || btn.getAttribute('data-text') || '';
      try{
        if(navigator && navigator.clipboard && navigator.clipboard.writeText){
          await navigator.clipboard.writeText(txt);
          const prev = btn.textContent;
          btn.textContent='Gekopieerd ✓';
          setTimeout(()=>btn.textContent=prev,1200);
        } else {
          const el = document.createElement('textarea'); el.value = txt; el.style.position='fixed'; el.style.left='-9999px'; document.body.appendChild(el); el.select();
          try{ document.execCommand('copy'); btn.textContent='Gekopieerd ✓'; setTimeout(()=>btn.textContent='Kopieer',1200);}catch(e){ btn.textContent='Kopieer (CTRL+C)'}
          document.body.removeChild(el);
        }
      }catch(e){
        btn.textContent='Kopieer (CTRL+C)';
        setTimeout(()=>btn.textContent='Kopieer',1200);
      }
    })
  })

  // SIMPLE SEARCH FILTER FOR EXAMPLES
  const search = document.getElementById('example-search');
  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase().trim();
      document.querySelectorAll('.example').forEach(ex=>{
        const text = (ex.dataset.text || ex.textContent || '').toLowerCase();
        ex.style.display = text.includes(q)?'flex':'none';
      })
    })
  }

  // INLINE SVGs: fetch external SVG files and inline them so we can animate paths
  async function inlineSVGImages(){
    const imgs = Array.from(document.querySelectorAll('.art-figure img[src$=".svg"]'));
    await Promise.all(imgs.map(async (img)=>{
      const src = img.getAttribute('src');
      try{
        const res = await fetch(src);
        if(!res.ok) return;
        const text = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'image/svg+xml');
        let svg = doc.querySelector('svg');
        if(!svg) return;
        svg = document.importNode(svg, true);
        const alt = img.getAttribute('alt') || img.getAttribute('aria-label') || '';
        if(alt){
          if(!svg.querySelector('title')){
            const title = document.createElementNS('http://www.w3.org/2000/svg','title');
            title.textContent = alt;
            svg.insertBefore(title, svg.firstChild);
          }
          svg.setAttribute('role','img');
          svg.setAttribute('aria-label', alt);
        }
        svg.classList.add('inline-svg');
        img.parentNode.replaceChild(svg, img);
        prepareSVGAnimation(svg);
      }catch(err){
        console.warn('Failed inlining SVG', src, err);
      }
    }));
  }

  function prepareSVGAnimation(svg){
    if(!svg) return;
    // collect shape elements
    const tags = ['path','line','polyline','polygon','circle','ellipse','rect'];
    const elements = [];
    tags.forEach(t => svg.querySelectorAll(t).forEach(el => elements.push(el)));

    let strokeCount = 0;
    elements.forEach((el, idx)=>{
      const tag = el.tagName.toLowerCase();
      const cs = getComputedStyle(el);
      const stroke = el.getAttribute('stroke') || cs.stroke || '';
      const fill = el.getAttribute('fill') || cs.fill || '';

      // Stroked elements: try to get length
      if((tag==='path' || tag==='line' || tag==='polyline' || tag==='polygon' || tag==='circle' || tag==='ellipse') && stroke && stroke !== 'none'){
        try{
          const len = (typeof el.getTotalLength === 'function') ? el.getTotalLength() : 0;
          if(len > 0){
            if(!prefersReduced){
              el.style.strokeDasharray = len;
              el.style.strokeDashoffset = len;
              el.style.transition = `stroke-dashoffset 900ms cubic-bezier(.22,.9,.36,1)`;
              el.style.transitionDelay = `${Math.min(strokeCount * 90, 900)}ms`;
            } else {
              el.style.strokeDasharray = len;
              el.style.strokeDashoffset = 0;
            }
            el.classList.add('svg-stroke');
            strokeCount++;
          }
        }catch(e){ /* ignore */ }
      }

      // Filled elements: animate fill opacity slightly
      if(fill && fill !== 'none'){
        if(!prefersReduced){
          el.style.fillOpacity = 0;
          el.style.transition = `fill-opacity 700ms ease`;
          el.style.transitionDelay = `${Math.min(idx * 60, 700)}ms`;
        } else {
          el.style.fillOpacity = 1;
        }
      }
    });

    // initial svg state
    if(!prefersReduced){
      svg.style.opacity = 0;
      svg.style.transform = 'translateY(8px) scale(0.995)';
      svg.style.transition = 'opacity 520ms ease, transform 520ms ease';
    } else {
      svg.style.opacity = 1;
    }

    // if parent reveal is already visible, animate now
    const revealParent = svg.closest('.reveal');
    if(revealParent && revealParent.classList.contains('visible')){
      setTimeout(()=> animateSVG(svg), 80);
    }
  }

  function animateSVG(svg){
    if(!svg) return;
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      svg.style.opacity = 1;
      svg.style.transform = 'none';
      svg.querySelectorAll('*').forEach(el=>{
        if(el.style && el.style.strokeDashoffset !== undefined) el.style.strokeDashoffset = 0;
        if(el.style && el.style.fillOpacity !== undefined) el.style.fillOpacity = 1;
      });
      return;
    }

    svg.style.opacity = 1;
    svg.style.transform = 'none';

    // animate stroked elements
    const stroked = svg.querySelectorAll('.svg-stroke');
    stroked.forEach((el, i)=>{
      // staggered trigger (tiny delay to allow transitions to apply)
      setTimeout(()=>{
        try{ el.style.strokeDashoffset = 0; }catch(e){}
      }, 30 + i * 80);
    });

    // animate fillable elements
    Array.from(svg.querySelectorAll('[style*="fillOpacity"], [style*="fill-opacity"], rect, circle, ellipse')).forEach((el, i)=>{
      // if fillOpacity was set earlier
      if(el.style && ('fillOpacity' in el.style || 'fill-opacity' in el.style || el.getAttribute('fill'))){
        setTimeout(()=>{ el.style.fillOpacity = 1; }, 40 + i * 60);
      }
    });
  }

  // inline SVGs now
  inlineSVGImages();

  // SMOOTH ANCHOR SCROLLING
  document.querySelectorAll('a[href^="#"]').forEach(link=>{
    if(link.getAttribute('href') === '#') return;
    link.addEventListener('click', (e)=>{
      const href = link.getAttribute('href');
      if(!href || !href.startsWith('#')) return;
      const target = document.querySelector(href);
      if(target){
        e.preventDefault();
        const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: targetY, behavior: prefersReduced ? 'auto' : 'smooth' });
        setTimeout(()=>{
          if(!target.hasAttribute('tabindex')) target.setAttribute('tabindex','-1');
          target.focus({preventScroll:true});
        }, prefersReduced ? 50 : 500);
        try{ history.replaceState(null, '', href); }catch(e){}
      }
    })
  })

  // If page loads with a hash, adjust scroll to account for header offset
  if(location.hash){
    const target = document.querySelector(location.hash);
    if(target){
      setTimeout(()=>{
        const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({ top: targetY, behavior: 'auto' });
      }, 50);
    }
  }

  // REVEAL ANIMATIONS (intersection observer) - triggers svg animations inside
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries, observer)=>{
      entries.forEach((entry)=>{
        if(entry.isIntersecting){
          const el = entry.target;
          const baseIndex = reveals.indexOf(el);
          const delay = Math.min(baseIndex * 80, 480);
          setTimeout(()=>{
            el.classList.add('visible');
            // animate any inline svgs inside
            el.querySelectorAll('.inline-svg').forEach(svg=> animateSVG(svg));
          }, delay);
          observer.unobserve(el);
        }
      });
    }, {root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08});

    reveals.forEach(el=> io.observe(el));
  } else {
    reveals.forEach((el,i)=> setTimeout(()=>{
      el.classList.add('visible');
      el.querySelectorAll('.inline-svg').forEach(svg=> animateSVG(svg));
    }, i*80));
  }

  // Fallback: reveal everything after a timeout (in case observer missed)
  setTimeout(()=>{
    reveals.forEach((el)=>{
      if(!el.classList.contains('visible')){
        el.classList.add('visible');
        el.querySelectorAll('.inline-svg').forEach(svg=> animateSVG(svg));
      }
    })
  }, 1200);

});
