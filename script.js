// Interactive features for the 'Nee' site
document.addEventListener('DOMContentLoaded', ()=>{
  // copy example text
  document.querySelectorAll('.btn.copy').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const txt = btn.dataset.text;
      try{ await navigator.clipboard.writeText(txt); btn.textContent='Gekopieerd ✓'; setTimeout(()=>btn.textContent='Kopieer',1200)}catch(e){btn.textContent='Kopieer (CTRL+C)'}
    })
  })

  // simple search filter for examples
  const search = document.getElementById('example-search');
  if(search){
    search.addEventListener('input', ()=>{
      const q = search.value.toLowerCase().trim();
      document.querySelectorAll('.example').forEach(ex=>{
        const text = ex.dataset.text.toLowerCase();
        ex.style.display = text.includes(q)?'flex':'none';
      })
    })
  }
})
