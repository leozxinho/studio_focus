Deve ser acrescentado ao menu, como nova funcionalidade

## 🎯 Objetivo:
Desenvolver uma ferramenta que permita ao usuário simular metas físicas (emagrecimento ou ganho de massa) e receber uma estimativa realista de tempo, ingestão calórica ideal e recomendações práticas.

A aplicação deve funcionar como um planejador de transformação corporal.

---

## 📊 Dados de entrada:

- Peso atual (kg)
- Altura (cm)
- Idade
- Sexo (masculino/feminino)
- Nível de atividade:
  - Sedentário
  - Levemente ativo
  - Moderadamente ativo
  - Muito ativo
- Frequência de treino semanal (0–7 dias)
- Objetivo:
  - Perder peso (kg)
  - Ganhar massa (kg)

---

## ⚙️ Lógica obrigatória:

### 1. Calcular TMB
Utilizar a Equação de Mifflin-St Jeor:

Homens:
TMB = (10 × peso) + (6.25 × altura) − (5 × idade) + 5

Mulheres:
TMB = (10 × peso) + (6.25 × altura) − (5 × idade) − 161

---

### 2. Calcular TDEE
Multiplicar TMB pelo fator de atividade:

- Sedentário: 1.2
- Levemente ativo: 1.375
- Moderado: 1.55
- Muito ativo: 1.725

---

### 3. Estimativa de tempo para atingir o objetivo

#### Para emagrecimento:
- Considerar que 1 kg ≈ 7700 kcal
- Criar cenários:
  - Leve: déficit de 300 kcal/dia
  - Moderado: déficit de 500 kcal/dia
  - Agressivo: déficit de 700 kcal/dia

Calcular:
tempo (dias) = (peso a perder × 7700) / déficit diário

---

#### Para ganho de massa:
- Considerar ganho médio:
  - Iniciante: 0.5 a 1 kg por mês
- Criar cenários:
  - Conservador
  - Moderado
  - Acelerado

---

### 4. Calorias ideais

- Emagrecimento → TDEE - déficit
- Ganho → TDEE + superávit

---

### 5. Distribuição de macronutrientes

Baseado no objetivo:

Emagrecimento:
- Proteína: 1.8–2.2g/kg
- Gordura: 0.8–1g/kg
- Carboidrato: restante

Ganho de massa:
- Proteína: 1.6–2g/kg
- Gordura: 0.8–1g/kg
- Carboidrato: restante

---

### 6. Gerador de plano alimentar

Criar automaticamente:

- Café da manhã
- Almoço
- Lanche
- Jantar

Regras:
- Usar alimentos comuns e acessíveis
- Variar sugestões dinamicamente
- Adaptar ao objetivo

---

## 📊 Resultados exibidos:

- Tempo estimado para atingir o objetivo
- Calorias recomendadas
- Cenários (leve, moderado, agressivo)
- Macronutrientes (em gramas)
- Plano alimentar sugerido

---

## 📈 Visualizações:

- Linha do tempo (ex: “Você atingirá seu objetivo em X semanas”)
- Comparação entre cenários
- Barra de progresso

---

## 🎨 Interface (UI/UX):

- Design moderno estilo fitness
- Responsivo (mobile-first)
- Interface simples e direta
- Botão principal: “Simular objetivo”

---

## 🔥 Funcionalidades extras:

- Botão “Recalcular”
- Botão “Gerar novo plano alimentar”
- Download de relatório em PDF
- Sugestão de ingestão de água (35 ml/kg)
- Feedback inteligente:
  - “Esse prazo é saudável”
  - “Esse plano é agressivo, cuidado”

---

## ⚠️ Aviso obrigatório:

"Os resultados são estimativas. Consulte um profissional para orientação personalizada."

