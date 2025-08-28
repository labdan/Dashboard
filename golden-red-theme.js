// golden-red-theme.js

/**
 * Wraps widgets with decorative borders for the Golden Red theme.
 * It finds all standard widgets, moves their content into a new wrapper,
 * and then injects the HTML for the corner and edge border pieces.
 */
function wrapWidgetsForGoldenRedTheme() {
    // Select all widgets that haven't already been wrapped to prevent duplication
    const widgets = document.querySelectorAll('.widget:not(.golden-red-wrapped), .header-widget:not(.golden-red-wrapped)');

    widgets.forEach(widget => {
        // Exclude widgets that are part of the search bar or quick links if they have custom styling
        if (widget.closest('.search-area') || widget.closest('.quick-links-bar')) {
            return;
        }

        widget.classList.add('golden-red-wrapped');

        // Create a new div to hold the widget's original content
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'golden-red-widget-content';

        // Move all of the widget's children into the new content wrapper
        while (widget.firstChild) {
            contentWrapper.appendChild(widget.firstChild);
        }

        // Place the content wrapper back inside the main widget container
        widget.appendChild(contentWrapper);

        // Define the HTML for all the border elements
        const borderHTML = `
            <div class="golden-red-border top-left"></div>
            <div class="golden-red-border top-right"></div>
            <div class="golden-red-border bottom-left"></div>
            <div class="golden-red-border bottom-right"></div>
            <div class="golden-red-border top-edge"></div>
            <div class="golden-red-border bottom-edge"></div>
            <div class="golden-red-border left-edge"></div>
            <div class="golden-red-border right-edge"></div>
        `;
        // Add the border elements to the main widget container
        widget.insertAdjacentHTML('afterbegin', borderHTML);
    });
}

/**
 * Cleans up the DOM by removing the decorative borders and wrappers
 * when switching away from the Golden Red theme.
 */
function unwrapWidgetsForGoldenRedTheme() {
    const wrappedWidgets = document.querySelectorAll('.golden-red-wrapped');

    wrappedWidgets.forEach(widget => {
        widget.classList.remove('golden-red-wrapped');

        const contentWrapper = widget.querySelector('.golden-red-widget-content');
        if (contentWrapper) {
            // Move content from the wrapper back to the main widget container
            while (contentWrapper.firstChild) {
                widget.appendChild(contentWrapper.firstChild);
            }
            // Remove the now-empty content wrapper
            widget.removeChild(contentWrapper);
        }

        // Remove all the border elements
        const borders = widget.querySelectorAll('.golden-red-border');
        borders.forEach(border => border.remove());
    });
}

/**
 * Sets the icons for the quick links, prioritizing custom theme icons
 * over favicons when available. (Adjusted for golden-red theme)
 */
function setGoldenRedQuickLinkIcons() {
    const quickLinks = document.querySelectorAll('#quick-links .link-item');
    quickLinks.forEach(link => {
        const iconContainer = link.querySelector('.link-icon');
        const linkNameElement = link.querySelector('.link-name');
        if (!iconContainer || !linkNameElement) return;

        // Custom logic for golden-red theme icons
        const iconName = linkNameElement.textContent.toLowerCase().replace(/\s+/g, '');
        const customIconPath = `box2/icons/${iconName}.png`; // Assuming custom icons are also in box2/icons
        const fallbackFrame = 'box2/golden_icon_frame.png'; // A golden frame for icons

        const favicon = iconContainer.querySelector('img');

        // Check if a custom icon for the link exists
        const img = new Image();
        img.src = customIconPath;
        img.onload = function() {
            // If custom icon exists, use it as background and hide favicon
            iconContainer.style.backgroundImage = `url('${customIconPath}')`;
            if (favicon) favicon.style.display = 'none';
        }
        img.onerror = function() {
            // If no custom icon, use the golden frame and show the favicon inside
            iconContainer.style.backgroundImage = `url('${fallbackFrame}')`;
            if (favicon) {
                favicon.style.display = 'block';
                favicon.classList.add('favicon'); // Ensure favicon gets proper styling for size/position
            }
        }
    });
}
