// Amplimentor Unified SaaS AppLayout Loader
(function() {
    const pathName = window.location.pathname;

    // Direct parent mapping for back button routing
    const parentMapping = {
        '/assignments': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/assignments.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/quiz': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/quiz.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/study-resources': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/study-resources.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/learning-progress': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/learning-progress.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/learning-goals': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/learning-goals.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/whiteboard': { path: '/session-workspace.html', label: 'Session' },
        '/whiteboard.html': { path: '/session-workspace.html', label: 'Session' },
        '/certificates.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/gamification.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/attendance.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/session-notes.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/recordings.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/reviews.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/finance.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/support.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/my-students.html': { path: '/mentor-dashboard.html', label: 'Dashboard' },
        '/my-mentors.html': { path: '/student-dashboard.html', label: 'Dashboard' },
        '/session-workspace.html': { path: '/student-dashboard.html', label: 'Dashboard' }
    };

    const getParentRedirect = (role) => {
        const key = Object.keys(parentMapping).find(k => pathName.endsWith(k));
        if (key && parentMapping[key]) {
            let parent = { ...parentMapping[key] };
            if (role === 'mentor') {
                if (parent.path === '/student-dashboard.html') {
                    parent.path = '/mentor-dashboard.html';
                }
            }
            return parent;
        }
        return role === 'mentor' ? { path: '/mentor-dashboard.html', label: 'Dashboard' } : { path: '/student-dashboard.html', label: 'Dashboard' };
    };

    // Standardized Page metadata (Title & Description)
    const getPageMeta = (path, docTitle) => {
        const cleanPath = path.toLowerCase();
        if (cleanPath.includes('mentor-dashboard')) {
            return { title: 'Mentor Dashboard', subtitle: 'Overview of your earnings, active student logs, and request panels.' };
        } else if (cleanPath.includes('student-dashboard')) {
            return { title: 'Learner Dashboard', subtitle: 'Overview of your learning progress, goals, and upcoming sessions.' };
        } else if (cleanPath.includes('students')) {
            return { title: 'My Students', subtitle: 'Manage student relationships, review logs, and progress metrics.' };
        } else if (cleanPath.includes('mentors')) {
            return { title: 'My Mentors', subtitle: 'Browse profile reviews and upcoming bookings with mentors.' };
        } else if (cleanPath.includes('sessions')) {
            return { title: 'Sessions', subtitle: 'Schedule slot bookings, review calendars, and join active classes.' };
        } else if (cleanPath.includes('assignments')) {
            return { title: 'Assignments', subtitle: 'Create, review, grade, and track homework tasks.' };
        } else if (cleanPath.includes('quiz')) {
            return { title: 'Quizzes & Exercises', subtitle: 'Practice multiple choice quizzes and evaluate report results.' };
        } else if (cleanPath.includes('resources')) {
            return { title: 'Study Resources', subtitle: 'Access reference files, session worksheets, and study notes.' };
        } else if (cleanPath.includes('attendance')) {
            return { title: 'Attendance', subtitle: 'Track session attendance logs, absentees, and percentages.' };
        } else if (cleanPath.includes('notes')) {
            return { title: 'Session Notes', subtitle: 'View feedback summaries, takeaways, and checklist logs.' };
        } else if (cleanPath.includes('recordings')) {
            return { title: 'Recordings', subtitle: 'Playback saved video streams and interactive whiteboard replays.' };
        } else if (cleanPath.includes('finance')) {
            return { title: 'Finance Workspace', subtitle: 'Manage your earnings, payouts, invoices and revenue analytics.' };
        } else if (cleanPath.includes('reviews')) {
            return { title: 'Reviews & Feedback', subtitle: 'Monitor client ratings, reviews, and testimonials.' };
        } else if (cleanPath.includes('support')) {
            return { title: 'Support Center', subtitle: 'Contact our customer service, search base logs, and read terms.' };
        } else if (cleanPath.includes('settings')) {
            return { title: 'Settings', subtitle: 'Manage profile photos, credentials, and notification rules.' };
        } else if (cleanPath.includes('profile')) {
            return { title: 'User Profile', subtitle: 'View personal information, achievements, and statistics.' };
        }
        
        const cleanTitle = docTitle.replace(' - Amplimentor', '').trim();
        return { title: cleanTitle || 'Workspace', subtitle: 'Manage active modules and educational workflows.' };
    };

    document.addEventListener('DOMContentLoaded', async () => {
        let role = 'student';
        let userName = 'Heli Patel';
        let userPhoto = '/default-avatar.png';

        // Determine active role based on URL filename first, then localStorage/profile
        const lowerPath = pathName.toLowerCase();
        if (lowerPath.includes('mentor-') || lowerPath.includes('/mentor/')) {
            role = 'mentor';
        } else if (lowerPath.includes('student-') || lowerPath.includes('/student/')) {
            role = 'student';
        } else {
            // Fallback to simulatedRole or server profile
            const saved = localStorage.getItem('simulatedRole');
            role = saved ? saved : 'student';
        }

        try {
            const apiBase = (typeof API_BASE !== 'undefined') ? API_BASE : '';
            const res = await fetch(apiBase + '/api/profile', { credentials: 'include' });
            if (res.ok) {
                const profile = await res.json();
                userName = profile.name || userName;
                if (profile.photo) {
                    userPhoto = profile.photo.startsWith('http') ? profile.photo : (apiBase + '/uploads/' + profile.photo);
                }
                // If it is a generic page and profile exists, keep simulation sync
                if (!lowerPath.includes('mentor-') && !lowerPath.includes('/mentor/') &&
                    !lowerPath.includes('student-') && !lowerPath.includes('/student/')) {
                    role = localStorage.getItem('simulatedRole') || profile.role;
                }
            }
        } catch (err) {}

        // Apply correct CSS
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = role === 'mentor' ? '/mentor-dashboard.css' : '/student-dashboard.css';
        document.head.appendChild(cssLink);

        // Inject AppLayout System Styling
        const overrideStyle = document.createElement('style');
        overrideStyle.textContent = `
            /* --- Reset --- */
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                height: 100% !important;
                background-color: #F8FAFC !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            }

            /* --- App Layout shell wrapper --- */
            .app-shell {
                display: flex !important;
                min-height: 100vh !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background-color: #F8FAFC !important;
            }

            /* --- Fixed Left Sidebar --- */
            .app-sidebar {
                width: 280px !important;
                min-width: 280px !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                height: 100vh !important;
                background-color: #FFFFFF !important;
                border-right: 1px solid #E2E8F0 !important;
                display: flex !important;
                flex-direction: column !important;
                z-index: 1000 !important;
                transition: all 0.2s ease !important;
                box-sizing: border-box !important;
            }
            .saas-sidebar-logo {
                height: 72px !important;
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 0 24px !important;
                border-bottom: 1px solid #E2E8F0 !important;
                text-decoration: none !important;
                color: #0F172A !important;
                font-weight: 700 !important;
                font-size: 16px !important;
                flex-shrink: 0 !important;
            }
            .saas-sidebar-logo svg {
                width: 28px !important;
                height: 28px !important;
                flex-shrink: 0 !important;
            }
            .saas-sidebar-nav {
                flex: 1 !important;
                overflow-y: auto !important;
                padding: 24px 16px !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 20px !important;
            }
            .saas-sidebar-group {
                display: flex !important;
                flex-direction: column !important;
                gap: 4px !important;
            }
            .saas-sidebar-group-title {
                font-size: 11px !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                color: #94A3B8 !important;
                margin-bottom: 6px !important;
                padding-left: 8px !important;
            }
            .saas-sidebar-link {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
                padding: 10px 12px !important;
                color: #475569 !important;
                text-decoration: none !important;
                font-size: 13.5px !important;
                font-weight: 600 !important;
                border-radius: 8px !important;
                transition: all 0.15s !important;
            }
            .saas-sidebar-link:hover {
                background-color: #F1F5F9 !important;
                color: #0F172A !important;
            }
            .saas-sidebar-link.active {
                background-color: #EFF6FF !important;
                color: #2563EB !important;
                border-left: 3px solid #2563EB !important;
                border-radius: 0 8px 8px 0 !important;
            }
            .saas-sidebar-link svg {
                width: 20px !important;
                height: 20px !important;
                flex-shrink: 0 !important;
            }
            .saas-sidebar-footer {
                padding: 16px !important;
                border-top: 1px solid #E2E8F0 !important;
                flex-shrink: 0 !important;
            }

            /* --- Sticky Main Content Area --- */
            .app-content {
                margin-left: 280px !important;
                flex: 1 !important;
                min-width: 0 !important;
                width: calc(100% - 280px) !important;
                background-color: #F8FAFC !important;
                display: flex !important;
                flex-direction: column !important;
                min-height: 100vh !important;
                transition: margin-left 0.2s ease !important;
                box-sizing: border-box !important;
            }

            /* --- Sticky Header --- */
            .app-header {
                height: 72px !important;
                width: 100% !important;
                min-width: 0 !important;
                background-color: #FFFFFF !important;
                border-bottom: 1px solid #E2E8F0 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                padding: 0 clamp(20px, 2.5vw, 40px) !important;
                position: sticky !important;
                top: 0 !important;
                z-index: 99 !important;
                box-sizing: border-box !important;
                transition: box-shadow 0.2s !important;
            }
            .app-header.scrolled {
                box-shadow: 0 4px 12px rgba(15,23,42,0.03) !important;
            }
            .header-left {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
                flex: 1 !important;
            }
            .mobile-menu-toggle {
                display: none !important;
                background: none !important;
                border: none !important;
                color: #475569 !important;
                font-size: 20px !important;
                cursor: pointer !important;
            }
            .header-search-container {
                position: relative !important;
                width: 100% !important;
                max-width: 420px !important; /* Locked width of 420px */
            }
            .header-search-container svg {
                position: absolute !important;
                left: 14px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                color: #94A3B8 !important;
                width: 16px !important;
                height: 16px !important;
            }
            .header-search-input {
                width: 100% !important;
                padding: 10px 16px 10px 40px !important;
                border: 1.5px solid #E2E8F0 !important;
                border-radius: 10px !important;
                font-size: 13px !important;
                color: #0F172A !important;
                background-color: #F8FAFC !important;
                outline: none !important;
                transition: all 0.2s !important;
            }
            .header-search-input:focus {
                border-color: #3B82F6 !important;
                background-color: #FFFFFF !important;
                box-shadow: 0 0 0 3px rgba(59,130,246,0.1) !important;
            }
            .header-right {
                display: flex !important;
                align-items: center !important;
                gap: 16px !important;
                position: relative !important;
            }
            .header-action-btn {
                width: 40px !important;
                height: 40px !important;
                border-radius: 10px !important;
                border: 1px solid #E2E8F0 !important;
                background-color: transparent !important;
                color: #475569 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                cursor: pointer !important;
                position: relative !important;
                transition: all 0.2s !important;
            }
            .header-action-btn:hover {
                background-color: #F1F5F9 !important;
                color: #0F172A !important;
                border-color: #CBD5E1 !important;
            }
            .header-action-btn svg,
            .header-action-btn i {
                width: 20px !important;
                height: 20px !important;
                color: #475569 !important;
                stroke: #475569 !important;
                fill: none !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }
            .saas-profile-dropdown {
                position: relative !important;
                display: flex !important;
                align-items: center !important;
                gap: 8px !important;
                cursor: pointer !important;
                padding: 6px 12px !important;
                border-radius: 10px !important;
                transition: background 0.2s !important;
                border: 1px solid transparent !important;
            }
            .saas-profile-dropdown:hover {
                background-color: #F8FAFC !important;
                border-color: #E2E8F0 !important;
            }
            .saas-profile-dropdown .avatar-img {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                object-fit: cover;
                border: 1.5px solid #E2E8F0;
            }
            .saas-profile-dropdown .user-fullname {
                font-size: 13px;
                font-weight: 700;
                color: #334155;
            }
            .saas-profile-dropdown .dropdown-arrow {
                width: 14px;
                height: 14px;
                color: #94A3B8;
            }
            .saas-dropdown-menu {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 8px;
                background-color: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.08);
                width: 210px;
                padding: 6px;
                z-index: 1000;
            }
            .saas-dropdown-menu a {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                padding: 10px 12px !important;
                text-decoration: none !important;
                color: #475569 !important;
                font-size: 13px !important;
                font-weight: 600 !important;
                border-radius: 8px !important;
                transition: all 0.15s !important;
            }
            .saas-dropdown-menu a:hover {
                background-color: #F1F5F9 !important;
                color: #0F172A !important;
            }
            .saas-dropdown-menu svg {
                width: 16px !important;
                height: 16px !important;
                color: #64748B !important;
            }

            /* --- Content Wrapper & Centering --- */
            .page-container {
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 24px clamp(20px, 2.5vw, 40px) 48px clamp(20px, 2.5vw, 40px) !important;
                box-sizing: border-box !important;
                display: flex !important;
                flex-direction: column !important;
                gap: 24px !important;
                flex: 1 !important;
                min-width: 0 !important;
            }
            .page-container * {
                box-sizing: border-box;
            }

            /* --- Page Title System --- */
            .page-header {
                display: flex !important;
                flex-direction: column !important;
                gap: 8px !important;
                border-bottom: 1px solid #F1F5F9 !important;
                padding-bottom: 16px !important;
                margin-bottom: 0 !important;
                text-align: left !important;
            }
            .saas-page-title-row {
                display: flex !important;
                align-items: center !important;
                gap: 12px !important;
            }
            .page-header h1 {
                font-size: 24px !important;
                font-weight: 800 !important;
                color: #0F172A !important;
                letter-spacing: -0.02em !important;
                margin: 0 !important;
            }
            .page-header p {
                font-size: 14px !important;
                color: #64748B !important;
                margin: 0 !important;
            }
            .back-navigation-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                width: 32px !important;
                height: 32px !important;
                border-radius: 50% !important;
                color: #475569 !important;
                background: transparent !important;
                transition: all 0.2s !important;
                text-decoration: none !important;
                border: 1px solid #E2E8F0 !important;
            }
            .back-navigation-btn:hover {
                background-color: #E2E8F0 !important;
                color: #0F172A !important;
                border-color: #CBD5E1 !important;
            }
            .back-navigation-btn svg,
            .back-navigation-btn i {
                width: 16px !important;
                height: 16px !important;
                color: #475569 !important;
                stroke: #475569 !important;
                fill: none !important;
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
            }

            /* --- Unified Cards System --- */
            .premium-card,
            .mentor-premium-card,
            .stat-card-premium,
            .student-summary-card,
            .fin-card,
            .kb-card,
            .chat-card,
            .assignment-card,
            .resource-card,
            .quiz-card {
                background-color: #FFFFFF !important;
                border-radius: 12px !important;
                border: 1px solid #E2E8F0 !important;
                box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05) !important;
                padding: 24px !important;
                transition: transform 0.2s, box-shadow 0.2s !important;
                box-sizing: border-box !important;
            }

            /* --- Notifications Dropdown --- */
            .notifications-dropdown-menu {
                display: none;
                position: absolute;
                top: 100%;
                right: 0;
                margin-top: 8px;
                background-color: #FFFFFF;
                border: 1px solid #E2E8F0;
                border-radius: 12px;
                box-shadow: 0 10px 25px -5px rgba(15,23,42,0.08), 0 8px 10px -6px rgba(15,23,42,0.08);
                width: 340px;
                z-index: 1000;
                overflow: hidden;
            }
            .notifications-dropdown-menu .dropdown-header {
                padding: 12px 16px;
                border-bottom: 1px solid #F1F5F9;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 700;
                font-size: 13.5px;
                color: #0F172A;
            }
            .notifications-dropdown-menu .mark-all-read-btn {
                border: none;
                background: none;
                color: #3B82F6;
                font-size: 11.5px;
                font-weight: 700;
                cursor: pointer;
            }
            .notifications-dropdown-menu .mark-all-read-btn:hover {
                text-decoration: underline;
            }
            .notifications-list-container {
                max-height: 280px;
                overflow-y: auto;
            }
            .notification-item {
                padding: 12px 16px;
                border-bottom: 1px solid #F1F5F9;
                display: flex;
                gap: 12px;
                position: relative;
                transition: background 0.15s;
                cursor: pointer;
                text-align: left;
            }
            .notification-item:hover {
                background-color: #F8FAFC;
            }
            .notification-item.unread {
                background-color: #F0F9FF;
            }
            .notification-item.unread:hover {
                background-color: #E0F2FE;
            }
            .notification-icon-wrap {
                width: 36px;
                height: 36px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .notification-icon-wrap svg {
                width: 18px;
                height: 18px;
            }
            .notification-info {
                flex-grow: 1;
                font-size: 12px;
                line-height: 1.4;
            }
            .notification-info strong {
                color: #1E293B;
                display: block;
                margin-bottom: 2px;
            }
            .notification-info p {
                color: #64748B;
                margin: 0 0 4px 0;
            }
            .notification-time {
                color: #94A3B8;
                font-size: 10.5px;
            }
            .unread-dot {
                position: absolute;
                right: 16px;
                top: 50%;
                transform: translateY(-50%);
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background-color: #3B82F6;
            }
            .view-all-notifications-link {
                display: block;
                text-align: center;
                padding: 10px;
                background-color: #F8FAFC;
                color: #3B82F6;
                font-weight: 700;
                font-size: 12px;
                text-decoration: none;
                border-top: 1px solid #F1F5F9;
            }
            .view-all-notifications-link:hover {
                background-color: #EFF6FF;
            }
            .notification-badge-count {
                position: absolute;
                top: 2px;
                right: 2px;
                background-color: #EF4444;
                color: #FFFFFF;
                font-size: 9px;
                font-weight: 800;
                padding: 1px 4px;
                border-radius: 10px;
                line-height: 1;
                border: 1.5px solid #FFFFFF;
            }

            .mobile-search-btn {
                display: none !important;
            }

            /* --- Dashboard Greeting Integration --- */
            .welcome-hero-left, .greeting-text-wrap {
                display: none !important;
            }
            .welcome-hero-grid {
                display: block !important;
                margin-top: 0 !important;
                padding-top: 0 !important;
            }
            .welcome-hero-right {
                width: 100% !important;
            }
            .greeting-section {
                display: none !important;
            }

            /* --- Responsive Viewports --- */
            @media (max-width: 1024px) {
                .app-sidebar {
                    width: 80px !important;
                    min-width: 80px !important;
                }
                .saas-sidebar-logo span,
                .saas-sidebar-group-title,
                .saas-sidebar-link span,
                .saas-sidebar-footer span {
                    display: none !important;
                }
                .app-content {
                    margin-left: 80px !important;
                }
            }
            @media (max-width: 768px) {
                .app-sidebar {
                    transform: translateX(-100%) !important;
                    position: fixed !important;
                    width: 280px !important;
                    z-index: 1000 !important;
                }
                .app-sidebar.drawer-open {
                    transform: translateX(0) !important;
                }
                .saas-sidebar-logo span,
                .saas-sidebar-group-title,
                .saas-sidebar-link span,
                .saas-sidebar-footer span {
                    display: flex !important;
                }
                .saas-sidebar-group-title {
                    display: block !important;
                }
                .app-content {
                    margin-left: 0 !important;
                }
                .mobile-menu-toggle {
                    display: inline-flex !important;
                }
                .mobile-search-btn {
                    display: inline-flex !important;
                }
            }

            /* --- Force removal of original/legacy layout grids --- */
            header:not(.app-header), nav:not(.saas-sidebar-nav), 
            aside.sidebar, aside.dashboard-sidebar, aside.app-sidebar-legacy,
            .navbar, .dashboard-header, .dashboard-sidebar {
                display: none !important;
            }

            /* High specificity overrides to reset margins, padding, and max-widths of original containers */
            .app-content .dashboard-wrapper,
            .app-content .dashboard-main,
            .app-content .dashboard-content,
            .app-content .workspace-wrapper,
            .app-content .workspace-main,
            .app-content .workspace-content,
            .app-content .quiz-content,
            .app-content .resource-content,
            .app-content .fin-container,
            .app-content .att-container,
            .app-content .crm-container,
            .app-content .assignments-grid-container,
            .app-content .quiz-grid-layout,
            .app-content .sup-container,
            .app-content .library-workspace-container,
            .app-content .settings-workspace-container,
            .app-content .notes-container,
            .app-content .rev-container,
            .app-content .rec-container,
            .app-content .goals-workspace-grid,
            .app-content .analytics-container,
            .app-content .gamify-container,
            .app-content .cert-container,
            .app-content .booking-content-container,
            .app-content .mentor-sessions-container,
            .app-content .student-sessions-container,
            .app-content .notif-container,
            .app-content .settings-container,
            .app-content .goals-container,
            .app-content .progress-container,
            .app-content .container {
                padding: 0 !important;
                margin: 0 !important;
                max-width: 100% !important;
                width: 100% !important;
                flex: 1 !important;
                min-width: 0 !important;
                box-sizing: border-box !important;
            }

            /* Standardized Layout Utilities for Inner Modules */
            .saas-kpi-grid, .metrics-grid, .kpi-grid, .stats-row, .fin-metrics, .att-metrics {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
                gap: 20px !important;
                width: 100% !important;
            }
            .saas-split-layout, .crm-main-split, .fin-split, .fin-grid-2, .att-main-split, .notes-split, .reviews-split {
                display: grid !important;
                grid-template-columns: minmax(0, 2.2fr) minmax(320px, 1fr) !important;
                gap: 24px !important;
                width: 100% !important;
                align-items: start !important;
            }
            @media (max-width: 1024px) {
                .saas-split-layout, .crm-main-split, .fin-split, .fin-grid-2, .att-main-split, .notes-split, .reviews-split {
                    grid-template-columns: 1fr !important;
                }
            }
            .saas-directory-grid, .directory-grid, .sessions-grid, .assignment-grid, .assignments-grid, .resource-grid, .resources-grid, .quiz-grid, .card-grid, .rec-grid, .notes-grid, .reviews-grid, .support-grid, .faq-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
                gap: 20px !important;
                width: 100% !important;
            }
            .responsive-table-wrapper,
            .app-table-wrapper,
            .att-table-wrap,
            .fin-table-wrap {
                width: 100% !important;
                overflow-x: auto !important;
                -webkit-overflow-scrolling: touch !important;
                margin: 12px 0 !important;
                border-radius: 12px !important;
                border: 1px solid #E2E8F0 !important;
                background: #FFFFFF !important;
                box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03) !important;
            }

            /* --- GLOBAL TABLE ARCHITECTURE --- */
            .app-table,
            .att-table,
            .fin-table,
            .leader-table,
            .roster-table,
            table.data-table {
                width: 100% !important;
                min-width: 680px !important;
                border-collapse: separate !important;
                border-spacing: 0 !important;
                font-size: 13px !important;
                color: #0F172A !important;
            }

            .app-table th,
            .att-table th,
            .fin-table th,
            .leader-table th,
            .roster-table th,
            table.data-table th,
            .att-th,
            .fin-th {
                padding: 14px 18px !important;
                background-color: #F8FAFC !important;
                color: #475569 !important;
                font-weight: 700 !important;
                font-size: 11.5px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                text-align: left !important;
                border-bottom: 1.5px solid #E2E8F0 !important;
                white-space: nowrap !important;
            }

            .app-table td,
            .att-table td,
            .fin-table td,
            .leader-table td,
            .roster-table td,
            table.data-table td,
            .att-td,
            .fin-td {
                padding: 14px 18px !important;
                color: #1E293B !important;
                border-bottom: 1px solid #F1F5F9 !important;
                vertical-align: middle !important;
                line-height: 1.5 !important;
            }

            .app-table tbody tr:hover,
            .att-table tbody tr:hover,
            .fin-table tbody tr:hover,
            .leader-table tbody tr:hover,
            .roster-table tbody tr:hover,
            table.data-table tbody tr:hover {
                background-color: #F8FAFC !important;
                transition: background-color 0.15s ease !important;
            }

            .app-table tbody tr:last-child td,
            .att-table tbody tr:last-child td,
            .fin-table tbody tr:last-child td,
            .leader-table tbody tr:last-child td {
                border-bottom: none !important;
            }

            /* Table Column Guidelines */
            .col-id,
            td:first-child strong {
                min-width: 90px !important;
                white-space: nowrap !important;
            }

            .col-main,
            .col-subject,
            .col-name,
            td.cell-subject,
            td.cell-title {
                min-width: 220px !important;
                max-width: 380px !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                white-space: nowrap !important;
            }

            .col-badge,
            .col-priority,
            .col-status,
            td.cell-status,
            td.cell-priority {
                min-width: 110px !important;
                white-space: nowrap !important;
            }

            .col-date,
            td.cell-date {
                min-width: 120px !important;
                white-space: nowrap !important;
                color: #64748B !important;
            }

            /* --- GLOBAL SEARCH INPUT STYLING --- */
            .app-search-box,
            .search-input-wrapper {
                position: relative !important;
                width: 100% !important;
                max-width: 420px !important;
                display: inline-flex !important;
                align-items: center !important;
            }

            .app-search-box svg,
            .app-search-box i,
            .search-input-wrapper svg,
            .search-input-wrapper i {
                position: absolute !important;
                left: 14px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                color: #94A3B8 !important;
                width: 16px !important;
                height: 16px !important;
                pointer-events: none !important;
                z-index: 2 !important;
            }

            .app-search-input,
            .filter-search-input,
            .search-convo-input {
                width: 100% !important;
                padding: 10px 16px 10px 42px !important;
                border: 1.5px solid #E2E8F0 !important;
                border-radius: 10px !important;
                font-size: 13px !important;
                color: #0F172A !important;
                background-color: #FFFFFF !important;
                outline: none !important;
                transition: all 0.2s ease !important;
                box-shadow: none !important;
            }

            .app-search-input:focus,
            .filter-search-input:focus,
            .search-convo-input:focus {
                border-color: #3B82F6 !important;
                background-color: #FFFFFF !important;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
            }

            /* --- GLOBAL SELECT & DROPDOWN STYLING --- */
            select,
            .app-select,
            .settings-input select {
                appearance: none !important;
                -webkit-appearance: none !important;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
                background-repeat: no-repeat !important;
                background-position: right 14px center !important;
                background-size: 16px 16px !important;
                padding: 10px 38px 10px 14px !important;
                border: 1.5px solid #E2E8F0 !important;
                border-radius: 10px !important;
                font-size: 13px !important;
                color: #0F172A !important;
                background-color: #FFFFFF !important;
                outline: none !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                box-sizing: border-box !important;
            }

            select:focus,
            .app-select:focus {
                border-color: #3B82F6 !important;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
            }

            /* Custom Searchable Dropdown Popup Container */
            .searchable-select-menu {
                position: absolute !important;
                z-index: 1050 !important;
                background-color: #FFFFFF !important;
                border: 1px solid #E2E8F0 !important;
                border-radius: 12px !important;
                box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1) !important;
                width: 100% !important;
                min-width: 200px !important;
                max-width: 320px !important;
                overflow: hidden !important;
                margin-top: 4px !important;
            }

            .searchable-select-search-wrap {
                padding: 8px !important;
                border-bottom: 1px solid #F1F5F9 !important;
                position: relative !important;
            }

            .searchable-select-search-input {
                width: 100% !important;
                padding: 7px 12px 7px 32px !important;
                border: 1px solid #E2E8F0 !important;
                border-radius: 8px !important;
                font-size: 12px !important;
                outline: none !important;
                box-sizing: border-box !important;
            }

            .searchable-select-search-icon {
                position: absolute !important;
                left: 16px !important;
                top: 50% !important;
                transform: translateY(-50%) !important;
                font-size: 11px !important;
                color: #94A3B8 !important;
            }

            .searchable-select-options {
                max-height: 240px !important;
                overflow-y: auto !important;
                padding: 4px 0 !important;
            }

            .searchable-select-options::-webkit-scrollbar {
                width: 5px !important;
            }

            .searchable-select-options::-webkit-scrollbar-thumb {
                background-color: #CBD5E1 !important;
                border-radius: 4px !important;
            }

            .searchable-select-option {
                padding: 8px 14px !important;
                font-size: 13px !important;
                color: #334155 !important;
                cursor: pointer !important;
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                transition: background 0.15s !important;
            }

            .searchable-select-option:hover {
                background-color: #F1F5F9 !important;
                color: #0F172A !important;
            }

            .searchable-select-option.selected {
                background-color: #EFF6FF !important;
                color: #2563EB !important;
                font-weight: 600 !important;
            }

            .searchable-select-empty {
                padding: 14px !important;
                text-align: center !important;
                font-size: 12px !important;
                color: #94A3B8 !important;
            }

            /* --- CUSTOM FILE UPLOAD COMPONENT --- */
            .app-file-upload {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                padding: 8px 12px !important;
                border: 1.5px dashed #CBD5E1 !important;
                border-radius: 10px !important;
                background-color: #F8FAFC !important;
                cursor: pointer !important;
                transition: all 0.2s ease !important;
                box-sizing: border-box !important;
                width: 100% !important;
            }

            .app-file-upload:hover {
                border-color: #3B82F6 !important;
                background-color: #F0F6FF !important;
            }

            .app-file-upload-btn {
                padding: 5px 12px !important;
                background: #FFFFFF !important;
                border: 1px solid #CBD5E1 !important;
                border-radius: 6px !important;
                font-size: 12px !important;
                font-weight: 600 !important;
                color: #334155 !important;
                flex-shrink: 0 !important;
            }

            .app-file-upload-label {
                font-size: 12px !important;
                color: #64748B !important;
                white-space: nowrap !important;
                overflow: hidden !important;
                text-overflow: ellipsis !important;
                flex: 1 !important;
            }

            /* --- TOOLBAR & FILTER BAR SYSTEM --- */
            .app-filter-bar,
            .table-toolbar,
            .search-filter-row {
                display: flex !important;
                align-items: center !important;
                justify-content: space-between !important;
                gap: 12px !important;
                flex-wrap: wrap !important;
                margin-bottom: 16px !important;
            }

            .filter-bar-group {
                display: flex !important;
                align-items: center !important;
                gap: 10px !important;
                flex-wrap: wrap !important;
            }

            @media (max-width: 768px) {
                .app-filter-bar,
                .table-toolbar,
                .search-filter-row {
                    flex-direction: column !important;
                    align-items: stretch !important;
                }
                .filter-bar-group {
                    width: 100% !important;
                }
            }

            /* Global dynamic page input styling */
            .settings-input {
                width: 100% !important;
                max-width: 100% !important;
                padding: 10px 14px !important;
                border: 1.5px solid #E2E8F0 !important;
                border-radius: 10px !important;
                font-size: 13px !important;
                font-weight: 500 !important;
                color: #0F172A !important;
                background-color: #FFFFFF !important;
                box-sizing: border-box !important;
                outline: none !important;
                transition: all 0.2s !important;
            }
            .settings-input:focus {
                border-color: #3B82F6 !important;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
            }
        `;
        document.head.appendChild(overrideStyle);

        // Extract body nodes and remove legacy headers & sidebars
        const originalNodes = [];
        const originalScripts = [];
        
        // Remove old headers, navbars, sidebars
        const oldLayouts = document.querySelectorAll('header:not(.app-header), nav:not(.saas-sidebar-nav), aside.sidebar, aside.dashboard-sidebar, aside.app-sidebar-legacy, .navbar, .dashboard-header, .dashboard-sidebar, .sidebar');
        oldLayouts.forEach(el => el.remove());

        const bodyChildren = Array.from(document.body.children);
        bodyChildren.forEach(child => {
            if (child.tagName === 'SCRIPT') {
                originalScripts.push(child);
            } else {
                originalNodes.push(child);
            }
        });

        // App Shell
        const appShell = document.createElement('div');
        appShell.className = 'app-shell';

        // Sidebar
        const sidebar = document.createElement('aside');
        sidebar.className = 'app-sidebar';
        
        const sidebarLogoText = role === 'mentor' ? 'Amplimentor Pro' : 'Amplimentor Learner';
        const brandRedirect = role === 'mentor' ? '/mentor-dashboard.html' : '/student-dashboard.html';

        let sidebarLinks = '';
        if (role === 'mentor') {
            sidebarLinks = `
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Dashboard</span>
                    <a href="/mentor-dashboard.html" class="saas-sidebar-link ${pathName.includes('mentor-dashboard') ? 'active' : ''}">
                        <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
                    </a>
                </div>
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Teaching</span>
                    <a href="/my-students.html" class="saas-sidebar-link ${pathName.includes('my-students') ? 'active' : ''}">
                        <i data-lucide="users"></i> <span>My Students</span>
                    </a>
                    <a href="/sessions.html" class="saas-sidebar-link ${pathName.includes('sessions') ? 'active' : ''}">
                        <i data-lucide="calendar"></i> <span>Sessions</span>
                    </a>
                </div>
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Learning Tools</span>
                    <a href="/assignments" class="saas-sidebar-link ${pathName.includes('assignments') ? 'active' : ''}">
                        <i data-lucide="file-text"></i> <span>Assignments</span>
                    </a>
                    <a href="/quiz" class="saas-sidebar-link ${pathName.includes('quiz') ? 'active' : ''}">
                        <i data-lucide="help-circle"></i> <span>Quizzes</span>
                    </a>
                    <a href="/study-resources" class="saas-sidebar-link ${pathName.includes('study-resources') ? 'active' : ''}">
                        <i data-lucide="folder-open"></i> <span>Resources</span>
                    </a>
                    <a href="/attendance.html" class="saas-sidebar-link ${pathName.includes('attendance') ? 'active' : ''}">
                        <i data-lucide="clipboard-list"></i> <span>Attendance</span>
                    </a>
                    <a href="/session-notes.html" class="saas-sidebar-link ${pathName.includes('session-notes') ? 'active' : ''}">
                        <i data-lucide="edit-3"></i> <span>Session Notes</span>
                    </a>
                    <a href="/recordings.html" class="saas-sidebar-link ${pathName.includes('recordings') ? 'active' : ''}">
                        <i data-lucide="video"></i> <span>Recordings</span>
                    </a>
                </div>
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Business</span>
                    <a href="/finance.html" class="saas-sidebar-link ${pathName.includes('finance') ? 'active' : ''}">
                        <i data-lucide="wallet"></i> <span>Finance</span>
                    </a>
                    <a href="/reviews.html" class="saas-sidebar-link ${pathName.includes('reviews') ? 'active' : ''}">
                        <i data-lucide="star"></i> <span>Reviews</span>
                    </a>
                    <a href="/support.html" class="saas-sidebar-link ${pathName.includes('support') ? 'active' : ''}">
                        <i data-lucide="help-circle"></i> <span>Support Center</span>
                    </a>
                </div>
            `;
        } else {
            sidebarLinks = `
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Dashboard</span>
                    <a href="/student-dashboard.html" class="saas-sidebar-link ${pathName.includes('student-dashboard') ? 'active' : ''}">
                        <i data-lucide="layout-dashboard"></i> <span>Dashboard</span>
                    </a>
                </div>
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Learning</span>
                    <a href="/my-mentors.html" class="saas-sidebar-link ${pathName.includes('my-mentors') ? 'active' : ''}">
                        <i data-lucide="users"></i> <span>My Mentors</span>
                    </a>
                    <a href="/mentors.html" class="saas-sidebar-link ${pathName.includes('mentors.html') ? 'active' : ''}">
                        <i data-lucide="search"></i> <span>Find Mentors</span>
                    </a>
                    <a href="/sessions.html" class="saas-sidebar-link ${pathName.includes('sessions') ? 'active' : ''}">
                        <i data-lucide="video"></i> <span>Sessions</span>
                    </a>
                </div>
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Learning Tools</span>
                    <a href="/assignments" class="saas-sidebar-link ${pathName.includes('assignments') ? 'active' : ''}">
                        <i data-lucide="file-text"></i> <span>Assignments</span>
                    </a>
                    <a href="/quiz" class="saas-sidebar-link ${pathName.includes('quiz') ? 'active' : ''}">
                        <i data-lucide="help-circle"></i> <span>Quizzes</span>
                    </a>
                    <a href="/study-resources" class="saas-sidebar-link ${pathName.includes('study-resources') ? 'active' : ''}">
                        <i data-lucide="folder-open"></i> <span>Resources</span>
                    </a>
                    <a href="/attendance.html" class="saas-sidebar-link ${pathName.includes('attendance') ? 'active' : ''}">
                        <i data-lucide="clipboard-list"></i> <span>Attendance</span>
                    </a>
                    <a href="/session-notes.html" class="saas-sidebar-link ${pathName.includes('session-notes') ? 'active' : ''}">
                        <i data-lucide="edit-3"></i> <span>Session Notes</span>
                    </a>
                    <a href="/recordings.html" class="saas-sidebar-link ${pathName.includes('recordings') ? 'active' : ''}">
                        <i data-lucide="video"></i> <span>Recordings</span>
                    </a>
                    <a href="/learning-goals" class="saas-sidebar-link ${pathName.includes('learning-goals') ? 'active' : ''}">
                        <i data-lucide="bullseye"></i> <span>Learning Goals</span>
                    </a>
                    <a href="/learning-progress" class="saas-sidebar-link ${pathName.includes('learning-progress') ? 'active' : ''}">
                        <i data-lucide="line-chart"></i> <span>Progress</span>
                    </a>
                </div>
                <div class="saas-sidebar-group">
                    <span class="saas-sidebar-group-title">Finance & Help</span>
                    <a href="/finance.html" class="saas-sidebar-link ${pathName.includes('finance') ? 'active' : ''}">
                        <i data-lucide="credit-card"></i> <span>Finance & Billing</span>
                    </a>
                    <a href="/support.html" class="saas-sidebar-link ${pathName.includes('support') ? 'active' : ''}">
                        <i data-lucide="help-circle"></i> <span>Support Center</span>
                    </a>
                </div>
            `;
        }

        sidebar.innerHTML = `
            <a href="${brandRedirect}" class="saas-sidebar-logo">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22H6L8.5 16.5H15.5L18 22H22L12 2Z" fill="url(#sidebarLogoGrad14)"/>
                    <path d="M9.5 14H14.5L12 8.5L9.5 14Z" fill="#fff"/>
                    <defs>
                        <linearGradient id="sidebarLogoGrad14" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                            <stop stop-color="#3B82F6"/>
                            <stop offset="1" stop-color="#4F46E5"/>
                        </linearGradient>
                    </defs>
                </svg>
                <span>${sidebarLogoText}</span>
            </a>
            <nav class="saas-sidebar-nav">
                ${sidebarLinks}
            </nav>
            <div class="saas-sidebar-footer">
                <a href="#" class="saas-sidebar-link saas-logout-btn" onclick="event.preventDefault(); window.openLogoutConfirm()" style="color: #EF4444 !important;">
                    <i data-lucide="log-out"></i> <span>Logout</span>
                </a>
            </div>
        `;

        // Content Area Frame
        const main = document.createElement('main');
        main.className = 'app-content';

        const searchPlaceholder = role === 'mentor' ? 'Search students, sessions...' : 'Search mentors, sessions...';
        const chatRedirect = role === 'mentor' ? '/mentor-messages' : '/student-messages';

        // Header
        const header = document.createElement('header');
        header.className = 'app-header';
        header.innerHTML = `
            <div class="header-left">
                <button class="mobile-menu-toggle" onclick="window.toggleSidebarDrawer()"><i data-lucide="menu"></i></button>
                <div class="header-search-container">
                    <i data-lucide="search" class="search-icon"></i>
                    <input type="text" placeholder="${searchPlaceholder}" class="header-search-input" id="globalSearchInput" onkeydown="if(event.key==='Enter') window.toast.info('Search Query', 'Searching for: ' + this.value)">
                </div>
            </div>
            
            <div class="header-right">
                <button class="header-action-btn mobile-search-btn" style="display:none;" onclick="alert('Opening search panel...')"><i data-lucide="search"></i></button>
                <button class="header-action-btn" onclick="window.location.href='${chatRedirect}'" title="Chat Messages">
                    <i data-lucide="message-square"></i>
                </button>
                <button class="header-action-btn" onclick="window.toggleNotificationsDropdown(event)" title="Notifications">
                    <i data-lucide="bell"></i>
                    <span class="notification-badge-count">3</span>
                </button>
                
                <div class="saas-profile-dropdown" onclick="window.toggleSaasDropdown(event)">
                    <img src="${userPhoto}" alt="Avatar" class="avatar-img">
                    <span class="user-fullname">${userName}</span>
                    <i data-lucide="chevron-down" class="dropdown-arrow"></i>
                    
                    <div class="saas-dropdown-menu" id="saasDropdownMenu">
                        <a href="${role==='mentor'?'/mentor/profile':'/student/profile'}">
                            <i data-lucide="user"></i> Profile
                        </a>
                        <a href="${role==='mentor'?'/mentor/settings':'/student/settings'}">
                            <i data-lucide="settings"></i> Account Settings
                        </a>
                        <a href="/notifications">
                            <i data-lucide="bell"></i> Notifications
                        </a>
                        <a href="#" onclick="event.preventDefault(); window.switchDemoRole()">
                            <i data-lucide="refresh-cw"></i> Switch Role (Demo)
                        </a>
                        <hr style="border:0; border-top:1px solid #E5E7EB; margin:4px 0;">
                        <a href="#" onclick="event.preventDefault(); window.openLogoutConfirm()" style="color: #EF4444;">
                            <i data-lucide="log-out"></i> Logout
                        </a>
                    </div>
                </div>

                <!-- Notifications Dropdown Menu -->
                <div class="notifications-dropdown-menu" id="notificationsDropdownMenu">
                    <div class="dropdown-header">
                        <span>Notifications</span>
                        <button class="mark-all-read-btn" onclick="window.markAllNotificationsRead(event)">Mark all as read</button>
                    </div>
                    <div class="notifications-list-container">
                        <div class="notification-item unread">
                            <div class="notification-icon-wrap" style="background:#EFF6FF; color:#3B82F6;"><i data-lucide="calendar"></i></div>
                            <div class="notification-info">
                                <strong>New booking from Rahul</strong>
                                <p>Botany crosses NEET boards revision session.</p>
                                <span class="notification-time">10 mins ago</span>
                            </div>
                            <span class="unread-dot"></span>
                        </div>
                        <div class="notification-item unread">
                            <div class="notification-icon-wrap" style="background:#D1FAE5; color:#10B981;"><i data-lucide="file-text"></i></div>
                            <div class="notification-info">
                                <strong>Homework submitted</strong>
                                <p>Rahul Verma submitted NEET Botany genetics assignment.</p>
                                <span class="notification-time">1 hour ago</span>
                            </div>
                            <span class="unread-dot"></span>
                        </div>
                        <div class="notification-item unread">
                            <div class="notification-icon-wrap" style="background:#FEF3C7; color:#D97706;"><i data-lucide="graduation-cap"></i></div>
                            <div class="notification-info">
                                <strong>Assignment graded</strong>
                                <p>You received score 92/100 on Physics kinetics homework.</p>
                                <span class="notification-time">3 hours ago</span>
                            </div>
                            <span class="unread-dot"></span>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon-wrap" style="background:#EDE9FE; color:#8B5CF6;"><i data-lucide="clock"></i></div>
                            <div class="notification-info">
                                <strong>Session starts in 30 minutes</strong>
                                <p>Genetics session slot booking starts shortly.</p>
                                <span class="notification-time">4 hours ago</span>
                            </div>
                        </div>
                        <div class="notification-item">
                            <div class="notification-icon-wrap" style="background:#EFF6FF; color:#3B82F6;"><i data-lucide="wallet"></i></div>
                            <div class="notification-info">
                                <strong>Payment received</strong>
                                <p>Payout ₹359 successfully settled to wallet balance.</p>
                                <span class="notification-time">1 day ago</span>
                            </div>
                        </div>
                    </div>
                    <a href="/notifications" class="view-all-notifications-link">View all notifications</a>
                </div>
            </div>
        `;

        // Content Wrapper
        const pageContainer = document.createElement('div');
        pageContainer.className = 'page-container';

        const meta = getPageMeta(pathName, document.title);
        const parent = getParentRedirect(role);
        const isDashboard = pathName.includes('dashboard.html');

        // Check if there is an existing greetingMsg element in the page content
        const origGreetingMsg = document.getElementById('greetingMsg');
        const origGreetingSub = document.querySelector('.greeting-subtitle') || document.getElementById('greetingSubText');
        
        let displayTitle = meta.title;
        let displaySubtitle = meta.subtitle;
        
        if (origGreetingMsg && origGreetingMsg.textContent.trim()) {
            displayTitle = origGreetingMsg.textContent.trim();
        }
        if (origGreetingSub && origGreetingSub.textContent.trim()) {
            displaySubtitle = origGreetingSub.textContent.trim();
        }

        // De-duplicate greeting elements in the legacy DOM so only one set of IDs exists
        if (origGreetingMsg) {
            origGreetingMsg.removeAttribute('id');
        }
        if (origGreetingSub) {
            origGreetingSub.removeAttribute('id');
            origGreetingSub.className = '';
        }

        // Check for any action buttons inside the greeting-section to place in header actions
        const greetingSection = document.querySelector('.greeting-section');
        let headerActionsHTML = '';
        if (greetingSection) {
            const btn = greetingSection.querySelector('button, .btn, .btn-primary, .btn-secondary, a.btn');
            if (btn) {
                headerActionsHTML = btn.outerHTML;
            }
        }

        // Dynamic page title area
        const pageHeaderDiv = document.createElement('div');
        pageHeaderDiv.className = 'page-header';
        pageHeaderDiv.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; gap: 16px; flex-wrap: wrap;">
                <div class="page-header-left" style="display: flex; flex-direction: column; gap: 4px;">
                    <div class="saas-page-title-row" style="margin: 0 !important;">
                        ${isDashboard ? '' : `<a href="${parent.path}" class="back-navigation-btn" title="Back to ${parent.label}"><i data-lucide="chevron-left"></i></a>`}
                        <h1 id="greetingMsg" style="margin: 0 !important;">${displayTitle}</h1>
                    </div>
                    <p id="greetingSubText" class="greeting-subtitle" style="margin: 0 !important;">${displaySubtitle}</p>
                </div>
                ${headerActionsHTML ? `<div class="page-header-actions" style="display: flex; align-items: center; flex-shrink: 0;">${headerActionsHTML}</div>` : ''}
            </div>
        `;
        pageContainer.appendChild(pageHeaderDiv);

        // Content Div for Page Specific Elements
        const pageContent = document.createElement('div');
        pageContent.style.display = 'flex';
        pageContent.style.flexDirection = 'column';
        pageContent.style.gap = '24px';

        originalNodes.forEach(node => {
            pageContent.appendChild(node);
        });

        // Strip legacy titles from the injected elements to prevent duplicate titles
        const duplicateSelectors = [
            'h1.page-title', 'h2.page-title', 'h1.section-title', 'h2.section-title',
            '.page-header', '.section-header', '.finance-header', '.support-header',
            '.crm-header', '.welcome-hero-left h1', '.workspace-header', '.page-heading'
        ];
        duplicateSelectors.forEach(sel => {
            const elements = pageContent.querySelectorAll(sel);
            elements.forEach(el => el.remove());
        });

        pageContainer.appendChild(pageContent);

        main.appendChild(header);
        main.appendChild(pageContainer);

        appShell.appendChild(sidebar);
        appShell.appendChild(main);

        document.body.innerHTML = '';
        document.body.appendChild(appShell);

        // Dynamic Confirmation Modal Dialog
        const logoutModal = document.createElement('div');
        logoutModal.id = 'logoutConfirmOverlay';
        logoutModal.style.position = 'fixed';
        logoutModal.style.top = '0';
        logoutModal.style.left = '0';
        logoutModal.style.width = '100vw';
        logoutModal.style.height = '100vh';
        logoutModal.style.background = 'rgba(15,23,42,0.5)';
        logoutModal.style.zIndex = '100000';
        logoutModal.style.display = 'none';
        logoutModal.style.alignItems = 'center';
        logoutModal.style.justifyContent = 'center';
        logoutModal.style.padding = '24px';
        logoutModal.style.boxSizing = 'border-box';
        logoutModal.innerHTML = `
            <div class="dialog-content" style="background:#FFFFFF; border-radius:16px; padding:24px; max-width:380px; width:100%; box-shadow:0 10px 25px rgba(0,0,0,0.1); text-align:center;">
                <h3 style="margin:0 0 10px 0; font-size:18px; font-weight:800; color:#0F172A;">Logout?</h3>
                <p style="color:#64748B; font-size:13.5px; margin:0 0 20px 0;">Are you sure you want to sign out of your Amplimentor account?</p>
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button class="btn-fin-cta" style="background:#EF4444; border:none; padding:8px 16px; border-radius:8px; color:white; font-weight:700; cursor:pointer;" onclick="window.confirmLogoutSubmit()">Logout</button>
                    <button class="btn-export" style="background:#F1F5F9; border:1px solid #CBD5E1; padding:8px 16px; border-radius:8px; cursor:pointer;" onclick="window.closeLogoutConfirm()">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(logoutModal);

        // Re-inject scripts (excluding the navigation-loader itself to prevent double execution)
        originalScripts.forEach(script => {
            if (script.src && script.src.includes('navigation-loader.js')) {
                return;
            }
            const newScript = document.createElement('script');
            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }
            document.body.appendChild(newScript);
        });

        if (typeof lucide === 'undefined') {
            const lucideScript = document.createElement('script');
            lucideScript.src = 'https://unpkg.com/lucide@latest';
            lucideScript.onload = () => {
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            };
            document.head.appendChild(lucideScript);
        } else {
            lucide.createIcons();
            setTimeout(() => {
                lucide.createIcons();
            }, 100);
        }
    });

    window.toggleSaasDropdown = (e) => {
        e.stopPropagation();
        
        // Close notifications if open
        const notif = document.getElementById('notificationsDropdownMenu');
        if (notif) notif.style.display = 'none';

        const menu = document.getElementById('saasDropdownMenu');
        if (menu) {
            const active = menu.style.display === 'block';
            menu.style.display = active ? 'none' : 'block';
        }
    };

    window.toggleNotificationsDropdown = (e) => {
        e.stopPropagation();

        // Close avatar menu if open
        const saasMenu = document.getElementById('saasDropdownMenu');
        if (saasMenu) saasMenu.style.display = 'none';

        const menu = document.getElementById('notificationsDropdownMenu');
        if (menu) {
            const active = menu.style.display === 'block';
            menu.style.display = active ? 'none' : 'block';
        }
    };

    document.addEventListener('click', () => {
        const notifMenu = document.getElementById('notificationsDropdownMenu');
        if (notifMenu) notifMenu.style.display = 'none';
        const saasMenu = document.getElementById('saasDropdownMenu');
        if (saasMenu) saasMenu.style.display = 'none';
    });

    window.markAllNotificationsRead = (e) => {
        e.stopPropagation();
        const dots = document.querySelectorAll('.unread-dot');
        dots.forEach(dot => dot.remove());
        const items = document.querySelectorAll('.notification-item.unread');
        items.forEach(item => item.classList.remove('unread'));
        const badge = document.querySelector('.notification-badge-count');
        if (badge) badge.remove();
        if (window.toast) {
            window.toast.success("Inbox Read", "All notifications marked as read.");
        }
    };

    window.openLogoutConfirm = () => {
        const overlay = document.getElementById('logoutConfirmOverlay');
        if (overlay) overlay.style.display = 'flex';
    };
    window.closeLogoutConfirm = () => {
        const overlay = document.getElementById('logoutConfirmOverlay');
        if (overlay) overlay.style.display = 'none';
    };
    window.confirmLogoutSubmit = () => {
        fetch('/logout', { method: 'POST' })
            .then(() => {
                localStorage.removeItem('simulatedRole');
                window.location.replace('/login.html');
            })
            .catch(() => {
                localStorage.removeItem('simulatedRole');
                window.location.replace('/login.html');
            });
    };

    window.switchDemoRole = () => {
        const current = localStorage.getItem('simulatedRole') || 'student';
        const next = current === 'mentor' ? 'student' : 'mentor';
        localStorage.setItem('simulatedRole', next);
        
        // Redirect to corresponding dashboard dynamically
        if (next === 'mentor') {
            window.location.href = '/mentor-dashboard.html';
        } else {
            window.location.href = '/student-dashboard.html';
        }
    };

    window.toggleSidebarDrawer = () => {
        const sidebar = document.querySelector('.app-sidebar');
        if (sidebar) {
            sidebar.classList.toggle('drawer-open');
        }
    };

    // Scroll listener for sticky header shadow trigger
    window.addEventListener('scroll', () => {
        const headerEl = document.querySelector('.app-header');
        if (headerEl) {
            if (window.scrollY > 4) {
                headerEl.classList.add('scrolled');
            } else {
                headerEl.classList.remove('scrolled');
            }
        }
    });
})();
