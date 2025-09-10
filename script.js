document.addEventListener('DOMContentLoaded',()=>{
 const form=document.getElementById('lead-form');
 const statusBox=document.getElementById('form-status');
 const BACKEND=(window.KARBA_CONFIG&&window.KARBA_CONFIG.BACKEND_URL)||'';
 form.addEventListener('submit',async(e)=>{
  e.preventDefault(); statusBox.textContent='Submitting...';
  const data=Object.fromEntries(new FormData(form).entries());
  try{
   const res=await fetch(BACKEND+'/api/leads',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
   const txt=await res.text();
   statusBox.textContent=res.ok?'Thank you! We will contact you shortly.':'Error: '+txt;
   form.reset();
  }catch(err){ statusBox.textContent='Network error. Please try again.'; }
 });
});