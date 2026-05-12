// --- DARK MODE TOGGLE ---
window.toggleDarkMode = function() {
    const html = document.documentElement;
    const isDarkMode = html.getAttribute('data-theme') === 'dark';
    
    if (isDarkMode) {
        html.setAttribute('data-theme', 'light');
        document.getElementById('dark-mode-toggle').textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        document.getElementById('dark-mode-toggle').textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
};

// --- HIDE LOADING OVERLAY ---
function hideLoadingOverlay() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
    }
}

// Show loading overlay on page start
document.addEventListener('DOMContentLoaded', () => {
    // Simulasi loading time minimal (2 detik) untuk efek yang lebih terlihat
    const minLoadTime = 2000;
    const startTime = Date.now();
    
    // Hitung waktu tersisa yang diperlukan
    function checkLoadComplete() {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime >= minLoadTime) {
            hideLoadingOverlay();
        } else {
            setTimeout(checkLoadComplete, 100);
        }
    }
    
    // Jika semua gambar sudah dimuat, lansung sembunyikan loading
    let imagesLoaded = 0;
    let totalImages = document.querySelectorAll('img').length;
    
    if (totalImages === 0) {
        checkLoadComplete();
    } else {
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', () => {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    checkLoadComplete();
                }
            });
            img.addEventListener('error', () => {
                imagesLoaded++;
                if (imagesLoaded === totalImages) {
                    checkLoadComplete();
                }
            });
        });
    }
    
    // Fallback: sembunyikan loading setelah 5 detik jika ada masalah
    setTimeout(() => {
        hideLoadingOverlay();
    }, 5000);
});

// --- VOICE SEARCH SUPPORT CHECK ---
window.isVoiceSearchSupported = function() {
    return window.isSecureContext && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
};

// --- VOICE SEARCH FUNCTION ---
window.startVoiceSearch = function() {
    const voiceBtn = document.getElementById('voice-search-btn');
    const inputCari = document.getElementById('input-cari');

    if (!window.isVoiceSearchSupported()) {
        alert('Pencarian suara hanya bekerja pada situs yang dijalankan melalui HTTPS atau localhost, dan browser yang mendukung Web Speech API.');
        return;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Configure recognition
    recognition.lang = 'id-ID'; // Indonesian language
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    // Visual feedback
    voiceBtn.classList.add('listening');
    voiceBtn.textContent = '🎙️';

    // Start recognition
    recognition.start();

    recognition.onstart = function() {
        // Voice recognition started
    };

    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;

        // Process the voice input
        processVoiceCommand(transcript);

        // Reset button
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    };

    recognition.onerror = function(event) {
        alert('Terjadi kesalahan dalam pengenalan suara. Silakan coba lagi.');

        // Reset button
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    };

    recognition.onend = function() {
        // Reset button if not already reset
        voiceBtn.classList.remove('listening');
        voiceBtn.textContent = '🎤';
    };
};

// --- PROCESS VOICE COMMAND ---
function processVoiceCommand(transcript) {
    const inputCari = document.getElementById('input-cari');
    const lowerTranscript = transcript.toLowerCase();

    // Remove common prefixes like "pesan", "cari", "beli"
    let searchTerm = lowerTranscript
        .replace(/^(pesan|cari|beli|mau)\s+/i, '')
        .replace(/\s+(ya|dong|nih|deh)$/i, '')
        .trim();

    // Set the search input and trigger search
    inputCari.value = searchTerm;
    filterMenu();

    // Show feedback
    showVoiceFeedback(`Mencari: "${searchTerm}"`);
}

// --- SHOW VOICE FEEDBACK ---
function showVoiceFeedback(message) {
    // Remove existing feedback
    const existingFeedback = document.querySelector('.voice-feedback');
    if (existingFeedback) {
        existingFeedback.remove();
    }

    // Create new feedback element
    const feedback = document.createElement('div');
    feedback.className = 'voice-feedback';
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #008080;
        color: white;
        padding: 10px 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(feedback);

    // Remove after 3 seconds
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => feedback.remove(), 300);
        }
    }, 3000);
}

// Global variable untuk keranjang
let keranjang = [];
let keranjangList = null;
let totalHargaSpan = null;
let checkoutBtn = null;
let checkoutStatusDiv = null;
let metodeKirim = 'grab';
let detailPengirimanDiv = null;

// --- FUNGSI PERBARUI KERANJANG (Global) ---
function perbaruiKeranjang() {
    if (!keranjangList || !totalHargaSpan) return;
    
    keranjangList.innerHTML = ''; 
    let total = 0;
    let totalItems = 0;

    if (keranjang.length === 0) {
        keranjangList.innerHTML = '<p style="text-align: center;">Keranjang masih kosong.</p>';
        if (checkoutBtn) checkoutBtn.disabled = true; 
        if (document.getElementById('quick-whatsapp-btn')) document.getElementById('quick-whatsapp-btn').disabled = true;
    } else {
        keranjang.forEach((item, index) => {
            const div = document.createElement('div');
            div.classList.add('keranjang-item', 'fade-in');
            div.style.display = "flex";
            div.style.justifyContent = "space-between";
            div.style.marginBottom = "10px";
            div.innerHTML = `
                <span>${item.nama} (${item.jumlah}x)</span>
                <span>Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')} 
                    <button class="hapus-item" data-index="${index}" style="color:red; cursor:pointer; border:none; background:none; font-weight:bold; margin-left: 10px;">X</button>
                </span>
            `;
            keranjangList.appendChild(div);
            total += item.harga * item.jumlah;
            totalItems += item.jumlah;
        });
        if (checkoutBtn) checkoutBtn.disabled = false; 
        if (document.getElementById('quick-whatsapp-btn')) document.getElementById('quick-whatsapp-btn').disabled = false;
    }

    const cartCounter = document.getElementById('cart-counter');
    if (cartCounter) {
        cartCounter.textContent = totalItems;
        cartCounter.classList.toggle('empty', totalItems === 0);
    }

    if (totalHargaSpan) {
        totalHargaSpan.textContent = `Rp ${total.toLocaleString('id-ID')}`;
    }
}

