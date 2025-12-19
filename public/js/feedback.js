// Feedback functionality
function initFeedback() {
    const feedbackBtn = document.getElementById('feedbackBtn');
    const feedbackModal = document.getElementById('feedbackModal');
    const closeFeedbackModal = document.getElementById('closeFeedbackModal');
    const feedbackForm = document.getElementById('feedbackForm');

    // Open feedback modal
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', () => {
            feedbackModal.style.display = 'flex';
            
            // Pre-fill user info if logged in
            const userStr = localStorage.getItem('user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    document.getElementById('feedbackName').value = user.ten || '';
                    document.getElementById('feedbackEmail').value = user.email || '';
                } catch (e) {
                    console.error('Error parsing user data:', e);
                }
            }
        });
    }

    // Close modal
    if (closeFeedbackModal) {
        closeFeedbackModal.addEventListener('click', () => {
            feedbackModal.style.display = 'none';
            feedbackForm.reset();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            feedbackModal.style.display = 'none';
            feedbackForm.reset();
        }
    });

    // Submit feedback
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = feedbackForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Đang gửi...';

            const formData = {
                ten_nguoi_gui: document.getElementById('feedbackName').value.trim(),
                email: document.getElementById('feedbackEmail').value.trim(),
                tieu_de: document.getElementById('feedbackSubject').value.trim(),
                noi_dung: document.getElementById('feedbackMessage').value.trim()
            };

            try {
                const token = localStorage.getItem('token');
                const headers = {
                    'Content-Type': 'application/json'
                };
                
                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (data.success) {
                    // Success notification using system notification
                    showNotification('Cảm ơn bạn đã gửi phản hồi! Chúng tôi sẽ trả lời bạn qua email sớm nhất.', 'success');
                    
                    // Close modal and reset form
                    feedbackModal.style.display = 'none';
                    feedbackForm.reset();
                } else {
                    showNotification(data.message || 'Không thể gửi phản hồi', 'error');
                }
            } catch (error) {
                console.error('Error submitting feedback:', error);
                showNotification('Lỗi khi gửi phản hồi. Vui lòng thử lại sau.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }
}

// Note: Using global showNotification() from notifications.js
// No need to redefine it here

// Function to open feedback modal (can be called from anywhere)
function openFeedbackModal() {
    const feedbackModal = document.getElementById('feedbackModal');
    
    if (!feedbackModal) {
        console.error('✗ Feedback modal not found in DOM!');
        alert('Không tìm thấy form phản hồi. Vui lòng tải lại trang.');
        return;
    }
    
    feedbackModal.style.display = 'flex';
    
    // Pre-fill user info if logged in
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const nameField = document.getElementById('feedbackName');
            const emailField = document.getElementById('feedbackEmail');
            if (nameField) nameField.value = user.ten || '';
            if (emailField) emailField.value = user.email || '';
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Close sidebar if open
    const sidebar = document.getElementById('sidebar-menu');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    
    console.log('✓ Feedback modal opened');
}

// Initialize when DOM is loaded - but DON'T auto-init anymore since index.html will do it
// Just make the function available
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initFeedback);
// } else {
//     initFeedback();
// }
