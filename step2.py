import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Input Validation
input_val_js = """
// Input Validation
document.addEventListener('input', function(e) {
  if (e.target && e.target.type === 'number') {
    if (e.target.value && parseFloat(e.target.value) < 0) {
      e.target.value = Math.abs(parseFloat(e.target.value));
    }
  }
});
"""

if "// Click outside" in content:
    content = content.replace("// Click outside", input_val_js + "\n// Click outside")

# Add visual feedback for PDF buttons
# Instead of modifying every function deeply, we can just wrap the jspdf loading
# But to change button text, we can use the `event` object available in inline handlers.

btn_wrapper_start = """
  let _btn = null, _origHTML = '';
  try { if(event && event.currentTarget && event.currentTarget.tagName === 'BUTTON') _btn = event.currentTarget; } catch(e){}
  if(!_btn && document.activeElement && document.activeElement.tagName === 'BUTTON') _btn = document.activeElement;
  if(_btn) { _origHTML = _btn.innerHTML; _btn.innerHTML = '\u231b Gerando...'; _btn.style.pointerEvents = 'none'; _btn.style.opacity = '0.7'; }
"""

btn_wrapper_end = """
  if(_btn) { _btn.innerHTML = _origHTML; _btn.style.pointerEvents = ''; _btn.style.opacity = '1'; }
"""

# We need to insert btn_wrapper_start at the very beginning of the try block, and btn_wrapper_end before return or catch
# Wait, replacing inside 6 functions is tricky using strings. Let's do it individually:

funcs = ["async function generatePDF({peso,altura,imc,range:r,pesoIdeal:pi,tmb,sexo,idade}){",
         "async function gerarPDFCalorias(tmb,peso,alt,idade,sexo){",
         "async function gerarPDFAgua(){",
         "async function gerarPDFMacros(){",
         "async function gerarPDFSim(){",
         "async function gerarPDF1RM(rm, peso, reps){"]

for func in funcs:
    if func in content:
        # insert start right after the guard
        guard = "if(!window.jspdf) {\n    try { await loadJSPDF(); } catch(e) { return; }\n  }"
        
        # We need to find the specific function block.
        # Find index of func
        idx = content.find(func)
        if idx != -1:
            try_idx = content.find("try{", idx)
            if try_idx != -1:
                content = content[:try_idx+4] + btn_wrapper_start + content[try_idx+4:]
                
                # Now find the doc.save for this function to put the end wrapper
                # or find the catch block.
                catch_idx = content.find("}catch(e){", try_idx)
                if catch_idx != -1:
                    content = content[:catch_idx] + btn_wrapper_end + content[catch_idx:]
                    
                    # also inject into catch block so it restores if error
                    catch_end_idx = content.find("}", catch_idx + 10)
                    content = content[:catch_idx+10] + btn_wrapper_end + content[catch_idx+10:]
                    print(f"Wrapped {func[:30]}")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Step 2 done")