// --- FUNGSI TAMBAH KE KERANJANG (Global) ---
window.tambahKeKeranjang = function(button) {
    const produkDiv = button.closest('.produk'); 
    const nama = produkDiv.dataset.nama;
    const harga = parseInt(produkDiv.dataset.harga);

    const itemIndex = keranjang.findIndex(item => item.nama === nama);
    if (itemIndex > -1) {
        keranjang[itemIndex].jumlah++;
    } else {
        keranjang.push({ nama, harga, jumlah: 1 });
    }
    perbaruiKeranjang(); 
    updateMiniCart();

    // Tampilkan notifikasi
    const notifikasi = document.getElementById('notifikasi');
    if (notifikasi) {
        notifikasi.classList.add('show');
        setTimeout(() => {
            notifikasi.classList.remove('show');
        }, 3000);
    }
};

// --- FUNGSI UPDATE MINI CART (Global) ---
window.updateMiniCart = function() {
    const miniCartItems = document.getElementById('mini-cart-items');
    const miniCartTotal = document.getElementById('mini-cart-total');
    const miniCartCount = document.getElementById('mini-cart-count');
    const miniCartCountMobile = document.getElementById('mini-cart-count-mobile');
    if (!miniCartItems || !miniCartTotal || !miniCartCount) return;
    
    let total = 0;
    let totalItems = 0;

    if (keranjang.length === 0) {
        miniCartItems.innerHTML = '<p style="text-align: center; color: #999;">Keranjang kosong</p>';
        miniCartTotal.textContent = 'Rp 0';
        miniCartCount.textContent = '0';
        if (miniCartCountMobile) miniCartCountMobile.textContent = '0';
    } else {
        miniCartItems.innerHTML = '';
        keranjang.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'mini-cart-item';
            div.innerHTML = `
                <span>${item.nama} (${item.jumlah}x)<br><strong style="color: #e53e3e;">Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')}</strong></span>
                <button class="mini-cart-item-remove" onclick="removeMiniCartItem(${index})">✕</button>
            `;
            miniCartItems.appendChild(div);
            total += item.harga * item.jumlah;
            totalItems += item.jumlah;
        });
        miniCartTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        miniCartCount.textContent = totalItems;
        if (miniCartCountMobile) miniCartCountMobile.textContent = totalItems;
    }
};

window.removeMiniCartItem = function(index) {
    keranjang.splice(index, 1);
    perbaruiKeranjang();
    updateMiniCart();
};

// --- FUNGSI TOGGLE MINI CART (Global) ---
window.toggleMiniCart = function() {
    const miniCartPanel = document.getElementById('mini-cart-panel');
    if (miniCartPanel.style.display === 'none' || miniCartPanel.style.display === '') {
        miniCartPanel.style.display = 'block';
    } else {
        miniCartPanel.style.display = 'none';
    }
};

window.goToCheckout = function() {
    document.getElementById('mini-cart-panel').style.display = 'none';
    const checkoutSection = document.querySelector('.keranjang-section');
    checkoutSection.scrollIntoView({ behavior: 'smooth' });
};

