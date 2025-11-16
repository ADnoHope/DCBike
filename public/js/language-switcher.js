// Language Switcher Component - Thêm selector ngôn ngữ vào tất cả các trang

(function() {
    'use strict';
    
    // Tạo HTML cho language switcher
    const createLanguageSwitcher = () => {
        const currentLang = localStorage.getItem('dc_booking_language') || 'vi';
        
        return `
            <div class="language-switcher" style="position: fixed; bottom: 20px; right: 20px; z-index: 9999;">
                <div class="dropdown">
                    <button class="btn btn-light btn-sm dropdown-toggle" type="button" id="languageDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-globe me-1"></i>
                        <span id="current-lang-text">${currentLang === 'vi' ? 'Tiếng Việt' : 'English'}</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="languageDropdown">
                        <li>
                            <a class="dropdown-item ${currentLang === 'vi' ? 'active' : ''}" href="#" onclick="switchLanguage('vi'); return false;">
                                <i class="fas fa-check me-2 ${currentLang === 'vi' ? '' : 'invisible'}"></i>
                                Tiếng Việt
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item ${currentLang === 'en' ? 'active' : ''}" href="#" onclick="switchLanguage('en'); return false;">
                                <i class="fas fa-check me-2 ${currentLang === 'en' ? '' : 'invisible'}"></i>
                                English
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        `;
    };
    
    // Hàm chuyển đổi ngôn ngữ
    window.switchLanguage = function(lang) {
        if (window.i18n) {
            i18n.changeLanguage(lang);
            
            // Cập nhật hiển thị
            const currentLangText = document.getElementById('current-lang-text');
            if (currentLangText) {
                currentLangText.textContent = lang === 'vi' ? 'Tiếng Việt' : 'English';
            }
            
            // Cập nhật active state
            document.querySelectorAll('.language-switcher .dropdown-item').forEach(item => {
                const isActive = item.textContent.includes(lang === 'vi' ? 'Tiếng Việt' : 'English');
                item.classList.toggle('active', isActive);
                const icon = item.querySelector('i.fa-check');
                if (icon) {
                    icon.classList.toggle('invisible', !isActive);
                }
            });
        }
    };
    
    // Thêm language switcher vào trang
    document.addEventListener('DOMContentLoaded', function() {
        // Kiểm tra xem đã có language switcher chưa
        if (document.querySelector('.language-switcher')) {
            return;
        }
        
        // Chỉ thêm nếu không phải trang có settings riêng (như profile)
        const hasLanguageSettings = document.getElementById('language-setting');
        if (hasLanguageSettings) {
            return; // Profile page đã có language selector riêng
        }
        
        // Thêm vào body
        const switcherHTML = createLanguageSwitcher();
        document.body.insertAdjacentHTML('beforeend', switcherHTML);
    });
    
    // Style cho language switcher
    const style = document.createElement('style');
    style.textContent = `
        .language-switcher .btn {
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            border: 1px solid #dee2e6;
            background: white;
        }
        
        .language-switcher .btn:hover {
            background: #f8f9fa;
        }
        
        .language-switcher .dropdown-menu {
            min-width: 150px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .language-switcher .dropdown-item.active {
            background-color: #e7f3ff;
            color: #0066cc;
        }
        
        .language-switcher .dropdown-item:hover {
            background-color: #f0f0f0;
        }
        
        @media (max-width: 768px) {
            .language-switcher {
                bottom: 10px;
                right: 10px;
            }
            
            .language-switcher .btn {
                padding: 0.25rem 0.5rem;
                font-size: 0.875rem;
            }
        }
    `;
    document.head.appendChild(style);
})();
