// Promotions Management
class PromotionService {
    constructor() {
        this.appliedPromotion = null;
        this.init();
    }

    init() {
        this.loadPromotions();
    }

    // Load all promotions
    async loadPromotions() {
        try {
            const response = await fetch('/api/promotions');
            const result = await response.json();

            if (result.success) {
                this.displayPromotions(result.data.promotions);
            } else {
                console.error('Failed to load promotions:', result.message);
            }
        } catch (error) {
            console.error('Load promotions error:', error);
        }
    }

    // Display promotions
    displayPromotions(promotions) {
        const promotionsContainer = document.getElementById('promotions-list');
        if (!promotionsContainer) return;

        let html = '';

        if (promotions.length === 0) {
            html = '<div class="col-12 text-center"><p>Hiện tại không có khuyến mãi nào.</p></div>';
        } else {
            promotions.forEach(promotion => {
                html += `
                    <div class="col-md-6 col-lg-4 mb-4">
                        <div class="card h-100 ${promotion.trang_thai !== 'kich_hoat' ? 'opacity-75' : ''}">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <h6 class="card-title">${promotion.ten_khuyen_mai}</h6>
                                    <span class="badge ${this.getStatusBadgeClass(promotion.trang_thai)}">
                                        ${this.getStatusText(promotion.trang_thai)}
                                    </span>
                                </div>
                                
                                <div class="mb-3">
                                    <div class="promotion-code">
                                        <strong>Mã: ${promotion.ma_khuyen_mai}</strong>
                                        <button class="btn btn-sm btn-outline-primary ms-2" 
                                                onclick="copyPromotionCode('${promotion.ma_khuyen_mai}')">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>

                                ${promotion.mo_ta ? `<p class="card-text">${promotion.mo_ta}</p>` : ''}

                                <div class="promotion-details">
                                    <div class="row g-2 text-sm">
                                        <div class="col-6">
                                            <strong>Giảm giá:</strong><br>
                                            ${this.formatDiscount(promotion)}
                                        </div>
                                        <div class="col-6">
                                            <strong>Đơn tối thiểu:</strong><br>
                                            ${this.formatPrice(promotion.gia_tri_toi_thieu)} VND
                                        </div>
                                        ${promotion.gia_tri_toi_da ? `
                                            <div class="col-6">
                                                <strong>Giảm tối đa:</strong><br>
                                                ${this.formatPrice(promotion.gia_tri_toi_da)} VND
                                            </div>
                                        ` : ''}
                                        <div class="col-6">
                                            <strong>Còn lại:</strong><br>
                                            ${promotion.so_luong_con_lai}/${promotion.so_luong_toi_da}
                                        </div>
                                    </div>
                                </div>

                                <div class="mt-3">
                                    <small class="text-muted">
                                        <i class="fas fa-calendar me-1"></i>
                                        ${this.formatDateRange(promotion.ngay_bat_dau, promotion.ngay_ket_thuc)}
                                    </small>
                                </div>

                                ${promotion.trang_thai === 'kich_hoat' && promotion.so_luong_con_lai > 0 ? `
                                    <div class="mt-3">
                                        <button class="btn btn-primary btn-sm w-100" 
                                                onclick="usePromotionCode('${promotion.ma_khuyen_mai}')">
                                            Sử dụng mã này
                                        </button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
            });
        }

        promotionsContainer.innerHTML = html;
    }

    // Get status badge class
    getStatusBadgeClass(status) {
        const classes = {
            'kich_hoat': 'bg-success',
            'tam_dung': 'bg-warning',
            'het_han': 'bg-secondary',
            'het_luot': 'bg-danger'
        };
        return classes[status] || 'bg-secondary';
    }

    // Get status text
    getStatusText(status) {
        const texts = {
            'kich_hoat': 'Có hiệu lực',
            'tam_dung': 'Tạm dừng',
            'het_han': 'Hết hạn',
            'het_luot': 'Hết lượt'
        };
        return texts[status] || status;
    }

    // Format discount value
    formatDiscount(promotion) {
        if (promotion.loai_khuyen_mai === 'phan_tram') {
            return `${promotion.gia_tri_khuyen_mai}%`;
        } else {
            return `${this.formatPrice(promotion.gia_tri_khuyen_mai)} VND`;
        }
    }

    // Format price
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN').format(price);
    }

    // Format date range
    formatDateRange(startDate, endDate) {
        const start = new Date(startDate).toLocaleDateString('vi-VN');
        const end = new Date(endDate).toLocaleDateString('vi-VN');
        return `${start} - ${end}`;
    }

    // Apply promotion code
    async applyPromotionCode(promotionCode, orderTotal) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/promotions/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ma_khuyen_mai: promotionCode,
                    gia_tri_don_hang: orderTotal
                })
            });

            const result = await response.json();

            if (result.success) {
                this.appliedPromotion = result.data;
                this.displayPromotionResult(result.data);
                return result.data;
            } else {
                this.displayPromotionError(result.message);
                return null;
            }
        } catch (error) {
            console.error('Apply promotion error:', error);
            this.displayPromotionError('Lỗi khi áp dụng mã khuyến mãi');
            return null;
        }
    }

    // Display promotion result
    displayPromotionResult(promotionData) {
        const resultContainer = document.getElementById('promotion-result');
        if (!resultContainer) return;

        resultContainer.innerHTML = `
            <div class="alert alert-success alert-sm">
                <i class="fas fa-check-circle me-2"></i>
                <strong>Áp dụng thành công!</strong><br>
                Giảm giá: ${this.formatPrice(promotionData.gia_tri_giam)} VND
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="promotionService.removePromotion()">
                    Hủy
                </button>
            </div>
        `;
    }

    // Display promotion error
    displayPromotionError(message) {
        const resultContainer = document.getElementById('promotion-result');
        if (!resultContainer) return;

        resultContainer.innerHTML = `
            <div class="alert alert-danger alert-sm">
                <i class="fas fa-exclamation-circle me-2"></i>
                ${message}
            </div>
        `;
    }

    // Remove applied promotion
    removePromotion() {
        this.appliedPromotion = null;
        const resultContainer = document.getElementById('promotion-result');
        if (resultContainer) {
            resultContainer.innerHTML = '';
        }
        
        // Clear promotion code input
        const promotionInput = document.getElementById('promotion-code');
        if (promotionInput) {
            promotionInput.value = '';
        }
    }

    // Get applied promotion
    getAppliedPromotion() {
        return this.appliedPromotion;
    }
}

// Copy promotion code to clipboard
function copyPromotionCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showAlert('success', `Đã sao chép mã: ${code}`);
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showAlert('success', `Đã sao chép mã: ${code}`);
    });
}

// Use promotion code
function usePromotionCode(code) {
    const promotionInput = document.getElementById('promotion-code');
    if (promotionInput) {
        promotionInput.value = code;
        applyPromotion();
    }
}

// Apply promotion (called from booking form)
async function applyPromotion() {
    const promotionInput = document.getElementById('promotion-code');
    const promotionCode = promotionInput.value.trim();

    if (!promotionCode) {
        showAlert('warning', 'Vui lòng nhập mã khuyến mãi');
        return;
    }

    // For demo, use a sample order total
    // In real implementation, calculate based on trip cost
    const orderTotal = 100000; // Sample total

    const result = await promotionService.applyPromotionCode(promotionCode, orderTotal);
    
    if (result) {
        showAlert('success', `Áp dụng mã khuyến mãi thành công! Giảm ${promotionService.formatPrice(result.gia_tri_giam)} VND`);
    }
}

// Initialize promotion service
const promotionService = new PromotionService();