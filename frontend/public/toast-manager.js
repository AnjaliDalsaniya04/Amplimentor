/**
 * Amplimentor Premium Toast Notification System Manager
 */

class ToastManager {
    constructor() {
        this.container = null;
    }

    ensureContainer() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-alerts-container';
        }
        if (document.body && !document.body.contains(this.container)) {
            document.body.appendChild(this.container);
        }
    }

    show(title, body = '', type = 'info') {
        try {
            this.ensureContainer();
            if (!this.container) return;

            const card = document.createElement('div');
            card.className = `toast-card ${type}`;
            
            let icon = 'fa-circle-info';
            if (type === 'success') icon = 'fa-circle-check';
            else if (type === 'error') icon = 'fa-circle-exclamation';
            else if (type === 'warning') icon = 'fa-triangle-exclamation';

            card.innerHTML = `
                <div style="font-size: 18px; color: ${type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : (type === 'warning' ? '#F59E0B' : '#3B82F6'))};">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="toast-content-wrapper">
                    <h4 class="toast-title-text">${title}</h4>
                    ${body ? `<p class="toast-body-text">${body}</p>` : ''}
                </div>
                <button class="btn-toast-dismiss" onclick="this.parentElement.remove()"><i class="fa-solid fa-xmark"></i></button>
                <div class="toast-progress-indicator"></div>
            `;

            this.container.appendChild(card);

            // Auto remove after 4 seconds
            setTimeout(() => {
                if (card && card.parentElement) {
                    card.remove();
                }
            }, 4000);
        } catch (err) {
            console.warn("Toast error:", err);
        }
    }

    success(title, body = '') { this.show(title, body, 'success'); }
    error(title, body = '') { this.show(title, body, 'error'); }
    warning(title, body = '') { this.show(title, body, 'warning'); }
    info(title, body = '') { this.show(title, body, 'info'); }
}

// Global instantiation
window.toast = new ToastManager();
window.showToast = (msg) => window.toast.info(msg);
