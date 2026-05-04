import re
import pytest


# ── helpers que replicam as transformações de step1.py ──────────────────────

def apply_manifest(content):
    manifest_link = '<link rel="manifest" href="manifest.json">\n<title>'
    return content.replace('<title>', manifest_link)


def apply_toast_css(content):
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
    return content.replace("/* OVERLAYS */", toast_css)


def apply_toast_html_js(content):
    toast_html_js = """
<!-- TOAST CONTAINER -->
<div id="toast-container"></div>

<script>
function showToast(msg, type='info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;

  let icon = 'ℹ️';
  if(type === 'error') icon = '⚠️';
  if(type === 'success') icon = '✅';

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
    return content.replace("</body>", toast_html_js)


def apply_remove_jspdf(content):
    jspdf_script1 = '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>'
    jspdf_script2 = "if(typeof window.jspdf==='undefined'){var s=document.createElement('script');s.src='https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';s.crossOrigin='anonymous';document.head.appendChild(s)}"
    content = content.replace(jspdf_script1, '')
    content = content.replace(jspdf_script2, '')
    return content


def apply_alert_replacements(content):
    replacements = [
        ("alert('Aguarde o PDF carregar.');return", "showToast('Aguarde o carregamento...', 'info');return"),
        ("alert('Aguarde.');return",                "showToast('Aguarde o carregamento...', 'info');return"),
        ("alert('Erro ao gerar PDF: '+e.message)",  "showToast('Erro ao gerar PDF', 'error')"),
        ("alert('Erro: '+e.message)",               "showToast('Erro interno', 'error')"),
        ("alert('Calcule primeiro.');return",        "showToast('Calcule os resultados primeiro!', 'error');return"),
        ("alert('Simule primeiro.');return",         "showToast('Simule os resultados primeiro!', 'error');return"),
    ]
    for old, new in replacements:
        content = content.replace(old, new)
    return content


def apply_guard_regex(content):
    guard_pattern = re.compile(r"if\(!window\.jspdf\)\{showToast\('Aguarde o carregamento...', 'info'\);return\}")
    new_guard = """if(!window.jspdf) {
    try { await loadJSPDF(); } catch(e) { return; }
  }"""
    return guard_pattern.sub(new_guard, content)


def apply_async_functions(content):
    content = content.replace("function generatePDF(",     "async function generatePDF(")
    content = content.replace("function gerarPDFCalorias(", "async function gerarPDFCalorias(")
    content = content.replace("function gerarPDFAgua(",    "async function gerarPDFAgua(")
    content = content.replace("function gerarPDFMacros(",  "async function gerarPDFMacros(")
    content = content.replace("function gerarPDFSim(",     "async function gerarPDFSim(")
    content = content.replace("function gerarPDF1RM(",     "async function gerarPDF1RM(")
    return content


def apply_loadjspdf(content):
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

/* MODAIS — open/close */"""
    return content.replace("/* MODAIS — open/close */", loadjspdf_js)


# ── testes ───────────────────────────────────────────────────────────────────

class TestManifest:
    def test_insere_link_manifest_antes_do_title(self):
        content = '<title>App</title>'
        result = apply_manifest(content)
        assert '<link rel="manifest" href="manifest.json">' in result
        assert result.index('<link rel="manifest"') < result.index('<title>')

    def test_title_original_preservado(self):
        content = '<title>Studio Focus</title>'
        result = apply_manifest(content)
        assert '<title>Studio Focus</title>' in result

    def test_sem_title_nao_modifica(self):
        content = '<meta charset="UTF-8">'
        result = apply_manifest(content)
        assert result == content


class TestToastCSS:
    def test_toast_css_inserido(self):
        content = '/* OVERLAYS */'
        result = apply_toast_css(content)
        assert '#toast-container' in result
        assert '.toast' in result
        assert '@keyframes toastIn' in result
        assert '@keyframes toastOut' in result

    def test_overlays_preservado(self):
        content = '/* OVERLAYS */'
        result = apply_toast_css(content)
        assert '/* OVERLAYS */' in result

    def test_toast_classes_presentes(self):
        content = '/* OVERLAYS */'
        result = apply_toast_css(content)
        assert '.toast.toast-error' in result
        assert '.toast.toast-success' in result
        assert '.toast.toast-info' in result
        assert '.toast.fade-out' in result

    def test_sem_marcador_nao_modifica(self):
        content = '<div>sem marcador</div>'
        result = apply_toast_css(content)
        assert result == content


