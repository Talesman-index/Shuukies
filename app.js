// -------------------------------------------------------------
// SHUUKIES APPLICATION LOGIC (Cotonou, Bénin - WhatsApp E-Commerce)
// -------------------------------------------------------------

// Products Database (Box of 5 packaging, prices in FCFA)
const PRODUCTS = [
    {
        id: "chocolat-chunks",
        name: "Shuukies Chocolat Chunks",
        description: "Pâte dorée au beurre noisette, truffée de grosses pépites de chocolat noir de caractère. Le classique irrésistible.",
        price: 3500,
        image: "images/chocolat chunks.jpeg",
        tag: "Box de 5"
    },
    {
        id: "citron",
        name: "Shuukies au Citron",
        description: "Pâte parfumée aux zestes de citron bio de Sicile, avec un cœur fondant au confit de citron et glaçage acidulé.",
        price: 3500,
        image: "images/citron.jpeg",
        tag: "Box de 5"
    },
    {
        id: "double-chocolat",
        name: "Shuukies Double Chocolat",
        description: "Intense pâte au cacao noir, fourrée de chunks de chocolat au lait fondant et de chocolat blanc crémeux.",
        price: 5500,
        image: "images/double chocolat.jpeg",
        tag: "Box de 5"
    },
    {
        id: "cerelac",
        name: "Shuukies Cérélac",
        description: "Le cookie réconfortant à base de poudre de céréales Cérélac Nestlé, garni de chunks de chocolat blanc. Un retour en enfance !",
        price: 5500,
        image: "images/set.jpeg",
        tag: "Box de 5"
    },
    {
        id: "tiramisu",
        name: "Shuukies Tiramisu",
        description: "Inspiration italienne : biscuits infusés au café expresso, cœur de ganache au mascarpone et saupoudrage de cacao amer.",
        price: 6500,
        image: "images/tiramisu.jpeg",
        tag: "Box de 5"
    }
];

// App State
let cart = [];
const FREE_SHIPPING_THRESHOLD = 15000; // 15 000 F CFA
const SHIPPING_FEE = 1000; // 1 000 F CFA
const SHOP_WHATSAPP_NUMBER = "2290161677133"; // Country code +229 (Benin) + 0161677133

// DOM Elements
const productsGrid = document.getElementById("products-grid");
const cartToggleBtn = document.getElementById("cart-toggle-btn");
const cartCloseBtn = document.getElementById("cart-close-btn");
const cartOverlay = document.getElementById("cart-overlay");
const cartSidebar = document.getElementById("cart-sidebar");
const cartCountBadge = document.getElementById("cart-count");
const cartSidebarCount = document.getElementById("cart-sidebar-count");
const cartItemsContainer = document.getElementById("cart-items-container");
const cartSubtotalEl = document.getElementById("cart-subtotal");
const cartShippingFeeEl = document.getElementById("cart-shipping-fee");
const cartTotalPriceEl = document.getElementById("cart-total-price");
const shippingProgressText = document.getElementById("shipping-progress-text");
const shippingProgressFill = document.getElementById("shipping-progress-fill");
const continueShoppingBtn = document.getElementById("continue-shopping");
const checkoutBtn = document.getElementById("checkout-btn");

// Checkout Modal DOM Elements
const checkoutModal = document.getElementById("checkout-modal");
const checkoutCloseBtn = document.getElementById("checkout-close-btn");
const checkoutForm = document.getElementById("checkout-form");
const checkoutTotalBtn = document.getElementById("checkout-total-btn");

// Success Modal DOM Elements
const successModal = document.getElementById("success-modal");
const successCloseBtn = document.getElementById("success-close-btn");
const successCustomerName = document.getElementById("success-customer-name");
const successAddress = document.getElementById("success-address");
const successTotal = document.getElementById("success-total");
const successDeliveryDate = document.getElementById("success-delivery-date");
const fallingCookiesContainer = document.getElementById("falling-cookies-container");

// Helper function to format price in FCFA (e.g. 3 500 FCFA)
function formatPrice(amount) {
    return amount.toLocaleString('fr-FR') + " FCFA";
}

// Helper to format date nicely (e.g. "Mardi 17 Juin 2026")
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
}

// -------------------------------------------------------------
// Initialization & LocalStorage
// -------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadCartFromLocalStorage();
    renderProducts();
    renderCart();
    setupEventListeners();
    setupFaqAccordion();
    setupMinDeliveryDate();
});

// Load cart state
function loadCartFromLocalStorage() {
    try {
        const savedCart = localStorage.getItem("shuukies_cart");
        if (savedCart) {
            cart = JSON.parse(savedCart);
        }
    } catch (e) {
        console.error("Impossible de charger le panier :", e);
        cart = [];
    }
}

