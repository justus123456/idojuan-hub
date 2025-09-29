 // Material data with Nigerian Naira prices
        const materials = [
            { id: 1, name: "Cement", price: 3500, unit: "bag" },
            { id: 2, name: "Sand", price: 20000, unit: "ton" },
            { id: 3, name: "Gravel", price: 25000, unit: "ton" },
            { id: 4, name: "Bricks", price: 150, unit: "piece" },
            { id: 5, name: "Steel Rebar", price: 4500, unit: "meter" },
            { id: 6, name: "Concrete Mix", price: 50000, unit: "cubic yard" },
            { id: 7, name: "Roofing Sheets", price: 3500, unit: "sheet" },
            { id: 8, name: "Paint", price: 8500, unit: "gallon" },
            { id: 9, name: "Nails", price: 250, unit: "kg" },
            { id: 10, name: "Electrical Wires", price: 1200, unit: "meter" }
        ];

        // Order data
        let orderItems = [];
        let selectedMaterial = null;
        let selectedQuality = 'standard';
        let qualityMultiplier = 1;
        let quantity = 1;

        // DOM elements
        const materialItems = document.querySelectorAll('.material-item');
        const selectedMaterialEl = document.getElementById('selected-material');
        const qualityGroup = document.getElementById('quality-group');
        const qualityOptions = document.querySelectorAll('.quality-option');
        const quantityValueEl = document.getElementById('quantity-value');
        const manualQuantityInput = document.getElementById('manual-quantity-input');
        const basePriceEl = document.getElementById('base-price');
        const qualityMultiplierEl = document.getElementById('quality-multiplier');
        const unitPriceEl = document.getElementById('unit-price');
        const calcQuantityEl = document.getElementById('calc-quantity');
        const totalPriceEl = document.getElementById('total-price');
        const decreaseBtn = document.getElementById('decrease-btn');
        const increaseBtn = document.getElementById('increase-btn');
        const addToOrderBtn = document.getElementById('add-to-order');
        const orderItemsEl = document.getElementById('order-items');
        const orderTotalsEl = document.getElementById('order-totals');
        const totalItemsEl = document.getElementById('total-items');
        const orderTotalEl = document.getElementById('order-total');
        const placeOrderBtn = document.getElementById('place-order');
        const clearOrderBtn = document.getElementById('clear-order');
        const notification = document.getElementById('notification');
        const notificationText = document.getElementById('notification-text');

        // Initialize
        updateCalculator();

        // Format currency in Naira
        function formatNaira(amount) {
            return '₦' + amount.toLocaleString('en-NG') + '.00';
        }

        // Material selection
        materialItems.forEach(item => {
            item.addEventListener('click', function() {
                // Remove previous selection
                materialItems.forEach(el => el.classList.remove('selected'));
                
                // Add selection to clicked item
                this.classList.add('selected');
                
                // Set selected material
                const materialId = parseInt(this.dataset.id);
                selectedMaterial = materials.find(m => m.id === materialId);
                
                // Show quality options
                qualityGroup.style.display = 'block';
                
                // Reset quality to standard
                qualityOptions.forEach(opt => opt.classList.remove('selected'));
                document.querySelector('.quality-option[data-quality="standard"]').classList.add('selected');
                selectedQuality = 'standard';
                qualityMultiplier = 1;
                
                // Reset quantity
                quantity = 1;
                quantityValueEl.textContent = quantity;
                manualQuantityInput.value = quantity;
                
                // Update calculator
                updateCalculator();
            });
        });

        // Quality selection
        qualityOptions.forEach(option => {
            option.addEventListener('click', function() {
                // Remove previous selection
                qualityOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selection to clicked option
                this.classList.add('selected');
                
                // Set selected quality
                selectedQuality = this.dataset.quality;
                qualityMultiplier = parseFloat(this.dataset.multiplier);
                
                // Update calculator
                updateCalculator();
            });
        });

        // Quantity controls
        decreaseBtn.addEventListener('click', function() {
            if (quantity > 1) {
                quantity--;
                quantityValueEl.textContent = quantity;
                manualQuantityInput.value = quantity;
                updateCalculator();
            }
        });

        increaseBtn.addEventListener('click', function() {
            quantity++;
            quantityValueEl.textContent = quantity;
            manualQuantityInput.value = quantity;
            updateCalculator();
        });

        // Manual quantity input
        manualQuantityInput.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value >= 1) {
                quantity = value;
                quantityValueEl.textContent = quantity;
                updateCalculator();
            }
        });

        // Add to order
        addToOrderBtn.addEventListener('click', function() {
            if (selectedMaterial) {
                // Calculate total price with quality multiplier
                const unitPrice = selectedMaterial.price * qualityMultiplier;
                const totalPrice = unitPrice * quantity;
                
                // Add item to order
                orderItems.push({
                    id: Date.now(),
                    material: selectedMaterial,
                    quality: selectedQuality,
                    qualityMultiplier: qualityMultiplier,
                    quantity: quantity,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice
                });
                
                // Update order display
                updateOrderDisplay();
                
                // Show notification
                showNotification(`${selectedMaterial.name} (${selectedQuality}) added to order!`);
                
                // Reset calculator
                quantity = 1;
                quantityValueEl.textContent = quantity;
                manualQuantityInput.value = quantity;
                updateCalculator();
            }
        });

        // Place order
        placeOrderBtn.addEventListener('click', function() {
            if (orderItems.length > 0) {
                showNotification('Order placed successfully! Payment in Naira will be processed.');
                orderItems = [];
                updateOrderDisplay();
            }
        });

        // Clear order
        clearOrderBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear your order?')) {
                orderItems = [];
                updateOrderDisplay();
                showNotification('Order cleared!');
            }
        });

        // Update calculator display
        function updateCalculator() {
            if (selectedMaterial) {
                const basePrice = selectedMaterial.price;
                const unitPrice = basePrice * qualityMultiplier;
                const totalPrice = unitPrice * quantity;
                
                selectedMaterialEl.textContent = `${selectedMaterial.name} (${formatNaira(basePrice)}/${selectedMaterial.unit})`;
                basePriceEl.textContent = formatNaira(basePrice);
                qualityMultiplierEl.textContent = qualityMultiplier + 'x';
                unitPriceEl.textContent = formatNaira(unitPrice);
                calcQuantityEl.textContent = `${quantity} ${selectedMaterial.unit}${quantity > 1 ? 's' : ''}`;
                totalPriceEl.textContent = formatNaira(totalPrice);
            } else {
                selectedMaterialEl.textContent = 'No material selected';
                basePriceEl.textContent = '₦0.00';
                qualityMultiplierEl.textContent = '1x';
                unitPriceEl.textContent = '₦0.00';
                calcQuantityEl.textContent = '1';
                totalPriceEl.textContent = '₦0.00';
            }
        }

        // Update order display
        function updateOrderDisplay() {
            if (orderItems.length === 0) {
                orderItemsEl.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Your order is empty. Add materials to see them here.</p>
                    </div>
                `;
                orderTotalsEl.style.display = 'none';
                placeOrderBtn.style.display = 'none';
                clearOrderBtn.style.display = 'none';
            } else {
                // Render order items
                orderItemsEl.innerHTML = orderItems.map(item => `
                    <div class="order-item">
                        <div class="order-item-info">
                            <div class="order-item-name">
                                ${item.material.name}
                                <span class="order-item-quality quality-${item.quality}">${item.quality}</span>
                            </div>
                            <div class="order-item-details">
                                ${item.quantity} ${item.material.unit}${item.quantity > 1 ? 's' : ''} @ ${formatNaira(item.unitPrice)}/${item.material.unit}
                            </div>
                        </div>
                        <div class="order-item-price">${formatNaira(item.totalPrice)}</div>
                    </div>
                `).join('');
                
                // Calculate totals
                const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0);
                const orderTotal = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
                
                // Update totals display
                totalItemsEl.textContent = totalItems;
                orderTotalEl.textContent = formatNaira(orderTotal);
                
                // Show totals and buttons
                orderTotalsEl.style.display = 'block';
                placeOrderBtn.style.display = 'inline-block';
                clearOrderBtn.style.display = 'inline-block';
            }
        }

        // Show notification
        function showNotification(message) {
            notificationText.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }