/**
 * Amplimentor Premium Search Engine Helper
 * Provides suggestions, recent searches, keyword highlights, and input debouncing.
 */

class SearchEngine {
    constructor(inputId, options = {}) {
        this.input = document.getElementById(inputId);
        if (!this.input) return;

        this.options = Object.assign({
            storageKey: 'amplimentor_recent_searches',
            debounceMs: 250,
            onSelect: (item) => {
                window.location.href = item.link;
            }
        }, options);

        this.debounceTimer = null;
        this.dropdown = null;
        this.recentSearches = this.loadRecentSearches();

        this.init();
    }

    init() {
        // Create suggestion dropdown element wrapper
        this.dropdown = document.createElement('div');
        this.dropdown.className = 'search-suggestions-dropdown';
        this.dropdown.style.cssText = `
            position: absolute;
            background: #FFFFFF;
            border: 1px solid var(--border-color, #E2E8F0);
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1);
            width: 100%;
            max-width: 400px;
            z-index: 9999;
            margin-top: 6px;
            display: none;
            padding: 8px 0;
            box-sizing: border-box;
            font-family: inherit;
        `;
        
        // Append right after input parent
        const parent = this.input.parentElement;
        if (parent) {
            parent.style.position = 'relative';
            parent.appendChild(this.dropdown);
        }

        // Event listeners
        this.input.addEventListener('focus', () => this.handleFocus());
        this.input.addEventListener('input', () => this.handleInput());
        document.addEventListener('click', (e) => {
            if (e.target !== this.input && !this.dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    }

    loadRecentSearches() {
        try {
            const data = localStorage.getItem(this.options.storageKey);
            return data ? JSON.parse(data) : ['Biology Cell division', 'Physics trial class', 'Heli Patel schedule'];
        } catch {
            return [];
        }
    }

    saveRecentSearches() {
        try {
            localStorage.setItem(this.options.storageKey, JSON.stringify(this.recentSearches));
        } catch (err) {}
    }

    addRecentSearch(query) {
        if (!query || query.trim() === '') return;
        this.recentSearches = this.recentSearches.filter(q => q.toLowerCase() !== query.toLowerCase());
        this.recentSearches.unshift(query);
        this.recentSearches = this.recentSearches.slice(0, 5); // keep last 5
        this.saveRecentSearches();
    }

    handleFocus() {
        if (this.input.value.trim() === '') {
            this.showRecentSearches();
        } else {
            this.handleInput();
        }
    }

    handleInput() {
        clearTimeout(this.debounceTimer);
        const query = this.input.value.trim();

        if (query === '') {
            this.showRecentSearches();
            return;
        }

        this.showLoading();

        this.debounceTimer = setTimeout(() => {
            this.fetchSuggestions(query);
        }, this.options.debounceMs);
    }

    showLoading() {
        this.dropdown.style.display = 'block';
        this.dropdown.innerHTML = `
            <div style="padding: 16px; text-align: center; color: #64748B; font-size: 13.5px; font-weight: 500;">
                <i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Searching...
            </div>
        `;
    }

    showRecentSearches() {
        if (this.recentSearches.length === 0) {
            this.hideDropdown();
            return;
        }

        this.dropdown.style.display = 'block';
        let html = `
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94A3B8; padding: 6px 16px; letter-spacing: 0.05em;">
                Recent Searches
            </div>
        `;

        this.recentSearches.forEach(q => {
            html += `
                <div class="suggestion-item" style="padding: 10px 16px; cursor: pointer; font-size: 13.5px; display: flex; align-items: center; gap: 8px; color: #334155; transition: background 0.15s;" onclick="document.getElementById('${this.input.id}').value = '${q}'; document.getElementById('${this.input.id}').focus();">
                    <i class="fa-solid fa-clock-rotate-left" style="color: #94A3B8; font-size: 12px;"></i>
                    <span>${q}</span>
                </div>
            `;
        });

        this.dropdown.innerHTML = html;
        this.applyItemHoverStyle();
    }

    fetchSuggestions(query) {
        // High quality local mock search database to provide realistic SaaS instant responses
        const mockDatabase = [
            { name: 'Anjali Patel (NEET Biology Mentor)', type: 'mentor', link: '/student/mentors', details: 'Biology Specialist' },
            { name: 'Heli Patel (Botany Mentor)', type: 'mentor', link: '/student/mentors', details: 'Botany expert' },
            { name: 'Priya Shah (Physics Mentor)', type: 'mentor', link: '/student/mentors', details: 'Class 12 Electromagnetism' },
            { name: 'Botany Syllabus Review Session', type: 'session', link: '/sessions.html', details: 'Upcoming Session slot' },
            { name: 'Optics CBSE derivations notes', type: 'resource', link: '/chat.html', details: 'Shared PDF attachment file' },
        ];

        const matches = mockDatabase.filter(item => 
            item.name.toLowerCase().includes(query.toLowerCase()) || 
            item.details.toLowerCase().includes(query.toLowerCase())
        );

        if (matches.length === 0) {
            this.dropdown.innerHTML = `
                <div style="padding: 24px; text-align: center; color: #64748B;">
                    <div style="font-size: 24px; margin-bottom: 8px; color: #94A3B8;"><i class="fa-solid fa-magnifying-glass-minus"></i></div>
                    <div style="font-weight: 700; font-size: 13.5px; color: #0F172A;">No Results Found</div>
                    <div style="font-size: 12px; margin-top: 4px;">Try searching for "Biology" or "Patel"</div>
                </div>
            `;
            return;
        }

        let html = `
            <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #94A3B8; padding: 6px 16px; letter-spacing: 0.05em;">
                Matching suggestions
            </div>
        `;

        matches.forEach(item => {
            const highlightedName = this.highlightText(item.name, query);
            const icon = item.type === 'mentor' ? 'fa-user-tie' : (item.type === 'session' ? 'fa-calendar-day' : 'fa-file-lines');
            
            html += `
                <div class="suggestion-item" style="padding: 10px 16px; cursor: pointer; font-size: 13.5px; display: flex; align-items: center; justify-content: space-between; gap: 8px; transition: background 0.15s;" onclick="window.location.href='${item.link}'">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <i class="fa-solid ${icon}" style="color: var(--primary, #3B82F6); width: 14px;"></i>
                        <div>
                            <div style="font-weight: 700; color: #1E293B;">${highlightedName}</div>
                            <div style="font-size: 11px; color: #64748B;">${item.details}</div>
                        </div>
                    </div>
                    <span style="font-size: 10.5px; background: #F1F5F9; color: #475569; padding: 2px 6px; border-radius: 4px; font-weight: 700; text-transform: uppercase;">${item.type}</span>
                </div>
            `;
        });

        this.dropdown.innerHTML = html;
        this.applyItemHoverStyle();
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark style="background-color: #FEF08A; color: #854D0E; font-weight: 800; padding: 0 2px; border-radius: 2px;">$1</mark>');
    }

    applyItemHoverStyle() {
        this.dropdown.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('mouseenter', () => item.style.backgroundColor = '#F8FAFC');
            item.addEventListener('mouseleave', () => item.style.backgroundColor = 'transparent');
        });
    }

    hideDropdown() {
        if (this.dropdown) {
            this.dropdown.style.display = 'none';
        }
    }
}

// Auto-instantiate on header search input
document.addEventListener('DOMContentLoaded', () => {
    const headerInput = document.getElementById('dashboardSearch');
    if (headerInput) {
        new SearchEngine('dashboardSearch');
    }
});