// Save cart state
function saveCartToLocalStorage() {
    try {
        localStorage.setItem("shuukies_cart", JSON.stringify(cart));
    } catch (e) {
        console.error("Impossible de sauvegarder le panier :", e);
    }
}

// Restrict delivery date input to min 24h in advance
function setupMinDeliveryDate() {
    const deliveryDateInput = document.getElementById("delivery-date");
    if (!deliveryDateInput) return;
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    deliveryDateInput.value = tomorrowStr;
    deliveryDateInput.min = tomorrowStr;
}

// -------------------------------------------------------------
// Render Functions
// -------------------------------------------------------------

// Render products cards in grid
function renderProducts() {
    if (!productsGrid) return;
    productsGrid.innerHTML = "";
    
    PRODUCTS.forEach(product => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.setAttribute("role", "article");
        card.setAttribute("aria-label", product.name);
        
        card.innerHTML = `
            <div class="product-image-container">
                <span class="product-tag">${product.tag}</span>
                <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            </div>
            <div class="product-info">
                <div class="product-title-row">
                    <h3 class="product-title">${product.name}</h3>
                    <span class="product-price">${formatPrice(product.price)}</span>
                </div>
                <p class="product-desc">${product.description}</p>
                <div class="product-actions">
                    <button class="btn btn-primary btn-block add-to-cart-btn" data-id="${product.id}">
                        Ajouter au panier
                    </button>
                </div>
            </div>
        `;
        
        productsGrid.appendChild(card);
    });
}