class TestToastHtmlJs:
    def test_container_inserido(self):
        content = '</body>'
        result = apply_toast_html_js(content)
        assert '<div id="toast-container"></div>' in result

    def test_funcao_showtoast_inserida(self):
        content = '</body>'
        result = apply_toast_html_js(content)
        assert "function showToast" in result

    def test_service_worker_inserido(self):
        content = '</body>'
        result = apply_toast_html_js(content)
        assert "serviceWorker" in result
        assert "./sw.js" in result

    def test_body_fechamento_preservado(self):
        content = '</body>'
        result = apply_toast_html_js(content)
        assert '</body>' in result

    def test_sem_body_nao_modifica(self):
        content = '<div>conteudo</div>'
        result = apply_toast_html_js(content)
        assert result == content


class TestRemoveJsPDF:
    def test_remove_script_cdnjs(self):
        jspdf = '<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" crossorigin="anonymous"></script>'
        content = f'<head>{jspdf}</head>'
        result = apply_remove_jspdf(content)
        assert jspdf not in result

    def test_remove_script_unpkg(self):
        jspdf2 = "if(typeof window.jspdf==='undefined'){var s=document.createElement('script');s.src='https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js';s.crossOrigin='anonymous';document.head.appendChild(s)}"
        content = f'<script>{jspdf2}</script>'
        result = apply_remove_jspdf(content)
        assert jspdf2 not in result

    def test_conteudo_restante_preservado(self):
        content = '<head><meta charset="UTF-8"></head>'
        result = apply_remove_jspdf(content)
        assert '<meta charset="UTF-8">' in result


class TestAlertReplacements:
    @pytest.mark.parametrize("old,new", [
        ("alert('Aguarde o PDF carregar.');return", "showToast('Aguarde o carregamento...', 'info');return"),
        ("alert('Aguarde.');return",                "showToast('Aguarde o carregamento...', 'info');return"),
        ("alert('Erro ao gerar PDF: '+e.message)",  "showToast('Erro ao gerar PDF', 'error')"),
        ("alert('Erro: '+e.message)",               "showToast('Erro interno', 'error')"),
        ("alert('Calcule primeiro.');return",        "showToast('Calcule os resultados primeiro!', 'error');return"),
        ("alert('Simule primeiro.');return",         "showToast('Simule os resultados primeiro!', 'error');return"),
    ])
    def test_alert_substituido(self, old, new):
        result = apply_alert_replacements(old)
        assert old not in result
        assert new in result

    def test_sem_alert_nao_modifica(self):
        content = 'console.log("ok");'
        result = apply_alert_replacements(content)
        assert result == content


class TestGuardRegex:
    def test_guard_substituido(self):
        guard = "if(!window.jspdf){showToast('Aguarde o carregamento...', 'info');return}"
        result = apply_guard_regex(guard)
        assert "await loadJSPDF()" in result
        assert guard not in result

    def test_multiplos_guards_substituidos(self):
        guard = "if(!window.jspdf){showToast('Aguarde o carregamento...', 'info');return}"
        content = guard + "\n" + guard
        result = apply_guard_regex(content)
        assert result.count("await loadJSPDF()") == 2

    def test_sem_guard_nao_modifica(self):
        content = "if(!window.jspdf){ doSomethingElse(); }"
        result = apply_guard_regex(content)
        assert result == content


class TestAsyncFunctions:
    @pytest.mark.parametrize("func_name", [
        "generatePDF",
        "gerarPDFCalorias",
        "gerarPDFAgua",
        "gerarPDFMacros",
        "gerarPDFSim",
        "gerarPDF1RM",
    ])
    def test_funcao_vira_async(self, func_name):
        content = f"function {func_name}(args) {{ return; }}"
        result = apply_async_functions(content)
        assert f"async function {func_name}(" in result
        # "async function foo(" contém "function foo(", então verificamos via split
        assert result.startswith("async function")

    def test_funcoes_nao_relacionadas_nao_modificadas(self):
        content = "function calcularIMC(peso, altura) { return; }"
        result = apply_async_functions(content)
        assert "async function calcularIMC" not in result
        assert "function calcularIMC(" in result


class TestLoadJsPDF:
    def test_funcao_loadjspdf_inserida(self):
        content = "/* MODAIS — open/close */"
        result = apply_loadjspdf(content)
        assert "function loadJSPDF()" in result
        assert "_jspdfPromise" in result

    def test_marcador_modais_preservado(self):
        content = "/* MODAIS — open/close */"
        result = apply_loadjspdf(content)
        assert "/* MODAIS — open/close */" in result

    def test_sem_marcador_nao_modifica(self):
        content = "/* outro comentario */"
        result = apply_loadjspdf(content)
        assert result == content
