// royal-epic-theme.js

/**
 * Wraps widgets with decorative borders for the Royal Epic theme.
 * It finds all standard widgets, moves their content into a new wrapper,
 * and then injects the HTML for the corner and edge border pieces.
 */
function wrapWidgetsForRoyalTheme() {
    // Select all widgets that haven't already been wrapped to prevent duplication
    const widgets = document.querySelectorAll('.widget:not(.royal-wrapped), .header-widget:not(.royal-wrapped)');
    
    widgets.forEach(widget => {
        // Exclude widgets that are part of the search bar or quick links
        if (widget.closest('.search-area') || widget.closest('.quick-links-bar')) {
            return;
        }

        widget.classList.add('royal-wrapped');
        
        // Create a new div to hold the widget's original content
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'royal-widget-content';
        
        // Move all of the widget's children into the new content wrapper
        while (widget.firstChild) {
            contentWrapper.appendChild(widget.firstChild);
        }
        
        // Place the content wrapper back inside the main widget container
        widget.appendChild(contentWrapper);

        // Define the HTML for all the border elements
        const borderHTML = `
            <div class="royal-border top-left"></div>
            <div class="royal-border top-right"></div>
            <div class="royal-border bottom-left"></div>
            <div class="royal-border bottom-right"></div>
            <div class="royal-border top-edge"></div>
            <div class="royal-border bottom-edge"></div>
            <div class="royal-border left-edge"></div>
            <div class="royal-border right-edge"></div>
        `;
        // Add the border elements to the main widget container
        widget.insertAdjacentHTML('afterbegin', borderHTML);
    });
}

/**
 * Cleans up the DOM by removing the decorative borders and wrappers
 * when switching away from the Royal Epic theme.
 */
function unwrapWidgetsForRoyalTheme() {
    const wrappedWidgets = document.querySelectorAll('.royal-wrapped');
    
    wrappedWidgets.forEach(widget => {
        widget.classList.remove('royal-wrapped');
        
        const contentWrapper = widget.querySelector('.royal-widget-content');
        if (contentWrapper) {
            // Move content from the wrapper back to the main widget container
            while (contentWrapper.firstChild) {
                widget.appendChild(contentWrapper.firstChild);
            }
            // Remove the now-empty content wrapper
            widget.removeChild(contentWrapper);
        }

        // Remove all the border elements
        const borders = widget.querySelectorAll('.royal-border');
        borders.forEach(border => border.remove());
    });
}

/**
 * Sets the icons for the quick links, prioritizing custom theme icons
 * over favicons when available.
 */
function setRoyalEpicQuickLinkIcons() {
    const quickLinks = document.querySelectorAll('#quick-links .link-item');
    quickLinks.forEach(link => {
        const iconContainer = link.querySelector('.link-icon');
        const linkNameElement = link.querySelector('.link-name');
        if (!iconContainer || !linkNameElement) return;

        const iconName = linkNameElement.textContent.toLowerCase().replace(/\s+/g, '');
        const customIconPath = `royal/icons/${iconName}.png`;
        const fallbackIcon = 'royal/icons/empty.png';
        const favicon = iconContainer.querySelector('img');

        // Check if the custom icon exists
        const img = new Image();
        img.src = customIconPath;
        img.onload = function() {
            // If it exists, use it and hide the original favicon
            iconContainer.style.backgroundImage = `url('${customIconPath}')`;
            if (favicon) favicon.style.display = 'none';
        }
        img.onerror = function() {
            // If it doesn't exist, use the empty frame and show the favicon inside
            iconContainer.style.backgroundImage = `url('${fallbackIcon}')`;
            if (favicon) {
                favicon.style.display = 'block';
                favicon.classList.add('favicon');
            }
        }
    });
}
