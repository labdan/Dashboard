// royal-epic-theme.js

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
