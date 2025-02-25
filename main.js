// Main Shop Functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const itemList = document.getElementById('itemList');
    const basketItems = document.getElementById('basketItems');
    const basketCount = document.getElementById('basketCount');
    const basketItemsCount = document.getElementById('basketItemsCount');
    const basketGold = document.getElementById('basketGold');
    const basketSilver = document.getElementById('basketSilver');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeModal = document.getElementById('closeModal');
    const mailText = document.getElementById('mailText');
    const copyMailBtn = document.getElementById('copyMailBtn');
    const copySuccess = document.getElementById('copySuccess');
    const categoryTabs = document.querySelectorAll('.category-tab');
    
    // Shopping cart array to store selected items
    let cart = [];
    let currentCategory = 'all';
    
    // Display items based on the current category
    function displayItems(category) {
        // Clear the item list
        itemList.innerHTML = '';
        
        // Show all items or filter by category
        let items = [];
        if (category === 'all') {
            shopInventory.categories.forEach(cat => {
                items = items.concat(cat.items.map(item => ({...item, category: cat.id})));
            });
        } else {
            const categoryData = shopInventory.categories.find(cat => cat.id === category);
            if (categoryData) {
                items = categoryData.items.map(item => ({...item, category: category}));
            }
        }
        
        // Create item cards
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = `item-card ${item.quality}`;
            itemCard.innerHTML = `
                <div class="item-header">
                    <img class="item-icon" src="https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg" alt="${item.name}">
                    <div class="item-name" data-wowhead="item=${item.id}">${item.name}</div>
                </div>
                <div class="item-details">
                    <div class="item-price">
                        <span>${item.price.gold}</span>
                        <span class="gold-icon"></span>
                        <span>${item.price.silver}</span>
                        <span class="silver-icon"></span>
                    </div>
                    <div class="item-stock">In stock: ${item.stock}</div>
                    ${item.unique ? '<div style="color: #ff8c00; font-size: 0.8rem;">Unique Item</div>' : ''}
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn qty-minus" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" min="1" max="${item.stock}" value="1" data-id="${item.id}">
                        <button class="quantity-btn qty-plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${item.id}" data-category="${item.category}">
                        Add to Cart
                    </button>
                </div>
            `;
            itemList.appendChild(itemCard);
            
            // Add event listeners for quantity buttons
            const minusBtn = itemCard.querySelector('.qty-minus');
            const plusBtn = itemCard.querySelector('.qty-plus');
            const qtyInput = itemCard.querySelector('.quantity-input');
            
            minusBtn.addEventListener('click', function() {
                if (parseInt(qtyInput.value) > 1) {
                    qtyInput.value = parseInt(qtyInput.value) - 1;
                }
            });
            
            plusBtn.addEventListener('click', function() {
                if (parseInt(qtyInput.value) < parseInt(qtyInput.max)) {
                    qtyInput.value = parseInt(qtyInput.value) + 1;
                }
            });
            
            // Add event listener for add to cart button
            const addToCartBtn = itemCard.querySelector('.add-to-cart');
            addToCartBtn.addEventListener('click', function() {
                const itemId = this.dataset.id;
                const itemCategory = this.dataset.category;
                const quantity = parseInt(qtyInput.value);
                
                // Find item in inventory
                const category = shopInventory.categories.find(cat => cat.id === itemCategory);
                const item = category.items.find(i => i.id === itemId);
                
                // Check if already in cart
                const existingItem = cart.find(cartItem => cartItem.id === itemId);
                
                if (existingItem) {
                    // Check if adding would exceed stock
                    if (existingItem.quantity + quantity <= item.stock) {
                        existingItem.quantity += quantity;
                    } else {
                        existingItem.quantity = item.stock; // Set to max available
                        alert(`You can only add ${item.stock} of this item to your cart.`);
                    }
                } else {
                    // Add new item to cart
                    cart.push({
                        id: item.id,
                        name: item.name,
                        price: {...item.price},
                        quantity: quantity,
                        category: itemCategory,
                        quality: item.quality,
                        stock: item.stock
                    });
                }
                
                // Update the cart display
                updateCartDisplay();
            });
        });
        
        // Load Wowhead tooltips
        if (window.$WowheadPower) {
            window.$WowheadPower.refreshLinks();
        }
    }
    
    // Update cart display
    function updateCartDisplay() {
        // Clear current display
        basketItems.innerHTML = '';
        
        if (cart.length === 0) {
            basketItems.innerHTML = '<div class="empty-basket-message">Your basket is empty</div>';
            basketCount.textContent = '0';
            basketItemsCount.textContent = '0';
            basketGold.textContent = '0';
            basketSilver.textContent = '0';
            return;
        }
        
        // Count total items and cost
        let totalItems = 0;
        let totalGold = 0;
        let totalSilver = 0;
        
        cart.forEach(item => {
            // Create cart item element
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'basket-item';
            
            // Calculate item total
            const itemTotalSilver = item.price.total * item.quantity;
            const itemGold = Math.floor(itemTotalSilver / 100);
            const itemSilver = itemTotalSilver % 100;
            
            cartItemEl.innerHTML = `
                <div class="basket-item-info">
                    <div class="basket-item-name ${item.quality}" data-wowhead="item=${item.id}">${item.name}</div>
                    <div class="basket-item-price">
                        <span>${item.price.gold}</span>
                        <span class="gold-icon"></span>
                        <span>${item.price.silver}</span>
                        <span class="silver-icon"></span>
                        × ${item.quantity} = 
                        <span>${itemGold}</span>
                        <span class="gold-icon"></span>
                        <span>${itemSilver}</span>
                        <span class="silver-icon"></span>
                    </div>
                    <div class="basket-item-quantity">
                        <button class="basket-quantity-btn basket-qty-minus" data-id="${item.id}">-</button>
                        <input type="number" class="basket-quantity-input" min="1" max="${item.stock}" value="${item.quantity}" data-id="${item.id}">
                        <button class="basket-quantity-btn basket-qty-plus" data-id="${item.id}">+</button>
                    </div>
                </div>
                <button class="basket-item-remove" data-id="${item.id}">×</button>
            `;
            
            basketItems.appendChild(cartItemEl);
            
            // Add event listeners for cart quantity
            const minusBtn = cartItemEl.querySelector('.basket-qty-minus');
            const plusBtn = cartItemEl.querySelector('.basket-qty-plus');
            const qtyInput = cartItemEl.querySelector('.basket-quantity-input');
            const removeBtn = cartItemEl.querySelector('.basket-item-remove');
            
            minusBtn.addEventListener('click', function() {
                const itemId = this.dataset.id;
                const cartItem = cart.find(item => item.id === itemId);
                
                if (cartItem.quantity > 1) {
                    cartItem.quantity--;
                    updateCartDisplay();
                }
            });
            
            plusBtn.addEventListener('click', function() {
                const itemId = this.dataset.id;
                const cartItem = cart.find(item => item.id === itemId);
                
                if (cartItem.quantity < cartItem.stock) {
                    cartItem.quantity++;
                    updateCartDisplay();
                }
            });
            
            qtyInput.addEventListener('change', function() {
                const itemId = this.dataset.id;
                const cartItem = cart.find(item => item.id === itemId);
                const newQty = parseInt(this.value);
                
                if (newQty > 0 && newQty <= cartItem.stock) {
                    cartItem.quantity = newQty;
                } else if (newQty > cartItem.stock) {
                    cartItem.quantity = cartItem.stock;
                } else {
                    cartItem.quantity = 1;
                }
                
                updateCartDisplay();
            });
            
            removeBtn.addEventListener('click', function() {
                const itemId = this.dataset.id;
                cart = cart.filter(item => item.id !== itemId);
                updateCartDisplay();
            });
            
            // Update totals
            totalItems += item.quantity;
            totalSilver += itemTotalSilver;
        });
        
        // Update basket counts and totals
        totalGold = Math.floor(totalSilver / 100);
        totalSilver = totalSilver % 100;
        
        basketCount.textContent = totalItems;
        basketItemsCount.textContent = totalItems;
        basketGold.textContent = totalGold;
        basketSilver.textContent = totalSilver;
        
        // Refresh Wowhead tooltips
        if (window.$WowheadPower) {
            window.$WowheadPower.refreshLinks();
        }
    }
    
    // Generate in-game mail text
    function generateMailText() {
        const date = new Date().toLocaleDateString();
        let text = `ORDER - ${date}\n\n`;
        
        // Add items
        cart.forEach(item => {
            const itemTotalSilver = item.price.total * item.quantity;
            const itemGold = Math.floor(itemTotalSilver / 100);
            const itemSilver = itemTotalSilver % 100;
            
            text += `${item.name} x${item.quantity} (${item.price.gold}g ${item.price.silver}s each) = ${itemGold}g ${itemSilver}s\n`;
        });
        
        // Add total
        let totalSilver = 0;
        cart.forEach(item => {
            totalSilver += item.price.total * item.quantity;
        });
        
        const totalGold = Math.floor(totalSilver / 100);
        const remainingSilver = totalSilver % 100;
        
        text += `\nTOTAL: ${totalGold} gold and ${remainingSilver} silver`;
        text += `\n\nPlease send payment with this mail. Items will be mailed or traded upon payment confirmation.`;
        
        return text;
    }
    
    // Initialize the shop
    function init() {
        // Display all items initially
        displayItems('all');
        
        // Add event listeners for category tabs
        categoryTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // Update active tab
                categoryTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update items display
                currentCategory = this.dataset.category;
                displayItems(currentCategory);
            });
        });
        
        // Checkout button
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) {
                alert('Your basket is empty!');
                return;
            }
            
            mailText.textContent = generateMailText();
            checkoutModal.classList.add('active');
        });
        
        // Close modal
        closeModal.addEventListener('click', function() {
            checkoutModal.classList.remove('active');
        });
        
        // Copy mail text
        copyMailBtn.addEventListener('click', function() {
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = mailText.textContent;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);
            
            copySuccess.classList.add('show');
            setTimeout(() => {
                copySuccess.classList.remove('show');
            }, 2000);
        });
        
        // Close modal when clicking outside
        checkoutModal.addEventListener('click', function(e) {
            if (e.target === checkoutModal) {
                checkoutModal.classList.remove('active');
            }
        });
    }
    
    // Initialize the shop
    init();
});