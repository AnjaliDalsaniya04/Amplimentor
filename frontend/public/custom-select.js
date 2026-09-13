/**
 * Custom & Searchable Select Component for Amplimentor
 * Replaces native selects with modern, accessible, searchable dropdowns
 * with controlled scroll heights and intelligent positioning.
 */

class CustomSelect {
    constructor(element, options = {}) {
        this.selectEl = typeof element === 'string' ? document.querySelector(element) : element;
        if (!this.selectEl) return;

        this.options = options;
        this.isOpen = false;
        this.searchQuery = '';

        this.init();
    }

    init() {
        // Hide native select
        this.selectEl.style.display = 'none';

        // Build Custom Select Wrapper
        this.wrapper = document.createElement('div');
        this.wrapper.className = 'cs-wrapper';

        // Trigger Button
        this.trigger = document.createElement('button');
        this.trigger.type = 'button';
        this.trigger.className = 'cs-trigger';
        this.updateTriggerText();

        // Dropdown Panel
        this.panel = document.createElement('div');
        this.panel.className = 'cs-panel';

        // Read options from original select
        this.optionItems = Array.from(this.selectEl.options).map(opt => ({
            value: opt.value,
            text: opt.textContent,
            selected: opt.selected,
            disabled: opt.disabled
        }));

        // Render Search Box if > 3 options
        if (this.optionItems.length > 3) {
            const searchBox = document.createElement('div');
            searchBox.className = 'cs-search-box';
            searchBox.innerHTML = `
                <i class="fa-solid fa-magnifying-glass cs-search-icon"></i>
                <input type="text" class="cs-search-input" placeholder="Search options..." autocomplete="off" />
            `;

            this.searchInput = searchBox.querySelector('.cs-search-input');
            this.searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase().trim();
                this.renderOptionsList();
            });

            this.searchInput.addEventListener('click', (e) => e.stopPropagation());

            this.panel.appendChild(searchBox);

            const divider = document.createElement('div');
            divider.className = 'cs-divider';
            this.panel.appendChild(divider);
        }

        // List Container
        this.listEl = document.createElement('div');
        this.listEl.className = 'cs-list';
        this.panel.appendChild(this.listEl);

        this.renderOptionsList();

        this.wrapper.appendChild(this.trigger);
        this.wrapper.appendChild(this.panel);

        this.selectEl.parentNode.insertBefore(this.wrapper, this.selectEl.nextSibling);

        // Event Listeners
        this.trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (this.isOpen && !this.wrapper.contains(e.target)) {
                this.close();
            }
        });
    }

    updateTriggerText() {
        const selectedOpt = Array.from(this.selectEl.options).find(o => o.selected) || this.selectEl.options[0];
        const label = selectedOpt ? selectedOpt.textContent : 'Select...';
        this.trigger.innerHTML = `
            <span class="cs-trigger-text">${label}</span>
            <i class="fa-solid fa-chevron-down cs-arrow"></i>
        `;
    }

    renderOptionsList() {
        this.listEl.innerHTML = '';

        const filtered = this.optionItems.filter(item => 
            !this.searchQuery || item.text.toLowerCase().includes(this.searchQuery)
        );

        if (filtered.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'cs-empty';
            empty.textContent = 'No matching options';
            this.listEl.appendChild(empty);
            return;
        }

        filtered.forEach(item => {
            const optDiv = document.createElement('div');
            optDiv.className = `cs-option ${item.selected ? 'selected' : ''}`;
            optDiv.innerHTML = `
                <span>${item.text}</span>
                ${item.selected ? '<i class="fa-solid fa-check cs-check"></i>' : ''}
            `;

            optDiv.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectValue(item.value);
            });

            this.listEl.appendChild(optDiv);
        });
    }

    selectValue(val) {
        this.selectEl.value = val;
        this.selectEl.dispatchEvent(new Event('change', { bubbles: true }));

        this.optionItems.forEach(item => {
            item.selected = (item.value === val);
        });

        this.updateTriggerText();
        this.renderOptionsList();
        this.close();
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // Close all other custom selects first
        document.querySelectorAll('.cs-wrapper.open').forEach(w => w.classList.remove('open'));

        this.isOpen = true;
        this.wrapper.classList.add('open');

        // Check viewport boundaries for intelligent positioning
        const rect = this.wrapper.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;

        if (spaceBelow < 260 && rect.top > 260) {
            this.panel.classList.add('open-upward');
        } else {
            this.panel.classList.remove('open-upward');
        }

        if (this.searchInput) {
            setTimeout(() => this.searchInput.focus(), 50);
        }
    }

    close() {
        this.isOpen = false;
        this.wrapper.classList.remove('open');
        this.searchQuery = '';
        if (this.searchInput) {
            this.searchInput.value = '';
            this.renderOptionsList();
        }
    }
}

// Auto-initialize all <select class="custom-select-box"> or <select class="student-select-box">
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('select.custom-select-box, select.student-select-box, select.modern-select').forEach(select => {
        new CustomSelect(select);
    });
});
