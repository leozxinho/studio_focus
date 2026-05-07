import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add pdfAviso helper
aviso_helper = """
function pdfAviso(doc, x, y, w, isPositive, title, text, tx, wrap, rect) {
    const bgC = isPositive ? [240, 253, 244] : [254, 242, 242]; // light green vs light red
    const bdC = isPositive ? [34, 197, 94] : [239, 68, 68]; // dark green vs dark red
    
    rect(x, y, w, 28, bgC, 4);
    doc.setFillColor(...bdC);
    doc.rect(x, y, 3, 28, 'F');
    
    tx(9, true, bdC);
    doc.text(isPositive ? 'POSITIVO' : 'ATENCAO', x + 8, y + 8);
    
    tx(8, true, [18, 16, 30]);
    doc.text(title, x + 35, y + 8);
    
    tx(9, false, [90, 90, 114]);
    doc.text(wrap(text, w - 12), x + 8, y + 14);
    
    return y + 34; // return new y
}
"""

if "function pdfAviso" not in content:
    idx = content.find("function pdfFooter")
    if idx != -1:
        content = content[:idx] + aviso_helper + content[idx:]
        print("pdfAviso added")

# 2. Update IMC
imc_target = "tx(10,true,[18,16,30]);doc.text('O que e o IMC?',M,y);y+=7"
if imc_target in content:
    imc_new = """
  // Aviso IMC
  let isPos = (imc >= 18.5 && imc <= 24.9);
  let avTitle = isPos ? 'Peso Saudavel' : 'Atencao a saude';
  let avTxt = isPos ? 'Seu IMC esta na faixa ideal! Continue mantendo bons habitos de alimentacao e exercicios.' : 'Seu IMC esta fora da faixa considerada ideal pela OMS. Consulte um profissional para orientacao personalizada.';
  y = pdfAviso(doc, M, y, W-M*2, isPos, avTitle, avTxt, tx, wrap, rect);
  
  """ + imc_target
    content = content.replace(imc_target, imc_new)
    print("IMC updated")

# 3. Update Calorias
cal_target = "tx(10,true,[18,16,30]);doc.text('O que e a Calculadora de Calorias?',M,p2);p2+=6"
if cal_target in content:
    cal_new = """
  let avTitle = 'Como usar sua TMB';
  let avTxt = 'Sua TMB e o MINIMO que seu corpo precisa para sobreviver. Nunca coma menos que a sua TMB, pois isso pode causar danos ao seu metabolismo a longo prazo.';
  p2 = pdfAviso(doc, M, p2, W-M*2, false, avTitle, avTxt, tx, wrap, rect);
  
  """ + cal_target
    content = content.replace(cal_target, cal_new)
    print("Calorias updated")

# 4. Update Agua
agua_target = "tx(10,true,[18,16,30]);doc.text('Por que a Hidratacao e Importante?',M,p2);p2+=6"
if agua_target in content:
    agua_new = """
  let isPosA = meta >= 2.5;
  let avTitleA = isPosA ? 'Meta Excelente' : 'Alerta de Hidratacao';
  let avTxtA = isPosA ? 'Sua meta de agua esta otima para manter seu corpo funcionando e em estado anabolico.' : 'Tente beber um pouco mais de agua. Uma boa hidratacao e fundamental para hipertrofia e emagrecimento.';
  p2 = pdfAviso(doc, M, p2, W-M*2, isPosA, avTitleA, avTxtA, tx, wrap, rect);
  
  """ + agua_target
    content = content.replace(agua_target, agua_new)
    print("Agua updated")

# 5. Update Macros
mac_target = "tx(10,true,[18,16,30]);doc.text('O que sao Macronutrientes?',M,p2);p2+=6"
if mac_target in content:
    mac_new = """
  let isPosM = obj === 'manter';
  let avTitleM = obj === 'perder' ? 'Deficit Calorico' : (obj === 'ganhar' ? 'Superavit Calorico' : 'Manutencao');
  let avTxtM = obj === 'perder' ? 'Esses macros garantem que voce perca gordura sem perder massa muscular. Mantenha as proteinas altas!' : (obj === 'ganhar' ? 'Foco nos treinos intensos! Esses macros fornecem a energia extra para construir novos musculos.' : 'Seu foco agora e recomposicao e manutencao da saude.');
  p2 = pdfAviso(doc, M, p2, W-M*2, isPosM || obj==='ganhar', avTitleM, avTxtM, tx, wrap, rect);
  
  """ + mac_target
    content = content.replace(mac_target, mac_new)
    print("Macros updated")

# 6. Update Simulador
sim_target = "tx(10,true,[18,16,30]);doc.text('O que e o Simulador de Metas?',M,p2s);p2s+=6"
if sim_target in content:
    sim_new = """
  let isPosS = obj === 'perder';
  let avTitleS = 'Expectativa Realista';
  let avTxtS = isPosS ? 'Emagrecimento saudavel leva tempo. Nao foque no cenario agressivo a menos que seja acompanhado por um medico.' : 'Construir musculo e mais lento que perder gordura. Seja paciente e mantenha a consistencia.';
  p2s = pdfAviso(doc, M, p2s, W-M*2, isPosS, avTitleS, avTxtS, tx, wrap, rect);
  
  """ + sim_target
    content = content.replace(sim_target, sim_new)
    print("Simulador updated")

# 7. Update 1RM
rm_target = "tx(10,true,[18,16,30]);doc.text('O que e a 1RM?',M,y);y+=7"
if rm_target in content:
    rm_new = """
  let isPosRM = rm >= peso * 1.2;
  let avTitleRM = isPosRM ? 'Forca Excelente' : 'Aviso de Seguranca';
  let avTxtRM = isPosRM ? 'Parabens pela marca! Cargas estimadas altas mostram um excelente nivel de condicionamento fisico.' : 'Nunca tente levantar sua 1RM real sem o auxilio de um instrutor ou parceiro de treino (spotter). Seguranca em primeiro lugar.';
  y = pdfAviso(doc, M, y, W-M*2, isPosRM, avTitleRM, avTxtRM, tx, wrap, rect);
  
  """ + rm_target
    content = content.replace(rm_target, rm_new)
    print("1RM updated")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)