// Periksa tema yang tersimpan saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        toggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
    
    keranjangList = document.getElementById('keranjang-list');
    totalHargaSpan = document.getElementById('total-harga');
    checkoutBtn = document.getElementById('checkout-btn');
    checkoutStatusDiv = document.getElementById('checkout-status');
    detailPengirimanDiv = document.getElementById('detail-pengiriman');
    const metodeBayarRadios = document.querySelectorAll('input[name="metodeBayar"]');
    const metodeKirimRadios = document.querySelectorAll('input[name="metodeKirim"]');
    const detailPembayaranDiv = document.getElementById('detail-pembayaran'); 
    const inputCari = document.getElementById('input-cari');
    const searchSuggestions = document.getElementById('search-suggestions');
    const voiceSearchBtn = document.getElementById('voice-search-btn');
    const productNameList = Array.from(document.querySelectorAll('.produk')).map(produk => produk.dataset.nama || '');

    if (voiceSearchBtn && !window.isVoiceSearchSupported()) {
        voiceSearchBtn.disabled = true;
        voiceSearchBtn.title = 'Pencarian suara hanya tersedia di HTTPS atau localhost dengan browser yang mendukung Web Speech API.';
        voiceSearchBtn.textContent = '🔇';
        voiceSearchBtn.style.cursor = 'not-allowed';
    }

    inputCari?.addEventListener('input', () => {
        filterMenu();
        showSearchSuggestions();
    });

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.search-box')) {
            hideSearchSuggestions();
        }
    });

    // --- 1. FUNGSI FILTER & PENCARIAN ---
    window.filterMenu = function() {
        const kataKunci = document.getElementById('input-cari').value.toLowerCase();
        const kategoriHarga = document.getElementById('filter-harga').value;
        const daftarProduk = document.querySelectorAll('.produk');

        daftarProduk.forEach(produk => {
            const namaProduk = produk.dataset.nama.toLowerCase();
            const hargaProduk = parseInt(produk.dataset.harga);
            
            const cocokNama = namaProduk.includes(kataKunci);
            let cocokHarga = false;

            if (kategoriHarga === 'semua') {
                cocokHarga = true;
            } else if (kategoriHarga === 'murah') {
                cocokHarga = hargaProduk < 20000;
            } else if (kategoriHarga === 'sedang') {
                cocokHarga = hargaProduk >= 20000 && hargaProduk <= 30000;
            } else if (kategoriHarga === 'mahal') {
                cocokHarga = hargaProduk > 30000;
            }

            // Tampilkan jika cocok keduanya
            produk.style.display = (cocokNama && cocokHarga) ? "flex" : "none";
        });
    };

    window.showSearchSuggestions = function() {
        if (!searchSuggestions || !inputCari) return;

        const query = inputCari.value.trim().toLowerCase();
        if (!query) {
            hideSearchSuggestions();
            return;
        }

        const matches = productNameList
            .filter(nama => nama.toLowerCase().includes(query))
            .slice(0, 5);

        searchSuggestions.innerHTML = '';
        if (matches.length === 0) {
            const noResultItem = document.createElement('div');
            noResultItem.className = 'search-suggestion-item no-result';
            noResultItem.textContent = 'Tidak ada saran';
            searchSuggestions.appendChild(noResultItem);
        } else {
            matches.forEach(nama => {
                const item = document.createElement('div');
                item.className = 'search-suggestion-item';
                item.textContent = nama;
                item.addEventListener('click', () => {
                    inputCari.value = nama;
                    filterMenu();
                    hideSearchSuggestions();
                });
                searchSuggestions.appendChild(item);
            });
        }

        searchSuggestions.style.display = 'block';
    };

    window.hideSearchSuggestions = function() {
        if (!searchSuggestions) return;
        searchSuggestions.style.display = 'none';
        searchSuggestions.innerHTML = '';
    };

    // --- 2. FUNGSI URUTKAN HARGA ---
    window.urutkanProduk = function() {
        const katalog = document.querySelector('.katalog');
        const produkArray = Array.from(document.querySelectorAll('.produk'));
        const kriteria = document.getElementById('urutkan-harga').value;

        if (kriteria === 'default') return;

        produkArray.sort((a, b) => {
            const hargaA = parseInt(a.dataset.harga);
            const hargaB = parseInt(b.dataset.harga);
            return kriteria === 'termurah' ? hargaA - hargaB : hargaB - hargaA;
        });

        // Susun ulang elemen di layar sesuai urutan
        produkArray.forEach(produk => katalog.appendChild(produk));
    };

    // --- 3. FUNGSI KERANJANG ---
    function tampilkanNotifikasi(message = 'Ditambahkan ke keranjang!') {
        const notifikasi = document.getElementById('notifikasi');
        if (!notifikasi) return;
        notifikasi.textContent = message;
        notifikasi.classList.add('show');
        setTimeout(() => {
            notifikasi.classList.remove('show');
        }, 3000); // Hilang setelah 3 detik
    }

    function perbaruiKeranjang() {
        keranjangList.innerHTML = ''; 
        let total = 0;
        let totalItems = 0;

        if (keranjang.length === 0) {
            keranjangList.innerHTML = '<p style="text-align: center;">Keranjang masih kosong.</p>';
            checkoutBtn.disabled = true; 
            const quickBtn = document.getElementById('quick-whatsapp-btn');
            if (quickBtn) quickBtn.disabled = true;
        } else {
            keranjang.forEach((item, index) => {
                const div = document.createElement('div');
                div.classList.add('keranjang-item', 'fade-in'); // Tambahkan fade-in
                div.style.display = "flex";
                div.style.justifyContent = "space-between";
                div.style.marginBottom = "10px";
                div.innerHTML = `
                    <span>${item.nama} (${item.jumlah}x)</span>
                    <span>Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')} 
                        <button class="hapus-item" data-index="${index}" style="color:red; cursor:pointer; border:none; background:none; font-weight:bold; margin-left: 10px;">X</button>
                    </span>
                `;
                keranjangList.appendChild(div);
                total += item.harga * item.jumlah;
                totalItems += item.jumlah;
            });
            checkoutBtn.disabled = false; 
            const quickBtn = document.getElementById('quick-whatsapp-btn');
            if (quickBtn) quickBtn.disabled = false;
        }

        const cartCounter = document.getElementById('cart-counter');
        if (cartCounter) {
            cartCounter.textContent = totalItems;
            cartCounter.classList.toggle('empty', totalItems === 0);
        }

        totalHargaSpan.textContent = `Rp ${total.toLocaleString('id-ID')}`; 
    }

    window.tambahKeKeranjang = function(button) {
        const produkDiv = button.closest('.produk'); 
        const nama = produkDiv.dataset.nama;
        const harga = parseInt(produkDiv.dataset.harga);

        const itemIndex = keranjang.findIndex(item => item.nama === nama);
        if (itemIndex > -1) {
            keranjang[itemIndex].jumlah++;
        } else {
            keranjang.push({ nama, harga, jumlah: 1 });
        }
        resetCheckoutStatus();
        perbaruiKeranjang(); 
        updateMiniCart();

        // Tampilkan notifikasi
        tampilkanNotifikasi();
    };

    keranjangList.addEventListener('click', (event) => {
        if (event.target.classList.contains('hapus-item')) {
            const index = parseInt(event.target.dataset.index);
            keranjang.splice(index, 1); 
            perbaruiKeranjang(); 
            updateMiniCart();
        }
    });

    // --- 4. METODE PEMBAYARAN ---
    function perbaruiDetailPembayaran() {
        const radioTerpilih = document.querySelector('input[name="metodeBayar"]:checked');
        if (!radioTerpilih) return;

        const metodeTerpilih = radioTerpilih.value;
        let detailHTML = ''; 
        
        if (metodeTerpilih === 'whatsapp') {
            detailHTML = '<p>Anda akan diarahkan langsung ke WhatsApp untuk konfirmasi pesanan.</p>';
            checkoutBtn.textContent = 'Lanjutkan Pembayaran via WhatsApp';
            checkoutBtn.style.backgroundColor = '#4CAF50'; 
        } else if (metodeTerpilih === 'transfer') {
            detailHTML = '<p>Transfer Bank: <strong>BCA 1234567890</strong> a/n Aneka Coffe Adel</p>';
            checkoutBtn.textContent = 'Lanjutkan ke Transfer Bank';
            checkoutBtn.style.backgroundColor = '#ffc107'; 
        } else if (metodeTerpilih === 'ewallet') {
            detailHTML = `
                <p>Scan QR / barcode e-wallet di bawah, lalu klik tombol untuk mengganti dengan barcode Anda.</p>
                <div id="ewallet-qr">
                    <div class="ewallet-qr-card">
                        <div class="ewallet-card-image" id="ewallet-image-dana">
                            <span>QR DANA</span>
                        </div>
                        <div class="ewallet-qr-label">DANA</div>
                        <div class="ewallet-qr-number">0812-3456-7890</div>
                        <button type="button" class="ewallet-change-btn" onclick="prepareEwalletUpload('dana')">Ganti Barcode</button>
                    </div>
                    <div class="ewallet-qr-card">
                        <div class="ewallet-card-image" id="ewallet-image-ovo">
                            <span>QR OVO</span>
                        </div>
                        <div class="ewallet-qr-label">OVO</div>
                        <div class="ewallet-qr-number">0812-3456-7890</div>
                        <button type="button" class="ewallet-change-btn" onclick="prepareEwalletUpload('ovo')">Ganti Barcode</button>
                    </div>
                    <div class="ewallet-qr-card">
                        <div class="ewallet-card-image" id="ewallet-image-gopay">
                            <span>QR GoPay</span>
                        </div>
                        <div class="ewallet-qr-label">GoPay</div>
                        <div class="ewallet-qr-number">0812-3456-7890</div>
                        <button type="button" class="ewallet-change-btn" onclick="prepareEwalletUpload('gopay')">Ganti Barcode</button>
                    </div>
                </div>
                <input type="file" id="ewallet-file-input" accept="image/*" style="display:none;" onchange="handleEwalletBarcodeUpload(event)">
                <p style="margin-top: 14px;">Setelah upload, pastikan barcode terlihat jelas lalu konfirmasi lewat WhatsApp.</p>
            `;
            checkoutBtn.textContent = 'Konfirmasi Pembayaran E-Wallet';
            checkoutBtn.style.backgroundColor = '#6c5ce7'; 
        } else {
            detailHTML = '<p>Metode ini dalam simulasi. Integrasi gateway diperlukan.</p>';
            checkoutBtn.textContent = 'Bayar Sekarang';
            checkoutBtn.style.backgroundColor = '#007bff';
        }
        detailPembayaranDiv.innerHTML = detailHTML; 
    }

    window.currentEwalletTarget = '';

    window.prepareEwalletUpload = function(wallet) {
        window.currentEwalletTarget = wallet;
        const input = document.getElementById('ewallet-file-input');
        if (input) input.click();
    };

    window.handleEwalletBarcodeUpload = function(event) {
        const file = event.target.files[0];
        if (!file) return;

        const previewElement = document.getElementById(`ewallet-image-${window.currentEwalletTarget}`);
        if (!previewElement) return;

        if (!file.type.startsWith('image/')) {
            alert('Silakan unggah file gambar (JPG/PNG).');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran file terlalu besar. Maksimum 5MB.');
            event.target.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.innerHTML = '';
            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = `Barcode ${window.currentEwalletTarget.toUpperCase()}`;
            previewElement.appendChild(img);
        };
        reader.readAsDataURL(file);
    };

    metodeBayarRadios.forEach(radio => {
        radio.addEventListener('change', perbaruiDetailPembayaran);
    });

    // --- FUNGSI UPDATE DETAIL PENGIRIMAN ---
    function perbaruiDetailPengiriman() {
        const radioTerpilih = document.querySelector('input[name="metodeKirim"]:checked');
        if (!radioTerpilih || !detailPengirimanDiv) return;

        const metodeKirimTerpilih = radioTerpilih.value;
        let detailHTML = '';
        
        if (metodeKirimTerpilih === 'grab') {
            detailHTML = `
                <p><strong>🚗 Pengiriman via Grab</strong></p>
                <p>Pesanan akan dikirim melalui aplikasi Grab dalam 30-45 menit.</p>
                <p style="color: #666; font-size: 0.95em;">Biaya pengiriman akan ditampilkan sesuai jarak lokasi Anda.</p>
                <div style="margin: 10px 0;">
                    <input type="text" id="alamat-grab" placeholder="Masukkan alamat lengkap" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 8px;">
                    <button type="button" onclick="deteksiLokasi('grab')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">📍 Deteksi Lokasi</button>
                </div>
                <button type="button" onclick="openGrab()" style="margin-top: 8px; padding: 8px 14px; background: #1ab05f; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">Buka Grab</button>
            `;
        } else if (metodeKirimTerpilih === 'gofood') {
            detailHTML = `
                <p><strong>🏍️ Pengiriman via GoFood</strong></p>
                <p>Pesanan akan dikirim melalui aplikasi GoFood dalam 25-40 menit.</p>
                <p style="color: #666; font-size: 0.95em;">Biaya pengiriman ditentukan oleh GoFood berdasarkan jarak lokasi Anda.</p>
                <div style="margin: 10px 0;">
                    <input type="text" id="alamat-gofood" placeholder="Masukkan alamat lengkap" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; margin-bottom: 8px;">
                    <button type="button" onclick="deteksiLokasi('gofood')" style="padding: 6px 12px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">📍 Deteksi Lokasi</button>
                </div>
                <button type="button" onclick="openGoFood()" style="margin-top: 8px; padding: 8px 14px; background: #f70000; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 700;">Buka GoFood</button>
            `;
        } else if (metodeKirimTerpilih === 'ambil') {
            detailHTML = `
                <p><strong>🚶 Ambil Sendiri di Toko</strong></p>
                <p>Pesanan siap diambil dalam 15-20 menit setelah konfirmasi.</p>
                <p style="color: #666; font-size: 0.95em;">📍 Alamat: Jl. Raya Nusantara, Kampus Hukum, Banda Aceh</p>
            `;
        }
        detailPengirimanDiv.innerHTML = detailHTML;
        metodeKirim = metodeKirimTerpilih;
    }

    metodeKirimRadios.forEach(radio => {
        radio.addEventListener('change', perbaruiDetailPengiriman);
    });

    // Inisialisasi detail pengiriman
    perbaruiDetailPengiriman();

    // --- FUNGSI DETEKSI LOKASI ---
    window.deteksiLokasi = function(metode) {
        if (!navigator.geolocation) {
            alert('Browser Anda tidak mendukung Geolocation API.');
            return;
        }

        const inputId = metode === 'grab' ? 'alamat-grab' : 'alamat-gofood';
        const input = document.getElementById(inputId);
        if (!input) return;

        input.value = 'Mendeteksi lokasi...';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                // Convert to address using reverse geocoding (simple approximation)
                fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`)
                    .then(response => response.json())
                    .then(data => {
                        const address = `${data.localityInfo.administrative[2].name}, ${data.city}, ${data.principalSubdivision}`;
                        input.value = address;
                    })
                    .catch(() => {
                        // Fallback to coordinates
                        input.value = `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
                    });
            },
            (error) => {
                alert('Gagal mendapatkan lokasi. Pastikan Anda mengizinkan akses lokasi.');
                input.value = '';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    metodeBayarRadios.forEach(radio => {
        radio.addEventListener('change', perbaruiDetailPembayaran);
    });

    function formatRupiah(value) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(value);
    }

    function getShippingCost() {
        if (metodeKirim === 'grab') return 12000;
        if (metodeKirim === 'gofood') return 10000;
        return 0;
    }

    function formatDateTime(date) {
        const tanggal = date.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
        const waktu = date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
        });
        return `${tanggal} ${waktu}`;
    }

    function generateInvoiceText(metodeTerpilih) {
        const now = new Date();
        const orderId = `INV${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        let subtotal = 0;
        let message = "*Aneka Coffe Adel - Invoice Pesanan*\n";
        message += `*Nomor Invoice:* ${orderId}\n`;
        message += `*Tanggal:* ${formatDateTime(now)}\n`;
        message += `*Status:* Menunggu Konfirmasi\n\n`;
        message += "*Rincian Pesanan*\n";

        keranjang.forEach((item, index) => {
            const lineTotal = item.harga * item.jumlah;
            subtotal += lineTotal;
            message += `${index + 1}. ${item.nama}\n`;
            message += `   ${item.jumlah} x ${formatRupiah(item.harga)} = ${formatRupiah(lineTotal)}\n`;
        });

        const shippingCost = getShippingCost();
        const promoDiscount = 0;
        message += `\n*Subtotal:* ${formatRupiah(subtotal)}\n`;
        message += `*Ongkir:* ${formatRupiah(shippingCost)}\n`;
        message += `*Total:* ${formatRupiah(subtotal + shippingCost)}\n\n`;

        message += "*Metode Pengiriman*\n";
        if (metodeKirim === 'grab') {
            const alamat = document.getElementById('alamat-grab')?.value || 'Alamat belum diisi';
            message += `• Grab (30-45 menit)\n`;
            message += `• Alamat: ${alamat}\n`;
        } else if (metodeKirim === 'gofood') {
            const alamat = document.getElementById('alamat-gofood')?.value || 'Alamat belum diisi';
            message += `• GoFood (25-40 menit)\n`;
            message += `• Alamat: ${alamat}\n`;
        } else {
            message += `• Ambil Sendiri di Toko\n`;
            message += `• Alamat: Jl. Raya Nusantara, Kampus Hukum, Banda Aceh\n`;
        }

        message += "\n*Metode Pembayaran*\n";
        if (metodeTerpilih === 'whatsapp') {
            message += `• WhatsApp\n`;
            message += `Mohon siapkan bukti pembayaran saat konfirmasi.\n`;
        } else if (metodeTerpilih === 'kartu') {
            message += `• Kartu Kredit/Debit\n`;
        } else if (metodeTerpilih === 'transfer') {
            message += `• Transfer Bank\n`;
            message += `  - BCA: 1234567890 a/n Aneka Coffe Adel\n`;
        } else if (metodeTerpilih === 'ewallet') {
            message += `• E-Wallet (Dana, OVO, GoPay)\n`;
            message += `  - DANA: 0812-3456-7890\n`;
            message += `  - OVO: 0812-3456-7890\n`;
            message += `  - GoPay: 0812-3456-7890\n`;
        }

        message += `\n*Catatan:* Mohon konfirmasi pesanan dan kirim bukti pembayaran jika sudah selesai.\n`;
        message += `\nTerima kasih telah memesan di Aneka Coffe Adel!`;

        return message;
    }

    // --- 5. FUNGSI CHECKOUT ---
    window.checkout = function() {
        if (keranjang.length === 0) {
            alert('Keranjang belanja Anda masih kosong!');
            return;
        }

        if (metodeKirim === 'grab' || metodeKirim === 'gofood') {
            const alamatInput = document.getElementById(`alamat-${metodeKirim}`);
            const alamatValue = alamatInput?.value.trim();
            if (!alamatValue) {
                alert('Lengkapi alamat pengiriman untuk metode ' + (metodeKirim === 'grab' ? 'Grab' : 'GoFood') + '.');
                alamatInput?.focus();
                return;
            }
        }

        const metodeTerpilih = document.querySelector('input[name="metodeBayar"]:checked').value;
        const invoiceText = generateInvoiceText(metodeTerpilih);

        const nomorWhatsApp = "6285260558595";
        const urlWhatsApp = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(invoiceText)}`;
        window.open(urlWhatsApp, '_blank');
        completeTransaction();
    };

    window.openGrab = function() {
        const grabUrl = 'https://grab.com/app';
        window.open(grabUrl, '_blank');
    };

    window.openGoFood = function() {
        const goFoodUrl = 'https://gofood.co.id/';
        window.open(goFoodUrl, '_blank');
    };

    window.showCheckoutStatus = function(message) {
        if (!checkoutStatusDiv) return;
        checkoutStatusDiv.innerHTML = message;
        checkoutStatusDiv.style.display = 'block';
    };

    window.completeTransaction = function() {
        keranjang = [];
        perbaruiKeranjang();
        updateMiniCart();
        showCheckoutStatus(`
            <strong>✅ Transaksi Berhasil!</strong>
            <p>Pesanan Anda telah dicatat untuk pengiriman via <strong>${metodeKirim === 'grab' ? '🚗 Grab' : metodeKirim === 'gofood' ? '🏍️ GoFood' : '🚶 Ambil Sendiri'}</strong>. Keranjang sudah dikosongkan.</p>
        `);
    };

    window.resetCheckoutStatus = function() {
        if (!checkoutStatusDiv) return;
        checkoutStatusDiv.style.display = 'none';
        checkoutStatusDiv.innerHTML = '';
    };

    // --- FUNGSI KIRIM PESAN CEPAT ---
    window.kirimPesanCepat = function() {
        if (keranjang.length === 0) {
            alert('Keranjang belanja Anda masih kosong!');
            return;
        }

        // Validasi alamat jika menggunakan Grab atau GoFood
        if (metodeKirim === 'grab' || metodeKirim === 'gofood') {
            const alamatInput = document.getElementById(`alamat-${metodeKirim}`);
            const alamatValue = alamatInput?.value.trim();
            if (!alamatValue) {
                alert('Lengkapi alamat pengiriman untuk metode ' + (metodeKirim === 'grab' ? 'Grab' : 'GoFood') + '.');
                alamatInput?.focus();
                return;
            }
        }

        // Generate pesan WhatsApp dengan metode pembayaran WhatsApp
        const invoiceText = generateInvoiceText('whatsapp');

        // Nomor WhatsApp toko
        const nomorWhatsApp = "6285260558595";
        const urlWhatsApp = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(invoiceText)}`;

        // Buka WhatsApp langsung
        window.open(urlWhatsApp, '_blank');

        // Kosongkan keranjang setelah kirim pesan
        keranjang = [];
        perbaruiKeranjang();
        updateMiniCart();

        // Tampilkan status sukses
        showCheckoutStatus(`
            <strong>🚀 Pesan WhatsApp Terkirim!</strong>
            <p>Pesanan Anda telah dikirim ke WhatsApp admin. Silakan konfirmasi pembayaran dan detail pengiriman.</p>
        `);
    };

    // Inisialisasi awal
    perbaruiKeranjang(); 
    perbaruiDetailPembayaran();
    updateMiniCart();
    showWelcomeMessage();
    startPeriodicEventNotifications();

    function getGreeting() {
        const now = new Date();
        const hour = now.getHours();

        if (hour >= 4 && hour < 11) {
            return 'Selamat pagi';
        }
        if (hour >= 11 && hour < 16) {
            return 'Selamat siang';
        }
        return 'Selamat malam';
    }

    function showWelcomeMessage() {
        const welcome = document.getElementById('welcome-message');
        if (!welcome) return;

        const greeting = getGreeting();
        welcome.textContent = `${greeting}! Selamat datang di Aneka Coffe Adel. Nikmati minuman segar dan penawaran spesial hari ini.`;
    }

    function showEventNotification(message) {
        const eventNotif = document.getElementById('event-notification');
        if (!eventNotif) return;

        eventNotif.textContent = message;
        eventNotif.classList.add('show');

        clearTimeout(eventNotif.hideTimeout);
        eventNotif.hideTimeout = setTimeout(() => {
            eventNotif.classList.remove('show');
        }, 4500);
    }

    function startPeriodicEventNotifications() {
        const messages = [
            'Seseorang di Meulaboh baru saja membeli Es Dawet Ayu!',
            'Pelanggan baru saja memesan Thai Tea Original!',
            'Pesanan tiba: Es Cincau Hijau, siap dikirim!',
            'Nikmati diskon spesial untuk Lemon Madu Dingin sekarang!',
            'Pembeli lain sedang melihat menu best seller hari ini.'
        ];

        function scheduleNext() {
            const delay = 14000 + Math.floor(Math.random() * 8000);
            setTimeout(() => {
                const message = messages[Math.floor(Math.random() * messages.length)];
                showEventNotification(message);
                scheduleNext();
            }, delay);
        }

        scheduleNext();
    }

    // --- 6. FUNGSI BELI LANGSUNG ---
    window.beliLangsung = function(button) {
        const produkDiv = button.closest('.produk');
        const nama = produkDiv.dataset.nama;
        const harga = parseInt(produkDiv.dataset.harga);
        const hargaFormat = harga.toLocaleString('id-ID');

        const pesan = `Halo Aneka Coffe Adel, saya ingin memesan:\n\n- ${nama} (1x) - Rp ${hargaFormat}\n\nTotal: Rp ${hargaFormat}\n\nMohon konfirmasi pesanan saya.`;
        
        const nomorWhatsApp = "6285260558595";
        const urlWhatsApp = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(pesan)}`;
        window.open(urlWhatsApp, '_blank');
    };

    // --- 7. FUNGSI SHARE PRODUK ---
    window.shareProduct = function(button) {
        const produkDiv = button.closest('.produk');
        const nama = produkDiv.dataset.nama;
        const harga = parseInt(produkDiv.dataset.harga);
        const hargaFormat = harga.toLocaleString('id-ID');
        const produkURL = window.location.href;
        
        const teksShare = `Cek ini! ${nama} - Rp ${hargaFormat} dari Aneka Coffe Adel 😋`;
        
        // Buat menu share
        const shareMenu = document.createElement('div');
        shareMenu.className = 'share-menu';
        shareMenu.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;border-radius:10px;padding:15px;box-shadow:0 4px 20px rgba(0,0,0,0.3);z-index:2000;min-width:250px;';
        
        shareMenu.innerHTML = `
            <h3 style="margin-top:0;text-align:center;">Bagikan Produk</h3>
            <button style="width:100%;padding:10px;margin:5px 0;background:#25D366;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;" onclick="shareToWhatsApp('${teksShare}')">💬 WhatsApp</button>
            <button style="width:100%;padding:10px;margin:5px 0;background:#1877F2;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;" onclick="shareToFacebook('${produkURL}')">👍 Facebook</button>
            <button style="width:100%;padding:10px;margin:5px 0;background:#1DA1F2;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;" onclick="shareToTwitter('${teksShare}','${produkURL}')">𝕏 Twitter</button>
            <button style="width:100%;padding:10px;margin:5px 0;background:#E1306C;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;" onclick="copyToClipboard('${teksShare}')">📋 Copy Text</button>
            <button style="width:100%;padding:10px;margin:5px 0;background:#666;color:white;border:none;border-radius:5px;cursor:pointer;font-weight:bold;" onclick="closeShareMenu()">✕ Tutup</button>
        `;
        
        document.body.appendChild(shareMenu);
        window.currentShareMenu = shareMenu;
    };

    window.shareToWhatsApp = function(teks) {
        const nomorWhatsApp = "6285260558595";
        const urlWhatsApp = `https://wa.me/${nomorWhatsApp}?text=${encodeURIComponent(teks)}`;
        window.open(urlWhatsApp, '_blank');
        closeShareMenu();
    };

    window.shareToFacebook = function(url) {
        const urlFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        window.open(urlFacebook, '_blank');
        closeShareMenu();
    };

    window.shareToTwitter = function(teks, url) {
        const urlTwitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(teks)}&url=${encodeURIComponent(url)}`;
        window.open(urlTwitter, '_blank');
        closeShareMenu();
    };

    window.copyToClipboard = function(teks) {
        navigator.clipboard.writeText(teks).then(() => {
            alert('✅ Teks telah disalin ke clipboard!');
            closeShareMenu();
        });
    };

    window.closeShareMenu = function() {
        if (window.currentShareMenu) {
            window.currentShareMenu.remove();
            window.currentShareMenu = null;
        }
    };

    // Tutup share menu jika klik di luar
    document.addEventListener('click', (e) => {
        if (window.currentShareMenu && !window.currentShareMenu.contains(e.target) && !e.target.classList.contains('share-btn')) {
            closeShareMenu();
        }
    });

    // --- ULASAN: Rating Interaktif (Opsional) ---
const ratings = document.querySelectorAll('.rating');
ratings.forEach(rating => {
    rating.addEventListener('click', (e) => {
        const stars = e.target.textContent;
        alert(`Terima kasih atas rating ${stars.length} bintang!`);
    });
});

// Jika ingin carousel ulasan (gunakan library Swiper.js jika banyak ulasan)
// Contoh sederhana: Auto-slide setiap 5 detik
let currentUlasan = 0;
const ulasanItems = document.querySelectorAll('.ulasan-item');
function slideUlasan() {
    ulasanItems.forEach(item => item.style.display = 'none');
    ulasanItems[currentUlasan].style.display = 'block';
    currentUlasan = (currentUlasan + 1) % ulasanItems.length;
}
if (ulasanItems.length > 3) {  // Aktifkan jika lebih dari 3 ulasan
    setInterval(slideUlasan, 5000);
    slideUlasan();  // Mulai
}

// --- 6. FUNGSI DETAIL PRODUK ---
window.lihatDetail = function(button) {
    const produkDiv = button.closest('.produk');
    const nama = produkDiv.dataset.nama;
    const ukuran = produkDiv.dataset.ukuran;
    const kalori = produkDiv.dataset.kalori;
    const protein = produkDiv.dataset.protein;
    const gula = produkDiv.dataset.gula;
    const kafein = produkDiv.dataset.kafein;
    const bahan = produkDiv.dataset.bahan;

    // Update modal content
    document.getElementById('detail-nama').textContent = nama;
    document.getElementById('detail-ukuran').textContent = ukuran;
    document.getElementById('detail-kalori').textContent = kalori;
    document.getElementById('detail-protein').textContent = protein;
    document.getElementById('detail-gula').textContent = gula;
    document.getElementById('detail-kafein').textContent = kafein;
    document.getElementById('detail-bahan-text').textContent = bahan;

    // Tampilkan modal
    const modal = document.getElementById('modal-detail');
    modal.style.display = 'flex';
};

window.tutupDetail = function() {
    const modal = document.getElementById('modal-detail');
    modal.style.display = 'none';
};

// Tutup modal jika klik di luar
window.addEventListener('click', function(event) {
    const modal = document.getElementById('modal-detail');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// --- 8. FUNGSI MINI CART ---
window.toggleMiniCart = function() {
    const miniCartPanel = document.getElementById('mini-cart-panel');
    if (miniCartPanel.style.display === 'none') {
        miniCartPanel.style.display = 'block';
    } else {
        miniCartPanel.style.display = 'none';
    }
};

window.updateMiniCart = function() {
    const miniCartItems = document.getElementById('mini-cart-items');
    const miniCartTotal = document.getElementById('mini-cart-total');
    const miniCartCount = document.getElementById('mini-cart-count');
    let total = 0;
    let totalItems = 0;

    if (keranjang.length === 0) {
        miniCartItems.innerHTML = '<p style="text-align: center; color: #999;">Keranjang kosong</p>';
        miniCartTotal.textContent = 'Rp 0';
        miniCartCount.textContent = '0';
    } else {
        miniCartItems.innerHTML = '';
        keranjang.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'mini-cart-item';
            div.innerHTML = `
                <span>${item.nama} (${item.jumlah}x)<br><strong style="color: #e53e3e;">Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')}</strong></span>
                <button class="mini-cart-item-remove" onclick="removeMiniCartItem(${index})">✕</button>
            `;
            miniCartItems.appendChild(div);
            total += item.harga * item.jumlah;
            totalItems += item.jumlah;
        });
        miniCartTotal.textContent = `Rp ${total.toLocaleString('id-ID')}`;
        miniCartCount.textContent = totalItems;
    }
};

window.removeMiniCartItem = function(index) {
    keranjang.splice(index, 1);
    resetCheckoutStatus();
    perbaruiKeranjang();
    updateMiniCart();
};

window.goToCheckout = function() {
    document.getElementById('mini-cart-panel').style.display = 'none';
    const checkoutSection = document.querySelector('.keranjang-section');
    checkoutSection.scrollIntoView({ behavior: 'smooth' });
};

// Tutup mini cart jika klik di luar
document.addEventListener('click', (e) => {
    const miniCartBox = document.querySelector('.mini-cart-box');
    const miniCartPanel = document.getElementById('mini-cart-panel');
    if (miniCartPanel && !miniCartBox.contains(e.target)) {
        miniCartPanel.style.display = 'none';
    }
});
});