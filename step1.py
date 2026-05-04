import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Manifest
manifest_link = '<link rel="manifest" href="manifest.json">\n<title>'
content = content.replace('<title>', manifest_link)

# 2. Toasts CSS
toast_css = """
/* TOASTS */
#toast-container {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 10000;
  pointer-events: none;
}
.toast {
  background: var(--nav-bg);
  color: var(--tx);
  padding: 12px 20px;
  border-radius: 30px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  gap: 10px;
  animation: toastIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
  border: 1px solid var(--bd);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
.toast.toast-error { border-left: 4px solid #ef4444; }
.toast.toast-success { border-left: 4px solid #22c55e; }
.toast.toast-info { border-left: 4px solid #3b82f6; }
.toast.fade-out { animation: toastOut 0.3s forwards; }
@keyframes toastIn { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes toastOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0; } }

/* OVERLAYS */"""
content = content.replace("/* OVERLAYS */", toast_css)

# 3. HTML & JS Toasts
toast_html_js = """
<!-- TOAST CONTAINER -->
<div id="toast-container"></div>

<script>
function showToast(msg, type='info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  
  let icon = 'ℹ\ufe0f';
  if(type === 'error') icon = '\u26a0\ufe0f';
  if(type === 'success') icon = '\u2705';
  
  toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW falhou: ', err));
  });
}
</script>
</body>"""
content = content.replace("</body>", toast_html_js)

# 4. Remove jsPDF and add loader
jspdf_script1 = '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>'
jspdf_script2 = "if(typeof window.jspdf==='undefined'){var s=document.createElement('script');s.src='https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';s.crossOrigin='anonymous';document.head.appendChild(s)}"
content = content.replace(jspdf_script1, '')
content = content.replace(jspdf_script2, '')

loadjspdf_js = """
let _jspdfPromise = null;
function loadJSPDF() {
  if (window.jspdf) return Promise.resolve(window.jspdf);
  if (_jspdfPromise) return _jspdfPromise;
  _jspdfPromise = new Promise((resolve, reject) => {
    showToast('Baixando gerador de PDF...', 'info');
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.crossOrigin = 'anonymous';
    s.onload = () => { resolve(window.jspdf); };
    s.onerror = () => { showToast('Erro ao carregar gerador de PDF.', 'error'); reject(); };
    document.head.appendChild(s);
  });
  return _jspdfPromise;
}

/* MODAIS \u2014 open/close */"""
content = content.replace("/* MODAIS \u2014 open/close */", loadjspdf_js)

# 5. Async generating and alerts
content = content.replace("alert('Aguarde o PDF carregar.');return", "showToast('Aguarde o carregamento...', 'info');return")
content = content.replace("alert('Aguarde.');return", "showToast('Aguarde o carregamento...', 'info');return")
content = content.replace("alert('Erro ao gerar PDF: '+e.message)", "showToast('Erro ao gerar PDF', 'error')")
content = content.replace("alert('Erro: '+e.message)", "showToast('Erro interno', 'error')")
content = content.replace("alert('Calcule primeiro.');return", "showToast('Calcule os resultados primeiro!', 'error');return")
content = content.replace("alert('Simule primeiro.');return", "showToast('Simule os resultados primeiro!', 'error');return")

# Replace window.jspdf guard with await loadJSPDF()
guard_pattern = re.compile(r"if\(!window\.jspdf\)\{showToast\('Aguarde o carregamento...', 'info'\);return\}")
new_guard = """if(!window.jspdf) {
    try { await loadJSPDF(); } catch(e) { return; }
  }"""
content = guard_pattern.sub(new_guard, content)

content = content.replace("function generatePDF(", "async function generatePDF(")
content = content.replace("function gerarPDFCalorias(", "async function gerarPDFCalorias(")
content = content.replace("function gerarPDFAgua(", "async function gerarPDFAgua(")
content = content.replace("function gerarPDFMacros(", "async function gerarPDFMacros(")
content = content.replace("function gerarPDFSim(", "async function gerarPDFSim(")
content = content.replace("function gerarPDF1RM(", "async function gerarPDF1RM(")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 1 done")
