import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# IMC
imc_target = "tx(10,true,[18,16,30]);doc.text('O que e o IMC?',M,p2);p2+=6"
if imc_target in content:
    imc_new = """
  let isPosIMC = (imc >= 18.5 && imc <= 24.9);
  let avTitleIMC = isPosIMC ? 'Peso Saudavel' : 'Atencao a saude';
  let avTxtIMC = isPosIMC ? 'Seu IMC esta na faixa ideal! Continue mantendo bons habitos de alimentacao e exercicios.' : 'Seu IMC esta fora da faixa considerada ideal pela OMS. Procure orientacao medica e nutricional.';
  p2 = pdfAviso(doc, M, p2, W-M*2, isPosIMC, avTitleIMC, avTxtIMC, tx, wrap, rect);
  
  """ + imc_target
    content = content.replace(imc_target, imc_new)
    print("IMC updated")

# Agua
agua_target = "tx(10,true,[18,16,30]);doc.text('O que e o Calculo de Hidratacao?',M,p2a);p2a+=6"
if agua_target in content:
    agua_new = """
  let isPosAgua = litros >= 2.5;
  let avTitleAgua = isPosAgua ? 'Meta Excelente' : 'Aviso de Hidratacao';
  let avTxtAgua = isPosAgua ? 'Sua meta de agua e otima para um estilo de vida ativo e saudavel!' : 'Uma boa hidratacao e fundamental para hipertrofia e saude. Beba agua regularmente!';
  p2a = pdfAviso(doc, M, p2a, W-M*2, isPosAgua, avTitleAgua, avTxtAgua, tx, wrap, rect);
  
  """ + agua_target
    content = content.replace(agua_target, agua_new)
    print("Agua updated")

# Macros
mac_target = "tx(10,true,[18,16,30]);doc.text('O que sao Macronutrientes?',M,p2m);p2m+=6"
if mac_target in content:
    mac_new = """
  let isPosMac = obj === 'manter';
  let avTitleMac = obj === 'perder' ? 'Deficit Calorico' : (obj === 'ganhar' ? 'Superavit Calorico' : 'Manutencao Ideal');
  let avTxtMac = obj === 'perder' ? 'Esses macros vao te ajudar a perder gordura preservando massa magra. Mantenha as proteinas altas!' : (obj === 'ganhar' ? 'Treine pesado! Esses macros extras ajudarao na construcao muscular.' : 'Foco em saude, longevidade e recomposicao corporal.');
  p2m = pdfAviso(doc, M, p2m, W-M*2, isPosMac || obj === 'ganhar', avTitleMac, avTxtMac, tx, wrap, rect);
  
  """ + mac_target
    content = content.replace(mac_target, mac_new)
    print("Macros updated")

# 1RM
rm_target = "tx(10,true,[18,16,30]);doc.text('O que é a 1RM?',M,y);y+=7"
if rm_target in content:
    rm_new = """
  let isPosRM = rm >= peso * 1.2;
  let avTitleRM = isPosRM ? 'Forca Excelente' : 'Aviso de Seguranca';
  let avTxtRM = isPosRM ? 'Parabens! Sua forca base para o exercicio testado e muito boa. Continue os treinos de progressao de carga.' : 'Lembre-se: nunca tente bater sua 1RM real sem ajuda de um parceiro ou instrutor qualificado.';
  y = pdfAviso(doc, M, y, W-M*2, isPosRM, avTitleRM, avTxtRM, tx, wrap, rect);
  
  """ + rm_target
    content = content.replace(rm_target, rm_new)
    print("1RM updated")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
