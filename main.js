// Main Shop Functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Shop script loaded! - version: 20250226-1");
    
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
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const sortSelect = document.getElementById('sortSelect');
    
    // Shopping cart array to store selected items
    let cart = [];
    let currentCategory = 'all';
    let searchTerm = '';
    let currentSort = 'name-asc';
    
    // Display items based on the current category, search term, and sort order
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
        
        // Filter by search term if present
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            items = items.filter(item => 
                item.name.toLowerCase().includes(term)
            );
        }
        
        // Sort items
        sortItems(items);
        
        // If no items found, show message
        if (items.length === 0) {
            itemList.innerHTML = '<div class="no-items-message">No items found. Try a different search or category.</div>';
            return;
        }
        
        // Create item cards
        items.forEach(item => {
            const itemCard = document.createElement('div');
            itemCard.className = `item-card ${item.quality}`;
            itemCard.innerHTML = `
                <div class="item-header">
                    <div class="item-name">
                        <a href="https://www.wowhead.com/classic/item=${item.id}" 
                           data-wowhead="item=${item.id}&domain=classic" 
                           class="wowhead-link" 
                           target="_blank">${item.name}</a>
                    </div>
                </div>
                <div class="item-details">
                    <div class="item-price-stock">
                        <div class="item-price">
                            ${item.price.gold}<span class="gold-icon"></span>
                            ${item.price.silver}<span class="silver-icon"></span>
                        </div>
                        <div class="item-stock">In stock: ${item.stock}</div>
                        ${item.unique ? '<div style="color: #ff8c00; font-size: 0.8rem;">Unique Item</div>' : ''}
                    </div>
                </div>
                <div class="item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn qty-minus" data-id="${item.id}">-</button>
                        <input type="number" class="quantity-input" min="1" max="${item.stock}" value="1" data-id="${item.id}">
                        <button class="quantity-btn qty-plus" data-id="${item.id}">+</button>
                    </div>
                    <button class="add-to-cart" data-id="${item.id}" data-category="${item.category}">
                        ADD TO CART
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
        
        // Refresh Wowhead tooltips
        if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
            setTimeout(function() {
                window.$WowheadPower.refreshLinks();
            }, 100);
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
                    <div class="basket-item-details">
                        <div class="basket-item-name ${item.quality}">
                            <a href="https://www.wowhead.com/classic/item=${item.id}" 
                               data-wowhead="item=${item.id}&domain=classic" 
                               class="wowhead-link" 
                               target="_blank">${item.name}</a>
                        </div>
                        <div class="basket-item-actions">
                            <div class="basket-quantity-controls">
                                <button class="basket-quantity-btn basket-qty-minus" data-id="${item.id}">-</button>
                                <input type="number" class="basket-quantity-input" min="1" max="${item.stock}" value="${item.quantity}" data-id="${item.id}">
                                <button class="basket-quantity-btn basket-qty-plus" data-id="${item.id}">+</button>
                            </div>
                            <div class="basket-item-total" title="Price per item: ${item.price.gold}g ${item.price.silver}s">
                                <span>${itemGold}</span>
                                <span class="gold-icon"></span>
                                <span>${itemSilver}</span>
                                <span class="silver-icon"></span>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="basket-item-remove" data-id="${item.id}" title="Remove item">×</button>
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
        const totalGold = Math.floor(totalSilver / 100);
        const remainingSilver = totalSilver % 100;
        
        basketCount.textContent = totalItems;
        basketItemsCount.textContent = totalItems;
        basketGold.textContent = totalGold;
        basketSilver.textContent = remainingSilver;
        
        // Refresh Wowhead tooltips
        if (window.$WowheadPower && window.$WowheadPower.refreshLinks) {
            setTimeout(function() {
                window.$WowheadPower.refreshLinks();
            }, 100);
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
        
        return text;
    }
    
    // Sort items based on current sort selection
    function sortItems(items) {
        const rarityOrder = {
            'common': 1,
            'uncommon': 2,
            'rare': 3,
            'epic': 4,
            'legendary': 5
        };
        
        switch(currentSort) {
            case 'name-asc':
                items.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                items.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price-asc':
                items.sort((a, b) => a.price.total - b.price.total);
                break;
            case 'price-desc':
                items.sort((a, b) => b.price.total - a.price.total);
                break;
            case 'rarity-desc':
                items.sort((a, b) => rarityOrder[b.quality] - rarityOrder[a.quality]);
                break;
            case 'rarity-asc':
                items.sort((a, b) => rarityOrder[a.quality] - rarityOrder[b.quality]);
                break;
        }
        return items;
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
        
        // Search functionality
        searchInput.addEventListener('input', function() {
            searchTerm = this.value.trim();
            console.log("Search term:", searchTerm); // Debug logging
            
            if (searchTerm) {
                searchClearBtn.style.display = 'block';
            } else {
                searchClearBtn.style.display = 'none';
            }
            
            displayItems(currentCategory);
        });
        
        searchClearBtn.addEventListener('click', function() {
            searchInput.value = '';
            searchTerm = '';
            this.style.display = 'none';
            displayItems(currentCategory);
        });
        
        // Sort functionality
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            displayItems(currentCategory);
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
    
    // Update cart display initially
    updateCartDisplay();
});