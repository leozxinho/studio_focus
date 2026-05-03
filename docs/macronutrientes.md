Deve ser acrescentado ao menu, como nova funcionalidade


## 🎯 Objetivo:
Calcular a quantidade ideal de proteína, carboidratos e gorduras com base nos dados do usuário e seu objetivo físico, transformando calorias em um plano alimentar prático.

---

## 📊 Dados de entrada:

- Peso (kg)
- Altura (cm)
- Idade
- Sexo
- Nível de atividade:
  - Sedentário
  - Moderado
  - Ativo
- Objetivo:
  - Emagrecer
  - Manter peso
  - Ganhar massa

---

## ⚙️ Lógica obrigatória:

### 1. Calcular TMB
Usar fórmula de Mifflin-St Jeor

---

### 2. Calcular TDEE
Aplicar fator de atividade

---

### 3. Definir meta calórica:

- Emagrecer → déficit de 300 a 500 kcal
- Manter → TDEE
- Ganhar massa → superávit de 300 a 500 kcal

---

### 4. Distribuição de macronutrientes:

#### Emagrecimento:
- Proteína: 1.8 a 2.2g por kg
- Gordura: 0.8 a 1g por kg
- Carboidrato: restante das calorias

#### Manutenção:
- Proteína: 1.6 a 2g por kg
- Gordura: 0.8 a 1g por kg
- Carboidrato: restante

#### Ganho de massa:
- Proteína: 1.6 a 2g por kg
- Gordura: 0.8 a 1g por kg
- Carboidrato: restante

---

### 5. Conversão calórica:

- Proteína = 4 kcal por grama
- Carboidrato = 4 kcal por grama
- Gordura = 9 kcal por grama

---

## 📊 Exibir resultados:

- Calorias diárias ideais
- Proteína (g)
- Carboidratos (g)
- Gorduras (g)

---

## 🍽️ Extra (diferencial):

- Sugestão simples de refeições baseada nos macros
- Exemplo:
  - Café da manhã rico em proteína
  - Almoço equilibrado
  - Jantar leve

---

## 🎨 Interface:

- Design moderno fitness
- Mobile-first
- Botão: “Calcular macros”

---

## 🔥 Funcionalidades extras:

- Alternar estilo de dieta:
  - Padrão
  - Low carb
  - High carb
- Botão “Recalcular”
- Botão “Baixar PDF”

---

## ⚠️ Aviso:

"Valores estimados. Consulte um nutricionista para personalização."

