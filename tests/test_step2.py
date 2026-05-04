import pytest


# ── helpers que replicam as transformações de step2.py ──────────────────────

INPUT_VAL_JS = """
// Input Validation
document.addEventListener('input', function(e) {
  if (e.target && e.target.type === 'number') {
    if (e.target.value && parseFloat(e.target.value) < 0) {
      e.target.value = Math.abs(parseFloat(e.target.value));
    }
  }
});
"""

BTN_WRAPPER_START = """
  let _btn = null, _origHTML = '';
  try { if(event && event.currentTarget && event.currentTarget.tagName === 'BUTTON') _btn = event.currentTarget; } catch(e){}
  if(!_btn && document.activeElement && document.activeElement.tagName === 'BUTTON') _btn = document.activeElement;
  if(_btn) { _origHTML = _btn.innerHTML; _btn.innerHTML = '⌛ Gerando...'; _btn.style.pointerEvents = 'none'; _btn.style.opacity = '0.7'; }
"""

BTN_WRAPPER_END = """
  if(_btn) { _btn.innerHTML = _origHTML; _btn.style.pointerEvents = ''; _btn.style.opacity = '1'; }
"""

FUNCS = [
    "async function generatePDF({peso,altura,imc,range:r,pesoIdeal:pi,tmb,sexo,idade}){",
    "async function gerarPDFCalorias(tmb,peso,alt,idade,sexo){",
    "async function gerarPDFAgua(){",
    "async function gerarPDFMacros(){",
    "async function gerarPDFSim(){",
    "async function gerarPDF1RM(rm, peso, reps){",
]


def apply_input_validation(content):
    if "// Click outside" in content:
        content = content.replace("// Click outside", INPUT_VAL_JS + "\n// Click outside")
    return content


def apply_btn_wrappers(content):
    for func in FUNCS:
        if func not in content:
            continue
        idx = content.find(func)
        if idx == -1:
            continue
        try_idx = content.find("try{", idx)
        if try_idx == -1:
            continue
        content = content[:try_idx + 4] + BTN_WRAPPER_START + content[try_idx + 4:]
        catch_idx = content.find("}catch(e){", try_idx)
        if catch_idx == -1:
            continue
        content = content[:catch_idx] + BTN_WRAPPER_END + content[catch_idx:]
        content = content[:catch_idx + 10 + len(BTN_WRAPPER_END)] + BTN_WRAPPER_END + content[catch_idx + 10 + len(BTN_WRAPPER_END):]
    return content


# ── testes ───────────────────────────────────────────────────────────────────

class TestInputValidation:
    def test_input_validation_inserido(self):
        content = "// Click outside"
        result = apply_input_validation(content)
        assert "document.addEventListener('input'" in result
        assert "parseFloat(e.target.value) < 0" in result

    def test_click_outside_preservado(self):
        content = "// Click outside"
        result = apply_input_validation(content)
        assert "// Click outside" in result

    def test_input_validation_antes_de_click_outside(self):
        content = "// Click outside"
        result = apply_input_validation(content)
        assert result.index("addEventListener('input'") < result.index("// Click outside")

    def test_sem_marcador_nao_modifica(self):
        content = "// outro comentario"
        result = apply_input_validation(content)
        assert result == content

    def test_valida_numeros_negativos(self):
        content = "// Click outside"
        result = apply_input_validation(content)
        assert "Math.abs(parseFloat(e.target.value))" in result


class TestBtnWrappers:
    def _make_func_content(self, func_sig):
        return f"""{func_sig}
  if(!window.jspdf) {{
    try {{ await loadJSPDF(); }} catch(e) {{ return; }}
  }}
  try{{const doc = new jspdf.jsPDF();doc.save('test.pdf');}}catch(e){{console.error(e);}}
}}"""

    @pytest.mark.parametrize("func_sig", FUNCS)
    def test_btn_wrapper_start_inserido(self, func_sig):
        content = self._make_func_content(func_sig)
        result = apply_btn_wrappers(content)
        assert "_btn" in result
        assert "_origHTML" in result
        assert "⌛ Gerando..." in result

    @pytest.mark.parametrize("func_sig", FUNCS)
    def test_btn_wrapper_end_inserido(self, func_sig):
        content = self._make_func_content(func_sig)
        result = apply_btn_wrappers(content)
        assert "_btn.innerHTML = _origHTML" in result
        assert "_btn.style.pointerEvents = ''" in result

    @pytest.mark.parametrize("func_sig", FUNCS)
    def test_try_block_preservado(self, func_sig):
        content = self._make_func_content(func_sig)
        result = apply_btn_wrappers(content)
        assert "try{" in result
        assert "}catch(e){" in result

    def test_funcao_ausente_nao_modifica(self):
        content = "async function outraFuncao(){ try{doThing();}catch(e){} }"
        result = apply_btn_wrappers(content)
        assert "_btn" not in result

    def test_wrapper_desativa_pointer_events(self):
        content = self._make_func_content(FUNCS[0])
        result = apply_btn_wrappers(content)
        assert "pointerEvents = 'none'" in result
        assert "opacity = '0.7'" in result

    def test_wrapper_restaura_pointer_events(self):
        content = self._make_func_content(FUNCS[0])
        result = apply_btn_wrappers(content)
        assert "pointerEvents = ''" in result
        assert "opacity = '1'" in result
