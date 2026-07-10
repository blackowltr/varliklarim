// ═══════════════════════════════════════════════════════════
// utils.js — Utility functions (modal helpers, toast notifications)
// ═══════════════════════════════════════════════════════════

    function openModal(id) {
        document.getElementById(id).classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeModal(id) {
        document.getElementById(id).classList.remove('active');
        document.body.style.overflow = '';
    }
    function closePaymentModal() { closeModal('payment-modal'); }
    function closeZakatConfirmModal() { closeModal('zakat-confirm-modal'); }
    function closeDebtDetailModal() { closeModal('debt-detail-modal'); }
    let currentPnlModalIndex = -1;
    function closePnlModal() { currentPnlModalIndex = -1; closeModal('pnl-detail-modal'); }


    // --- Toast Bildirim Sistemi ---
    let toastTimer = null;
    function showToast(message, type) {
        const toast = document.getElementById('toast');
        const text = document.getElementById('toast-text');
        const icon = toast.querySelector('.toast-icon');
        if (!toast || !text) return;

        clearTimeout(toastTimer);
        toast.className = 'toast';

        text.textContent = message;

        if (type === 'success') {
            toast.classList.add('is-success');
            icon.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>';
        } else if (type === 'error') {
            toast.classList.add('is-error');
            icon.innerHTML = '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>';
        } else {
            toast.classList.add('is-loading');
            icon.innerHTML = '<path d="M21 12a9 9 0 1 1-6.219-8.56"/><polyline points="21 3 21 9 15 9"/>';
        }

        requestAnimationFrame(() => toast.classList.add('is-visible'));

        if (type !== 'loading') {
            toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3000);
        }
    }

