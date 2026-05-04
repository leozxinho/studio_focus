import pytest


# ── helpers que replicam as transformações de update_pdfs_2.py ───────────────

def apply_imc_update(content):
    imc_target = "tx(10,true,[18,16,30]);doc.text('O que e o IMC?',M,p2);p2+=6"
    if imc_target in content:
        imc_new = """
  let isPosIMC = (imc >= 18.5 && imc <= 24.9);
  let avTitleIMC = isPosIMC ? 'Peso Saudavel' : 'Atencao a saude';
  let avTxtIMC = isPosIMC ? 'Seu IMC esta na faixa ideal! Continue mantendo bons habitos de alimentacao e exercicios.' : 'Seu IMC esta fora da faixa considerada ideal pela OMS. Procure orientacao medica e nutricional.';
  p2 = pdfAviso(doc, M, p2, W-M*2, isPosIMC, avTitleIMC, avTxtIMC, tx, wrap, rect);

  """ + imc_target
        content = content.replace(imc_target, imc_new)
    return content


def apply_agua_update(content):
    agua_target = "tx(10,true,[18,16,30]);doc.text('O que e o Calculo de Hidratacao?',M,p2a);p2a+=6"
    if agua_target in content:
        agua_new = """
  let isPosAgua = litros >= 2.5;
  let avTitleAgua = isPosAgua ? 'Meta Excelente' : 'Aviso de Hidratacao';
  let avTxtAgua = isPosAgua ? 'Sua meta de agua e otima para um estilo de vida ativo e saudavel!' : 'Uma boa hidratacao e fundamental para hipertrofia e saude. Beba agua regularmente!';
  p2a = pdfAviso(doc, M, p2a, W-M*2, isPosAgua, avTitleAgua, avTxtAgua, tx, wrap, rect);

  """ + agua_target
        content = content.replace(agua_target, agua_new)
    return content


def apply_macros_update(content):
    mac_target = "tx(10,true,[18,16,30]);doc.text('O que sao Macronutrientes?',M,p2m);p2m+=6"
    if mac_target in content:
        mac_new = """
  let isPosMac = obj === 'manter';
  let avTitleMac = obj === 'perder' ? 'Deficit Calorico' : (obj === 'ganhar' ? 'Superavit Calorico' : 'Manutencao Ideal');
  let avTxtMac = obj === 'perder' ? 'Esses macros vao te ajudar a perder gordura preservando massa magra. Mantenha as proteinas altas!' : (obj === 'ganhar' ? 'Treine pesado! Esses macros extras ajudarao na construcao muscular.' : 'Foco em saude, longevidade e recomposicao corporal.');
  p2m = pdfAviso(doc, M, p2m, W-M*2, isPosMac || obj === 'ganhar', avTitleMac, avTxtMac, tx, wrap, rect);

  """ + mac_target
        content = content.replace(mac_target, mac_new)
    return content


def apply_rm_update(content):
    rm_target = "tx(10,true,[18,16,30]);doc.text('O que é a 1RM?',M,y);y+=7"
    if rm_target in content:
        rm_new = """
  let isPosRM = rm >= peso * 1.2;
  let avTitleRM = isPosRM ? 'Forca Excelente' : 'Aviso de Seguranca';
  let avTxtRM = isPosRM ? 'Parabens! Sua forca base para o exercicio testado e muito boa. Continue os treinos de progressao de carga.' : 'Lembre-se: nunca tente bater sua 1RM real sem ajuda de um parceiro ou instrutor qualificado.';
  y = pdfAviso(doc, M, y, W-M*2, isPosRM, avTitleRM, avTxtRM, tx, wrap, rect);

  """ + rm_target
        content = content.replace(rm_target, rm_new)
    return content


# ── testes ───────────────────────────────────────────────────────────────────

