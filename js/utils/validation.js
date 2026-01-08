/**
 * Validation Utility
 * Common validation functions for forms
 */

const Validation = {
    // Check if value is not empty
    required: (value) => {
        return value !== null && value !== undefined && value.trim() !== '';
    },

    // Check if value is a valid email
    email: (value) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    },

    // Check minimum length
    minLength: (value, min) => {
        return value.length >= min;
    },

    // Check if value is a number
    isNumber: (value) => {
        return !isNaN(parseFloat(value)) && isFinite(value);
    },

    // Show error message on input
    showError: (elementId, message) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        // Find error container (assuming sibling or specific ID convention)
        const errorId = element.id.replace('Input', 'Error').replace('Field', 'Error');
        let errorElement = document.getElementById(errorId);

        // If exact ID match fails, look for .form-error sibling
        if (!errorElement) {
            errorElement = element.parentNode.querySelector('.form-error');
        }

        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }

        element.classList.add('error');
    },

    // Clear error
    clearError: (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return;

        const errorId = element.id.replace('Input', 'Error').replace('Field', 'Error');
        let errorElement = document.getElementById(errorId);

        if (!errorElement) {
            errorElement = element.parentNode.querySelector('.form-error');
        }

        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }

        element.classList.remove('error');
    }
};
