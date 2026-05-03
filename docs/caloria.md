Deve ser acrescentado ao menu, como nova funcionalidade

## 🎯 Objetivo:
Desenvolver uma ferramenta que calcule o gasto calórico diário (TDEE) do usuário e transforme esse valor em recomendações práticas, incluindo metas calóricas, distribuição de macronutrientes e sugestões de refeições personalizadas.

A aplicação deve ir além de uma simples calculadora, funcionando como um assistente fitness digital.

---

## 📊 Inputs do usuário:
- Peso (kg)
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
  - Emagrecer
  - Manter peso
  - Ganhar massa

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

### 3. Ajustar meta calórica:
- Emagrecer:
  déficit de 300 a 500 kcal
- Ganhar massa:
  superávit de 300 a 500 kcal
- Manter:
  manter TDEE

Gerar três cenários:
- Conservador
- Moderado
- Agressivo

---

### 4. Distribuição de macronutrientes:

Baseado no objetivo:

Emagrecimento:
- Proteína: 1.8–2.2g por kg
- Gordura: 0.8–1g por kg
- Carboidrato: restante das calorias

Ganho de massa:
- Proteína: 1.6–2g por kg
- Gordura: 0.8–1g por kg
- Carboidrato: restante

---

### 5. Gerador de plano alimentar:

Criar automaticamente um plano com:

- Café da manhã
- Almoço
- Lanche
- Jantar

Regras:
- Variar alimentos dinamicamente
- Adaptar ao objetivo
- Usar alimentos comuns (arroz, feijão, frango, ovos, etc.)
- Evitar sugestões irreais

---

### 6. Consumo de água:
- 35 ml por kg corporal

---

## 🎨 Interface (UI/UX):

- Design moderno estilo fitness
- Responsivo (mobile-first)
- Formulário simples e intuitivo
- Botão principal: “Gerar Plano”

---

## 📊 Exibir resultados:

- TMB
- TDEE
- Meta calórica (com opções)
- Macronutrientes (em gramas)
- Plano alimentar completo
- Consumo de água

---

## 📈 Elementos visuais:

- Barra de progresso de calorias
- Comparação:
  manutenção vs déficit vs superávit
- Cards organizados

---

## 🔥 Funcionalidades extras:

- Botão “Gerar novo plano”
- Alternar entre:
  - Dieta padrão
  - Low carb
  - Vegetariana
- Divisão de refeições (3 a 5 por dia)
- Lista de compras automática
- Botão “Baixar relatório em PDF”

---

## 🧠 Feedback inteligente:

Exibir mensagens como:
- “Um déficit moderado é ideal para você”
- “Evite cortes calóricos extremos”
- “Seu nível de atividade influencia diretamente seus resultados”

---

## ⚠️ Aviso obrigatório:
"Este plano é apenas uma estimativa. Consulte um nutricionista para orientação personalizada."