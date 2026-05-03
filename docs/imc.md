Deve ser acrescentado ao menu, como nova funcionalidade

### 🎯 Objetivo:
A aplicação deve calcular o IMC do usuário e, com base nos dados informados, gerar automaticamente um plano alimentar simples e adaptado ao perfil.

---

### 📊 Dados de entrada do usuário:
- Peso (kg)
- Altura (cm)
- Idade
- Sexo (masculino/feminino)
- Nível de atividade:
  - Sedentário
  - Levemente ativo
  - Moderadamente ativo
  - Muito ativo
- Objetivo:
  - Emagrecer
  - Manter peso
  - Ganhar massa

---

### ⚙️ Funcionalidades obrigatórias:

1. **Cálculo de IMC**
   - Fórmula: peso / (altura * altura)
   - Classificação automática:
     - Abaixo do peso
     - Normal
     - Sobrepeso
     - Obesidade

2. **Cálculo de Taxa Metabólica Basal (TMB)**
   - Usar fórmula de Mifflin-St Jeor

3. **Cálculo de gasto calórico diário**
   - Multiplicar TMB pelo nível de atividade

4. **Ajuste calórico baseado no objetivo**
   - Emagrecer: déficit de 300–500 kcal
   - Ganhar massa: superávit de 300–500 kcal
   - Manter: valor normal

5. **Distribuição de macronutrientes**
   - Proteína, carboidrato e gordura com base no objetivo

6. **Gerador automático de plano alimentar**
   - Criar refeições para:
     - Café da manhã
     - Almoço
     - Lanche
     - Jantar
   - Adaptar conforme objetivo e IMC
   - Variar alimentos (não repetir sempre os mesmos)

---

### 🎨 Interface (UI/UX):
- Design moderno estilo landing page fitness
- Responsivo (mobile + desktop)
- Botão “Calcular”
- Exibir:
  - IMC
  - Classificação
  - Calorias diárias
  - Plano alimentar

---

### 🔥 Funcionalidades extras:
- Botão “Gerar novo plano alimentar”
- Botão “Baixar relatório em PDF”
- Lista de compras baseada nas refeições
- Sugestão de ingestão de água diária
- Opção de dieta:
  - Padrão
  - Low carb
  - Vegetariana

---

### ⚠️ Importante:
- Exibir aviso:
  "Este plano é apenas uma sugestão. Consulte um nutricionista para orientação personalizada."