// Render items inside cart sidebar
function renderCart() {
    if (!cartItemsContainer) return;
    
    // Total quantity counter
    const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountBadge.textContent = totalQty;
    cartSidebarCount.textContent = `${totalQty} box`;
    
    // Animate badge pulse on change
    cartCountBadge.classList.remove("cart-pulse");
    void cartCountBadge.offsetWidth; // Trigger reflow
    cartCountBadge.classList.add("cart-pulse");

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty-message">
                <span class="cart-empty-icon-wrapper">
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm1 5a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm-4 3a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm6 1a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm-5 5a1 1 0 1 1-1-1 1 1 0 0 1 1 1zm5-1a1 1 0 1 1-1-1 1 1 0 0 1 1 1z"/></svg>
                </span>
                <p>Votre panier est vide...</p>
                <p>Sélectionnez de délicieuses box de 5 cookies !</p>
            </div>
        `;
        cartSubtotalEl.textContent = "0 FCFA";
        cartShippingFeeEl.textContent = "0 FCFA";
        cartTotalPriceEl.textContent = "0 FCFA";
        checkoutBtn.disabled = true;
        
        // Shipping progress bar update
        shippingProgressText.innerHTML = `Ajoutez <strong>${formatPrice(FREE_SHIPPING_THRESHOLD)}</strong> pour la livraison gratuite !`;
        shippingProgressFill.style.width = "0%";
        return;
    }

    checkoutBtn.disabled = false;
    cartItemsContainer.innerHTML = "";
    
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemPriceSum = item.product.price * item.quantity;
        subtotal += itemPriceSum;
        
        const itemEl = document.createElement("div");
        itemEl.className = "cart-item";
        itemEl.innerHTML = `
            <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-img">
            <div class="cart-item-info">
                <div>
                    <h4>${item.product.name}</h4>
                    <span style="font-size: 0.8rem; color: #7b624b; font-weight: 600; display: block; margin-bottom: 2px;">Box de 5 cookies</span>
                    <span class="cart-item-price">${formatPrice(item.product.price)}</span>
                </div>
                <div class="cart-item-qty-row">
                    <div class="qty-selector">
                        <button class="qty-btn dec-qty-btn" data-id="${item.product.id}" aria-label="Diminuer">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="qty-btn inc-qty-btn" data-id="${item.product.id}" aria-label="Augmenter">+</button>
                    </div>
                    <button class="cart-item-remove-btn" data-id="${item.product.id}" aria-label="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                </div>
            </div>
        `;
        cartItemsContainer.appendChild(itemEl);
    });

    // Subtotal
    cartSubtotalEl.textContent = formatPrice(subtotal);
    
    // Free Shipping calculation
    let shipping = SHIPPING_FEE;
    if (subtotal >= FREE_SHIPPING_THRESHOLD) {
        shipping = 0;
        shippingProgressText.innerHTML = `✨ Félicitations ! La livraison vous est <strong>OFFERTE</strong> !`;
        shippingProgressFill.style.width = "100%";
    } else {
        const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
        const progressPercent = (subtotal / FREE_SHIPPING_THRESHOLD) * 100;
        shippingProgressText.innerHTML = `Plus que <strong>${formatPrice(remaining)}</strong> pour la livraison offerte !`;
        shippingProgressFill.style.width = `${progressPercent}%`;
    }
    
    cartShippingFeeEl.textContent = shipping === 0 ? "Offerte" : formatPrice(shipping);
    
    // Total price
    const finalTotal = subtotal + shipping;
    cartTotalPriceEl.textContent = formatPrice(finalTotal);
    
    // Update checkout totals
    checkoutTotalBtn.textContent = formatPrice(finalTotal);
}

// -------------------------------------------------------------
// Event Handlers & State Modifiers
// -------------------------------------------------------------
function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.product.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            product: product,
            quantity: 1
        });
    }

    saveCartToLocalStorage();
    renderCart();
    toggleCart(true); // Auto-open sidebar on addition
}

function updateQuantity(productId, modifier) {
    const item = cart.find(item => item.product.id === productId);
    if (!item) return;

    item.quantity += modifier;
    
    if (item.quantity <= 0) {
        cart = cart.filter(item => item.product.id !== productId);
    }

    saveCartToLocalStorage();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    saveCartToLocalStorage();
    renderCart();
}

function toggleCart(isOpen) {
    if (isOpen) {
        cartSidebar.classList.add("active");
        cartOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    } else {
        cartSidebar.classList.remove("active");
        cartOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }
}

// -------------------------------------------------------------
// Interactive FAQ Accordion
// -------------------------------------------------------------
function setupFaqAccordion() {
    const faqItems = document.querySelectorAll(".faq-item");
    
    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            
            faqItems.forEach(otherItem => {
                otherItem.classList.remove("active");
            });
            
            if (!isActive) {
                item.classList.add("active");
            }
        });
    });
}

// -------------------------------------------------------------
// Success Modal 2D Shape Confetti & Cookie Rain Animation
// -------------------------------------------------------------
function triggerCookieRain() {
    if (!fallingCookiesContainer) return;
    fallingCookiesContainer.innerHTML = "";
    
    const shapeTypes = ["shape-cookie", "shape-confetti", "shape-star"];
    const colors = ["#ff5227", "#ffca50", "#6fa162", "#38bdf8", "#ec4899"];
    const count = 40;
    
    for (let i = 0; i < count; i++) {
        const element = document.createElement("div");
        const shape = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
        
        element.className = `falling-shape ${shape}`;
        
        // If it's confetti or star, assign a random vibrant color background
        if (shape === "shape-confetti" || shape === "shape-star") {
            element.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        }
        
        const left = Math.random() * 100;
        const delay = Math.random() * 1.5;
        const duration = Math.random() * 2.2 + 1.8; // fall speed
        const sizeScale = Math.random() * 0.5 + 0.75; // scaling scale(0.75) to scale(1.25)
        
        element.style.left = `${left}%`;
        element.style.animationDelay = `${delay}s`;
        element.style.animationDuration = `${duration}s`;
        element.style.transform = `scale(${sizeScale})`;
        
        fallingCookiesContainer.appendChild(element);
    }
}

// -------------------------------------------------------------
// Set up Event Listeners
// -------------------------------------------------------------
function setupEventListeners() {
    // Add to cart from listing
    if (productsGrid) {
        productsGrid.addEventListener("click", (e) => {
            if (e.target.classList.contains("add-to-cart-btn")) {
                const id = e.target.getAttribute("data-id");
                addToCart(id);
            }
        });
    }

    // Cart modification actions
    if (cartItemsContainer) {
        cartItemsContainer.addEventListener("click", (e) => {
            const removeBtn = e.target.closest(".cart-item-remove-btn");
            const incBtn = e.target.closest(".inc-qty-btn");
            const decBtn = e.target.closest(".dec-qty-btn");
            
            if (removeBtn) {
                removeFromCart(removeBtn.getAttribute("data-id"));
            } else if (incBtn) {
                updateQuantity(incBtn.getAttribute("data-id"), 1);
            } else if (decBtn) {
                updateQuantity(decBtn.getAttribute("data-id"), -1);
            }
        });
    }

    // Sidebar Toggles
    cartToggleBtn.addEventListener("click", () => toggleCart(true));
    cartCloseBtn.addEventListener("click", () => toggleCart(false));
    cartOverlay.addEventListener("click", () => toggleCart(false));
    continueShoppingBtn.addEventListener("click", () => toggleCart(false));

    // Open Checkout Modal
    checkoutBtn.addEventListener("click", () => {
        toggleCart(false);
        renderCheckoutSummary();
        checkoutModal.classList.add("active");
        document.body.style.overflow = "hidden";
    });

    // Close Checkout Modal
    checkoutCloseBtn.addEventListener("click", () => {
        checkoutModal.classList.remove("active");
        document.body.style.overflow = "";
    });

    // Handle Form Submission (WhatsApp Order Message Construction)
    checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const customerName = document.getElementById("first-name").value;
        const phone = document.getElementById("phone-number").value;
        const address = document.getElementById("address").value;
        const deliveryDateVal = document.getElementById("delivery-date").value;
        
        // Calculate costs
        let subtotal = 0;
        let itemsListText = "";
        
        cart.forEach((item, index) => {
            const itemPriceSum = item.product.price * item.quantity;
            subtotal += itemPriceSum;
            itemsListText += `${index + 1}. ${item.product.name} (Box de 5) x ${item.quantity} : ${formatPrice(itemPriceSum)}\n`;
        });
        
        let shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
        const total = subtotal + shipping;
        
        // Generate WhatsApp Message Template
        const formattedDate = formatDate(deliveryDateVal);
        const orderMessage = `Bonjour Shuukies Cotonou ! 🍪🇧🇯
Je souhaite passer une commande pour le lendemain.

Détails de ma commande :
-------------------------------------
${itemsListText}
-------------------------------------
Sous-total : ${formatPrice(subtotal)}
Livraison : ${shipping === 0 ? "Offerte" : formatPrice(shipping)}
Total : ${formatPrice(total)}

Informations de livraison :
- Client : ${customerName}
- Téléphone : ${phone}
- Adresse : ${address}
- Date de livraison souhaitée : ${formattedDate}
- Mode de paiement : Espèces à la livraison / Mobile Money

Merci de valider ma commande ! ❤️`;

        // URL encode the message
        const encodedText = encodeURIComponent(orderMessage);
        const whatsappUrl = `https://wa.me/${SHOP_WHATSAPP_NUMBER}?text=${encodedText}`;
        
        // Populate Success Modal Fields
        successCustomerName.textContent = customerName;
        successAddress.textContent = address;
        successTotal.textContent = formatPrice(total);
        successDeliveryDate.textContent = formattedDate;

        // Redirect user to WhatsApp in a new tab
        window.open(whatsappUrl, '_blank');

        // Clear cart in state & storage
        cart = [];
        saveCartToLocalStorage();
        renderCart();

        // Toggle Modals
        checkoutModal.classList.remove("active");
        successModal.classList.add("active");
        
        // Run confetti animation
        triggerCookieRain();
    });

    // Close success modal & resume shopping
    successCloseBtn.addEventListener("click", () => {
        successModal.classList.remove("active");
        document.body.style.overflow = "";
    });
}

