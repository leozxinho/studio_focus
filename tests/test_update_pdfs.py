import pytest


# ── helpers que replicam as transformações de update_pdfs.py ─────────────────

PDF_AVISO_HELPER = """
function pdfAviso(doc, x, y, w, isPositive, title, text, tx, wrap, rect) {
    const bgC = isPositive ? [240, 253, 244] : [254, 242, 242];
    const bdC = isPositive ? [34, 197, 94] : [239, 68, 68];
    rect(x, y, w, 28, bgC, 4);
    doc.setFillColor(...bdC);
    doc.rect(x, y, 3, 28, 'F');
    tx(9, true, bdC);
    doc.text(isPositive ? 'POSITIVO' : 'ATENCAO', x + 8, y + 8);
    tx(8, true, [18, 16, 30]);
    doc.text(title, x + 35, y + 8);
    tx(9, false, [90, 90, 114]);
    doc.text(wrap(text, w - 12), x + 8, y + 14);
    return y + 34;
}
"""


def apply_pdf_aviso_helper(content):
    if "function pdfAviso" not in content:
        idx = content.find("function pdfFooter")
        if idx != -1:
            content = content[:idx] + PDF_AVISO_HELPER + content[idx:]
    return content


def apply_imc_update(content):
    imc_target = "tx(10,true,[18,16,30]);doc.text('O que e o IMC?',M,y);y+=7"
    if imc_target in content:
        imc_new = """
  let isPos = (imc >= 18.5 && imc <= 24.9);
  let avTitle = isPos ? 'Peso Saudavel' : 'Atencao a saude';
  let avTxt = isPos ? 'Seu IMC esta na faixa ideal! Continue mantendo bons habitos de alimentacao e exercicios.' : 'Seu IMC esta fora da faixa considerada ideal pela OMS. Consulte um profissional para orientacao personalizada.';
  y = pdfAviso(doc, M, y, W-M*2, isPos, avTitle, avTxt, tx, wrap, rect);

  """ + imc_target
        content = content.replace(imc_target, imc_new)
    return content


def apply_calorias_update(content):
    cal_target = "tx(10,true,[18,16,30]);doc.text('O que e a Calculadora de Calorias?',M,p2);p2+=6"
    if cal_target in content:
        cal_new = """
  let avTitle = 'Como usar sua TMB';
  let avTxt = 'Sua TMB e o MINIMO que seu corpo precisa para sobreviver. Nunca coma menos que a sua TMB, pois isso pode causar danos ao seu metabolismo a longo prazo.';
  p2 = pdfAviso(doc, M, p2, W-M*2, false, avTitle, avTxt, tx, wrap, rect);

  """ + cal_target
        content = content.replace(cal_target, cal_new)
    return content


def apply_agua_update(content):
    agua_target = "tx(10,true,[18,16,30]);doc.text('Por que a Hidratacao e Importante?',M,p2);p2+=6"
    if agua_target in content:
        agua_new = """
  let isPosA = meta >= 2.5;
  let avTitleA = isPosA ? 'Meta Excelente' : 'Alerta de Hidratacao';
  let avTxtA = isPosA ? 'Sua meta de agua esta otima para manter seu corpo funcionando e em estado anabolico.' : 'Tente beber um pouco mais de agua. Uma boa hidratacao e fundamental para hipertrofia e emagrecimento.';
  p2 = pdfAviso(doc, M, p2, W-M*2, isPosA, avTitleA, avTxtA, tx, wrap, rect);

  """ + agua_target
        content = content.replace(agua_target, agua_new)
    return content


def apply_macros_update(content):
    mac_target = "tx(10,true,[18,16,30]);doc.text('O que sao Macronutrientes?',M,p2);p2+=6"
    if mac_target in content:
        mac_new = """
  let isPosM = obj === 'manter';
  let avTitleM = obj === 'perder' ? 'Deficit Calorico' : (obj === 'ganhar' ? 'Superavit Calorico' : 'Manutencao');
  let avTxtM = obj === 'perder' ? 'Esses macros garantem que voce perca gordura sem perder massa muscular. Mantenha as proteinas altas!' : (obj === 'ganhar' ? 'Foco nos treinos intensos! Esses macros fornecem a energia extra para construir novos musculos.' : 'Seu foco agora e recomposicao e manutencao da saude.');
  p2 = pdfAviso(doc, M, p2, W-M*2, isPosM || obj==='ganhar', avTitleM, avTxtM, tx, wrap, rect);

  """ + mac_target
        content = content.replace(mac_target, mac_new)
    return content


def apply_simulador_update(content):
    sim_target = "tx(10,true,[18,16,30]);doc.text('O que e o Simulador de Metas?',M,p2s);p2s+=6"
    if sim_target in content:
        sim_new = """
  let isPosS = obj === 'perder';
  let avTitleS = 'Expectativa Realista';
  let avTxtS = isPosS ? 'Emagrecimento saudavel leva tempo. Nao foque no cenario agressivo a menos que seja acompanhado por um medico.' : 'Construir musculo e mais lento que perder gordura. Seja paciente e mantenha a consistencia.';
  p2s = pdfAviso(doc, M, p2s, W-M*2, isPosS, avTitleS, avTxtS, tx, wrap, rect);

  """ + sim_target
        content = content.replace(sim_target, sim_new)
    return content


