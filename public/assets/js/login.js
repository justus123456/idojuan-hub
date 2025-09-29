 document.addEventListener('DOMContentLoaded', function() {
            const form = document.getElementById('authForm');
            const passwordInput = document.getElementById('password');
            const strengthBar = document.getElementById('strengthBar');
            const strengthText = document.getElementById('strengthText');
            const passwordToggle = document.getElementById('passwordToggle');
            const submitBtn = document.getElementById('submitBtn');
            const errorMessage = document.getElementById('errorMessage');
            const successMessage = document.getElementById('successMessage');
            const otpContainer = document.getElementById('otpContainer');
            const rememberMeCheckbox = document.getElementById('rememberMe');
            const otpInputs = document.querySelectorAll('.otp-input');

            // Password visibility toggle
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.type === 'password' ? 'text' : 'password';
                passwordInput.type = type;
                passwordToggle.className = `far ${type === 'password' ? 'fa-eye' : 'fa-eye-slash'} password-toggle`;
            });

            // Password strength meter
            passwordInput.addEventListener('input', () => {
                const password = passwordInput.value;
                let strength = 0;
                let message = '';

                if (password.length >= 8) strength += 25;
                if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength += 25;
                if (password.match(/\d/)) strength += 25;
                if (password.match(/[^a-zA-Z\d]/)) strength += 25;

                strengthBar.style.width = `${strength}%`;
                
                if (strength <= 25) {
                    strengthBar.style.backgroundColor = '#ef4444';
                    message = 'Weak';
                } else if (strength <= 50) {
                    strengthBar.style.backgroundColor = '#f97316';
                    message = 'Fair';
                } else if (strength <= 75) {
                    strengthBar.style.backgroundColor = '#22c55e';
                    message = 'Good';
                } else {
                    strengthBar.style.backgroundColor = '#15803d';
                    message = 'Strong';
                }

                strengthText.textContent = `Password Strength: ${message}`;
            });

            // Remember me toggle
            rememberMeCheckbox.addEventListener('click', () => {
                rememberMeCheckbox.classList.toggle('checked');
            });

            // OTP input handling
            otpInputs.forEach(input => {
                input.addEventListener('input', (e) => {
                    if (e.target.value) {
                        const next = e.target.dataset.index;
                        if (next < 4) {
                            otpInputs[next].focus();
                        }
                    }
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value) {
                        const prev = e.target.dataset.index - 2;
                        if (prev >= 0) {
                            otpInputs[prev].focus();
                        }
                    }
                });
            });

            // Form submission handling
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const email = document.getElementById('email').value;
                const password = passwordInput.value;
                const rememberMe = rememberMeCheckbox.classList.contains('checked');

                // Validate email
                const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailPattern.test(email)) {
                    showError('Please enter a valid email address');
                    return;
                }

                // Validate password
                if (password.length < 8) {
                    showError('Password must be at least 8 characters long');
                    return;
                }

                // Show loading state
                submitBtn.disabled = true;
                submitBtn.querySelector('span').style.opacity = '0';
                submitBtn.querySelector('.loader').style.display = 'block';

                try {
                    // Simulate API call
                    await new Promise(resolve => setTimeout(resolve, 2000));

                    // Simulate successful authentication
                    showSuccess('Authentication successful! Sending OTP...');
                    
                    // Show OTP container
                    setTimeout(() => {
                        otpContainer.style.display = 'block';
                        otpContainer.classList.add('slide-up');
                        otpInputs[0].focus();
                    }, 1000);

                } catch (error) {
                    showError('Authentication failed. Please try again.');
                } finally {
                    // Reset button state
                    submitBtn.disabled = false;
                    submitBtn.querySelector('span').style.opacity = '1';
                    submitBtn.querySelector('.loader').style.display = 'none';
                }
            });

            // Social sign-in handling
            window.socialSignIn = (provider) => {
                const providers = {
                    google: { color: '#ea4335', icon: 'google' },
                    facebook: { color: '#1877f2', icon: 'facebook-f' },
                    apple: { color: '#000000', icon: 'apple' }
                };

                const button = document.querySelector(`.social-button i.fa-${providers[provider].icon}`).parentElement;
                const originalColor = window.getComputedStyle(button).backgroundColor;
                
                button.style.backgroundColor = providers[provider].color;
                button.style.color = 'white';

                setTimeout(() => {
                    button.style.backgroundColor = originalColor;
                    button.style.color = '#374151';
                }, 200);

                showSuccess(`Redirecting to ${provider} login...`);
            };

            // OTP resend handling
            window.resendOTP = () => {
                showSuccess('New OTP has been sent to your email');
                
                // Reset OTP inputs
                otpInputs.forEach(input => {
                    input.value = '';
                });
                otpInputs[0].focus();
            };

            // Form toggle (Sign In / Sign Up)
            window.toggleForm = () => {
                const header = document.querySelector('.form-header h1');
                const switchText = document.querySelector('.switch-form');
                const submitBtn = document.querySelector('.submit-btn span');
                const isSignUp = header.textContent === 'Sign In';

                // Animate form transition
                document.querySelector('.auth-form').classList.add('fade-in');
                
                if (isSignUp) {
                    header.textContent = 'Sign Up';
                    submitBtn.textContent = 'Create Account';
                    switchText.innerHTML = 'Already have an account? <a href="#" onclick="toggleForm()">Sign In</a>';
                } else {
                    header.textContent = 'Sign In';
                    submitBtn.textContent = 'Sign In';
                    switchText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleForm()">Sign Up</a>';
                }

                // Reset form
                form.reset();
                strengthBar.style.width = '0';
                strengthText.textContent = '';
                otpContainer.style.display = 'none';
                errorMessage.style.display = 'none';
                successMessage.style.display = 'none';
            };

            // Utility functions
            function showError(message) {
                errorMessage.textContent = message;
                errorMessage.style.display = 'block';
                successMessage.style.display = 'none';
                form.classList.add('shake');
                setTimeout(() => form.classList.remove('shake'), 400);
            }

            function showSuccess(message) {
                successMessage.textContent = message;
                successMessage.style.display = 'block';
                errorMessage.style.display = 'none';
            }

            // Password requirements tooltip
            const passwordTooltip = document.createElement('div');
            passwordTooltip.className = 'password-tooltip';
            passwordTooltip.style.cssText = `
                position: absolute;
                background: white;
                padding: 10px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                display: none;
                z-index: 100;
                width: 200px;
                font-size: 0.9em;
                color: #6b7280;
            `;
            passwordTooltip.innerHTML = `
                Password must contain:<br>
                - At least 8 characters<br>
                - Upper & lowercase letters<br>
                - Numbers<br>
                - Special characters
            `;

            passwordInput.parentElement.appendChild(passwordTooltip);

            passwordInput.addEventListener('focus', () => {
                passwordTooltip.style.display = 'block';
            });

            passwordInput.addEventListener('blur', () => {
                passwordTooltip.style.display = 'none';
            });
        });