// Render summary of cart items inside checkout modal
function renderCheckoutSummary() {
    const summaryList = document.getElementById("checkout-summary-list");
    if (!summaryList) return;
    summaryList.innerHTML = "";
    
    cart.forEach(item => {
        const itemEl = document.createElement("div");
        itemEl.style.display = "flex";
        itemEl.style.justify = "space-between";
        itemEl.style.alignItems = "center";
        itemEl.style.padding = "8px 0";
        itemEl.style.borderBottom = "1px dashed #cbd5e1";
        itemEl.style.fontSize = "0.95rem";
        
        itemEl.innerHTML = `
            <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight: 700; color: var(--color-text);">${item.product.name}</span> 
                <span style="font-size: 0.75rem; background: var(--color-secondary); color: var(--color-text); border: 2px solid var(--border-color); padding: 1px 6px; border-radius: 999px; font-weight: 700; box-shadow: 1px 1px 0 var(--border-color); white-space: nowrap;">Box de 5</span>
            </div>
            <div style="flex-shrink:0;">
                <span style="color: #666; font-size: 0.85rem;">x ${item.quantity}</span>
                <strong style="margin-left: 12px; color: var(--color-primary);">${formatPrice(item.product.price * item.quantity)}</strong>
            </div>
        `;
        summaryList.appendChild(itemEl);
    });
    
    let subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    let shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const finalTotal = subtotal + shipping;

    const summaryTotalEl = document.createElement("div");
    summaryTotalEl.style.display = "flex";
    summaryTotalEl.style.justify = "space-between";
    summaryTotalEl.style.alignItems = "center";
    summaryTotalEl.style.paddingTop = "12px";
    summaryTotalEl.style.marginTop = "4px";
    summaryTotalEl.style.fontWeight = "700";
    summaryTotalEl.style.fontSize = "1.05rem";
    
    summaryTotalEl.innerHTML = `
        <span>Total de la commande</span>
        <span style="color: var(--color-primary); font-size: 1.15rem;">${formatPrice(finalTotal)}</span>
    `;
    summaryList.appendChild(summaryTotalEl);
}