class TestImcUpdate2:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que e o IMC?',M,p2);p2+=6"

    def test_aviso_inserido(self):
        result = apply_imc_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_imc_update(self.TARGET)
        assert self.TARGET in result

    def test_verifica_faixa_imc(self):
        result = apply_imc_update(self.TARGET)
        assert "imc >= 18.5 && imc <= 24.9" in result

    def test_mensagens_positiva_e_negativa(self):
        result = apply_imc_update(self.TARGET)
        assert "Peso Saudavel" in result
        assert "Atencao a saude" in result

    def test_usa_variavel_p2(self):
        result = apply_imc_update(self.TARGET)
        assert "p2 = pdfAviso(" in result

    def test_sem_target_nao_modifica(self):
        result = apply_imc_update("outro conteudo")
        assert result == "outro conteudo"

    def test_aviso_antes_do_target(self):
        result = apply_imc_update(self.TARGET)
        assert result.index("pdfAviso") < result.index(self.TARGET)


class TestAguaUpdate2:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que e o Calculo de Hidratacao?',M,p2a);p2a+=6"

    def test_aviso_inserido(self):
        result = apply_agua_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_agua_update(self.TARGET)
        assert self.TARGET in result

    def test_limiar_de_hidratacao(self):
        result = apply_agua_update(self.TARGET)
        assert "litros >= 2.5" in result

    def test_mensagens_presentes(self):
        result = apply_agua_update(self.TARGET)
        assert "Meta Excelente" in result
        assert "Aviso de Hidratacao" in result

    def test_usa_variavel_p2a(self):
        result = apply_agua_update(self.TARGET)
        assert "p2a = pdfAviso(" in result

    def test_sem_target_nao_modifica(self):
        result = apply_agua_update("outro conteudo")
        assert result == "outro conteudo"

    def test_aviso_antes_do_target(self):
        result = apply_agua_update(self.TARGET)
        assert result.index("pdfAviso") < result.index(self.TARGET)


class TestMacrosUpdate2:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que sao Macronutrientes?',M,p2m);p2m+=6"

    def test_aviso_inserido(self):
        result = apply_macros_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_macros_update(self.TARGET)
        assert self.TARGET in result

    def test_tres_objetivos(self):
        result = apply_macros_update(self.TARGET)
        assert "Deficit Calorico" in result
        assert "Superavit Calorico" in result
        assert "Manutencao Ideal" in result

    def test_usa_variavel_p2m(self):
        result = apply_macros_update(self.TARGET)
        assert "p2m = pdfAviso(" in result

    def test_sem_target_nao_modifica(self):
        result = apply_macros_update("outro conteudo")
        assert result == "outro conteudo"

    def test_aviso_antes_do_target(self):
        result = apply_macros_update(self.TARGET)
        assert result.index("pdfAviso") < result.index(self.TARGET)


class TestRmUpdate2:
    TARGET = "tx(10,true,[18,16,30]);doc.text('O que é a 1RM?',M,y);y+=7"

    def test_aviso_inserido(self):
        result = apply_rm_update(self.TARGET)
        assert "pdfAviso" in result

    def test_target_preservado(self):
        result = apply_rm_update(self.TARGET)
        assert self.TARGET in result

    def test_comparacao_forca(self):
        result = apply_rm_update(self.TARGET)
        assert "rm >= peso * 1.2" in result

    def test_mensagens_positiva_e_negativa(self):
        result = apply_rm_update(self.TARGET)
        assert "Forca Excelente" in result
        assert "Aviso de Seguranca" in result

    def test_alerta_seguranca_completo(self):
        result = apply_rm_update(self.TARGET)
        assert "instrutor qualificado" in result

    def test_sem_target_nao_modifica(self):
        result = apply_rm_update("outro conteudo")
        assert result == "outro conteudo"

    def test_aviso_antes_do_target(self):
        result = apply_rm_update(self.TARGET)
        assert result.index("pdfAviso") < result.index(self.TARGET)
