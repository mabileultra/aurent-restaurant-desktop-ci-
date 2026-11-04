const fileListEl = document.getElementById('fileList');
const contentEl = document.getElementById('content');
const fileMetaEl = document.getElementById('fileMeta');
const dirHintEl = document.getElementById('dirHint');
const btnRefresh = document.getElementById('btnRefresh');
const btnFolder = document.getElementById('btnFolder');
const btnOpenTxt = document.getElementById('btnOpenTxt');

let selectedPath = null;
let files = [];

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function loadFiles() {
  const res = await window.activityLogViewer.list();
  if (!res?.ok) {
    fileMetaEl.textContent = res?.error || 'Ошибка списка';
    return;
  }
  dirHintEl.textContent = res.dir || '';
  files = (res.files || []).filter((f) => f.kind === 'txt');
  fileListEl.innerHTML = '';
  if (!files.length) {
    fileListEl.innerHTML = '<li style="padding:8px 12px;color:#94a3b8;font-size:12px">Пока нет файлов</li>';
    contentEl.textContent = 'Логи появятся после работы кассы.';
    return;
  }
  for (const file of files) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.path = file.path;
    btn.innerHTML = `<span class="files__name">${file.name}</span><span class="files__meta">${formatSize(file.size)}</span>`;
    if (file.path === selectedPath) btn.classList.add('is-active');
    btn.addEventListener('click', () => openFile(file.path));
    li.appendChild(btn);
    fileListEl.appendChild(li);
  }
  if (!selectedPath || !files.some((f) => f.path === selectedPath)) {
    await openFile(files[0].path);
  } else {
    await openFile(selectedPath);
  }
}

async function openFile(filePath) {
  selectedPath = filePath;
  [...fileListEl.querySelectorAll('button')].forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.path === filePath);
  });
  const res = await window.activityLogViewer.read(filePath);
  if (!res?.ok) {
    fileMetaEl.textContent = res?.error || 'Не удалось прочитать';
    contentEl.textContent = '';
    return;
  }
  const name = filePath.split(/[/\\]/).pop();
  fileMetaEl.textContent = res.truncated
    ? `${name} · показан хвост файла (${formatSize(res.size)})`
    : `${name} · ${formatSize(res.size)}`;
  contentEl.textContent = res.content || '(пусто)';
  contentEl.scrollTop = contentEl.scrollHeight;
}

btnRefresh.addEventListener('click', () => loadFiles());
btnFolder.addEventListener('click', () => window.activityLogViewer.openFolder());
btnOpenTxt.addEventListener('click', async () => {
  if (!selectedPath) return;
  await window.activityLogViewer.openFile(selectedPath);
});

window.activityLogViewer.onRefresh(() => loadFiles());
loadFiles();
setInterval(() => {
  if (document.visibilityState === 'visible') loadFiles();
}, 5000);
