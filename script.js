const editor = document.getElementById('editor');
const gutter = document.getElementById('gutter');

function updateLineNumbers(){
  const lines = (editor.value.match(/\n/g)||[]).length + 1;
  let s = '';
  for(let i=1;i<=lines;i++) s += i + '\n';
  gutter.textContent = s.trimEnd();
  gutter.scrollTop = editor.scrollTop;
}
editor.addEventListener('input', updateLineNumbers);
editor.addEventListener('scroll', ()=>{ gutter.scrollTop = editor.scrollTop; });
// Tab → 2 spaces
editor.addEventListener('keydown', (e)=>{
  if(e.key === 'Tab'){
    e.preventDefault();
    const {selectionStart, selectionEnd, value} = editor;
    const insert = '  ';
    editor.value = value.slice(0, selectionStart) + insert + value.slice(selectionEnd);
    editor.selectionStart = editor.selectionEnd = selectionStart + insert.length;
    updateLineNumbers();
  }
});

// ===== Minimal app wiring =====
const statusEl = document.getElementById('status');
const outEl = document.getElementById('output');
const btnRun = document.getElementById('btnRun');
const btnNew = document.getElementById('btnNew');
const btnHelp = document.getElementById('btnHelp');
const btnClearOut = document.getElementById('btnClearOut');
const btnReset = document.getElementById('btnReset');

let pyodide = null;

function appendOut(s){ outEl.value += (s ?? '') + "\n"; outEl.scrollTop = outEl.scrollHeight; }
function setStatus(s){ statusEl.textContent = s; }

// ★ (중요) 더 이상 HANGLE_PY 문자열은 사용하지 않음
//    외부 파일 hangle.py를 fetch해서 주입한다.

// ★ 편의 함수: JS에서 파이썬 한 줄 실행
async function runPy(code){
  try { await pyodide.runPythonAsync(code); }
  catch(e){ appendOut('[실행 오류] ' + (e?.message || e)); }
}

async function boot(){
  try{
    setStatus('Pyodide: fetching…');
    pyodide = await loadPyodide({
      stdout: s => appendOut(s),
      stderr: s => appendOut('[에러] ' + s)
    });

    setStatus('Pyodide: initializing…');

    // ★ 외부 hangle.py 로드 (캐시 방지용 쿼리스트링 권장)
    const resp = await fetch('./hangle.py?ver=20251106a', { cache: 'no-store' });
    if (!resp.ok) throw new Error('hangle.py 응답: ' + resp.status);
    const code = await resp.text();

    // ★ 파이썬 코드 실행 → 한글 명령어 builtins에 주입
    await pyodide.runPythonAsync(code);

    // appendOut('✅ hangle.py 로드 완료 (한글 명령어 + 도움말 적용)');
    setStatus('Ready');
    btnRun.disabled = false;

    // 에디터 초기 세팅
    // if (!editor.value.trim()) {
    //   editor.value = '출력("HangPy 준비 완료!")\n도움말()\n';
    // }
    // updateLineNumbers();
  }catch(e){
    setStatus('Pyodide: failed');
    appendOut('[초기화 오류] ' + (e?.message || e));
  }
}

async function runCode(){
  if (!pyodide){ appendOut('[실행 불가] 아직 준비되지 않았습니다'); return; }
  appendOut('\n----- 실행 -----');
  try{ await pyodide.runPythonAsync(editor.value); }
  catch(e){ appendOut('[실행 오류] ' + (e?.message || e)); }
}

function clearEditor(){ editor.value=''; updateLineNumbers(); }

// ★ 도움말 버튼: 편집창에 텍스트 넣는 대신 바로 실행하고 싶으면 아래로 교체
// function insertHelp(){ editor.value += (editor.value.endsWith('\n')? '' : '\n') + '도움말()\n'; updateLineNumbers(); }
async function insertHelp(){
  if (!pyodide){ appendOut('[안내] 아직 준비중입니다'); return; }
  appendOut('--- 변환표 출력 ---');
  await runPy("도움말()");   // 현재 도움말 포맷 그대로 사용 (함수명 표기 포함)
}

function clearOut(){ outEl.value=''; }
function resetKernel(){ outEl.value='(커널 재시작)'; location.reload(); }

window.addEventListener('load', ()=>{ boot(); updateLineNumbers(); });
document.getElementById('btnRun').addEventListener('click', runCode);
document.getElementById('btnNew').addEventListener('click', clearEditor);
document.getElementById('btnHelp').addEventListener('click', insertHelp);
document.getElementById('btnClearOut').addEventListener('click', clearOut);
document.getElementById('btnReset').addEventListener('click', resetKernel);