def apply_rm_update(content):
    rm_target = "tx(10,true,[18,16,30]);doc.text('O que e a 1RM?',M,y);y+=7"
    if rm_target in content:
        rm_new = """
  let isPosRM = rm >= peso * 1.2;
  let avTitleRM = isPosRM ? 'Forca Excelente' : 'Aviso de Seguranca';
  let avTxtRM = isPosRM ? 'Parabens pela marca! Cargas estimadas altas mostram um excelente nivel de condicionamento fisico.' : 'Nunca tente levantar sua 1RM real sem o auxilio de um instrutor ou parceiro de treino (spotter). Seguranca em primeiro lugar.';
  y = pdfAviso(doc, M, y, W-M*2, isPosRM, avTitleRM, avTxtRM, tx, wrap, rect);

  """ + rm_target
        content = content.replace(rm_target, rm_new)
    return content


# ── testes ───────────────────────────────────────────────────────────────────

class TestPdfAvisoHelper:
    def test_funcao_inserida_antes_de_pdf_footer(self):
        content = "function pdfFooter(doc) { return; }"
        result = apply_pdf_aviso_helper(content)
        assert "function pdfAviso" in result
        assert result.index("function pdfAviso") < result.index("function pdfFooter")

    def test_nao_duplica_se_ja_existe(self):
        content = "function pdfAviso() {}\nfunction pdfFooter() {}"
        result = apply_pdf_aviso_helper(content)
        assert result.count("function pdfAviso") == 1

    def test_sem_pdf_footer_nao_insere(self):
        content = "function outraFuncao() {}"
        result = apply_pdf_aviso_helper(content)
        assert "function pdfAviso" not in result

    def test_helper_tem_parametros_corretos(self):
        content = "function pdfFooter() {}"
        result = apply_pdf_aviso_helper(content)
        assert "function pdfAviso(doc, x, y, w, isPositive, title, text, tx, wrap, rect)" in result

    def test_helper_retorna_novo_y(self):
        content = "function pdfFooter() {}"
        result = apply_pdf_aviso_helper(content)
        assert "return y + 34" in result


class TestImcUpdate:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que e o IMC?',M,y);y+=7"

    def test_aviso_inserido(self):
        result = apply_imc_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_imc_update(self.TARGET)
        assert self.TARGET in result

    def test_aviso_antes_do_target(self):
        result = apply_imc_update(self.TARGET)
        assert result.index("pdfAviso") < result.index(self.TARGET)

    def test_verifica_faixa_ideal_imc(self):
        result = apply_imc_update(self.TARGET)
        assert "imc >= 18.5 && imc <= 24.9" in result

    def test_sem_target_nao_modifica(self):
        content = "outro conteudo"
        result = apply_imc_update(content)
        assert result == content


class TestCaloriasUpdate:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que e a Calculadora de Calorias?',M,p2);p2+=6"

    def test_aviso_inserido(self):
        result = apply_calorias_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_calorias_update(self.TARGET)
        assert self.TARGET in result

    def test_aviso_tmb_presente(self):
        result = apply_calorias_update(self.TARGET)
        assert "Como usar sua TMB" in result

    def test_alerta_dieta_abaixo_tmb(self):
        result = apply_calorias_update(self.TARGET)
        assert "Nunca coma menos que a sua TMB" in result

    def test_aviso_negativo(self):
        result = apply_calorias_update(self.TARGET)
        assert ", false," in result

    def test_sem_target_nao_modifica(self):
        result = apply_calorias_update("outro conteudo")
        assert "pdfAviso" not in result


class TestAguaUpdate:
    TARGET = "tx(10,true,[18,16,30]);doc.text('Por que a Hidratacao e Importante?',M,p2);p2+=6"

    def test_aviso_inserido(self):
        result = apply_agua_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_agua_update(self.TARGET)
        assert self.TARGET in result

    def test_meta_minima_verificada(self):
        result = apply_agua_update(self.TARGET)
        assert "meta >= 2.5" in result

    def test_mensagens_positiva_e_negativa(self):
        result = apply_agua_update(self.TARGET)
        assert "Meta Excelente" in result
        assert "Alerta de Hidratacao" in result

    def test_sem_target_nao_modifica(self):
        result = apply_agua_update("outro conteudo")
        assert "pdfAviso" not in result


class TestMacrosUpdate:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que sao Macronutrientes?',M,p2);p2+=6"

    def test_aviso_inserido(self):
        result = apply_macros_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_macros_update(self.TARGET)
        assert self.TARGET in result

    def test_tres_objetivos_cobertos(self):
        result = apply_macros_update(self.TARGET)
        assert "Deficit Calorico" in result
        assert "Superavit Calorico" in result
        assert "Manutencao" in result

    def test_sem_target_nao_modifica(self):
        result = apply_macros_update("outro conteudo")
        assert "pdfAviso" not in result


class TestSimuladorUpdate:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que e o Simulador de Metas?',M,p2s);p2s+=6"

    def test_aviso_inserido(self):
        result = apply_simulador_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_simulador_update(self.TARGET)
        assert self.TARGET in result

    def test_expectativa_realista_presente(self):
        result = apply_simulador_update(self.TARGET)
        assert "Expectativa Realista" in result

    def test_mensagem_emagrecimento(self):
        result = apply_simulador_update(self.TARGET)
        assert "Emagrecimento saudavel leva tempo" in result

    def test_sem_target_nao_modifica(self):
        result = apply_simulador_update("outro conteudo")
        assert "pdfAviso" not in result


class TestRmUpdate:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que e a 1RM?',M,y);y+=7"

    def test_aviso_inserido(self):
        result = apply_rm_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_rm_update(self.TARGET)
        assert self.TARGET in result

    def test_comparacao_forca(self):
        result = apply_rm_update(self.TARGET)
        assert "rm >= peso * 1.2" in result

    def test_aviso_seguranca_presente(self):
        result = apply_rm_update(self.TARGET)
        assert "Aviso de Seguranca" in result
        assert "spotter" in result

    def test_sem_target_nao_modifica(self):
        result = apply_rm_update("outro conteudo")
        assert "pdfAviso" not in result
