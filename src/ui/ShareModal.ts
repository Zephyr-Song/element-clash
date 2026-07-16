/**
 * ShareModal.ts - 分享卡片模态框
 */

export class ShareModal {
  readonly el: HTMLElement;

  constructor(shareText: string, onClose: () => void) {
    this.el = document.createElement('div');
    this.el.className = 'modal-overlay';

    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) onClose();
    });

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
      <h2>⚔️ 元素对决 · 战绩分享 ⚔️</h2>
      <div class="modal-body">
        <pre style="background:rgba(0,0,0,.3);padding:16px;border-radius:10px;white-space:pre-wrap;font-size:.88em;text-align:left;line-height:1.5;max-height:300px;overflow-y:auto">${shareText}</pre>
      </div>
      <div class="modal-footer" style="flex-direction:column;gap:8px">
        <button class="btn btn-sm btn-primary btn-block" id="btn-copy">📋 复制战绩文字版</button>
        <button class="btn btn-sm btn-secondary" id="btn-close">✖ 关闭</button>
      </div>
    `;

    modal.querySelector('#btn-copy')!.addEventListener('click', () => {
      navigator.clipboard.writeText(shareText).then(() => {
        const btn = modal.querySelector('#btn-copy') as HTMLButtonElement;
        btn.textContent = '✅ 已复制!';
        setTimeout(() => { btn.textContent = '📋 复制战绩文字版'; }, 2000);
      }).catch(() => {
        // fallback: textarea copy
        const ta = document.createElement('textarea');
        ta.value = shareText;
        ta.style.cssText = 'position:fixed;left:-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        const btn = modal.querySelector('#btn-copy') as HTMLButtonElement;
        btn.textContent = '✅ 已复制!';
        setTimeout(() => { btn.textContent = '📋 复制战绩文字版'; }, 2000);
      });
    });

    modal.querySelector('#btn-close')!.addEventListener('click', onClose);

    this.el.appendChild(modal);
  }
}
