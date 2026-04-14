// Interactive features for the 'Nee' site
// - copy buttons
// - search filtering for examples
// - reveal animations (staggered + IntersectionObserver)

document.addEventListener('DOMContentLoaded', ()=>{
  // copy example text
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
          // fallback: select nearby text and prompt
          const el = document.createElement('textarea'); el.value = txt; document.body.appendChild(el); el.select();
          try{ document.execCommand('copy'); btn.textContent='Gekopieerd ✓'; setTimeout(()=>btn.textContent='Kopieer',1200);}catch(e){ btn.textContent='Kopieer (CTRL+C)'}
          document.body.removeChild(el);
        }
      }catch(e){
        btn.textContent='Kopieer (CTRL+C)';
        setTimeout(()=>btn.textContent='Kopieer',1200);
      }
    })
  })

  // simple search filter for examples
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

  // Reveal animations: add .visible to .reveal elements on intersection or on load
  const reveals = Array.from(document.querySelectorAll('.reveal'));
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver((entries, observer)=>{
      entries.forEach((entry, idx)=>{
        if(entry.isIntersecting){
          const el = entry.target;
          // stagger based on position among reveals
          const baseIndex = reveals.indexOf(el);
          const delay = Math.min(baseIndex * 80, 480);
          setTimeout(()=> el.classList.add('visible'), delay);
          observer.unobserve(el);
        }
      });
    }, {root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08});

    reveals.forEach(el=> io.observe(el));
  } else {
    // fallback: reveal all with small stagger
    reveals.forEach((el,i)=> setTimeout(()=> el.classList.add('visible'), i*80 ));
  }

  // also reveal everything after a short timeout in case observer missed something
  setTimeout(()=>{
    reveals.forEach((el,i)=>{ if(!el.classList.contains('visible')) el.classList.add('visible') });
  }, 1200);

});
