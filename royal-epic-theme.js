// royal-epic-theme.js

function applyRoyalEpicTheme() {
    document.body.classList.add('royal-epic-theme');
    document.body.classList.remove('dynamic-theme');
    document.body.style.backgroundImage = "url('royal/background.png')";
}

function setRoyalEpicQuickLinkIcons() {
    const quickLinks = document.querySelectorAll('#quick-links .link-item');
    quickLinks.forEach(link => {
        const iconContainer = link.querySelector('.link-icon');
        const iconName = link.querySelector('.link-name').textContent.toLowerCase().replace(/\s+/g, '');
        const customIconPath = `royal/icons/${iconName}.png`;
        const fallbackIcon = 'royal/icons/empty.png';
        const favicon = iconContainer.querySelector('img');

        const img = new Image();
        img.src = customIconPath;
        img.onload = function() {
            iconContainer.style.backgroundImage = `url('${customIconPath}')`;
            if (favicon) favicon.style.display = 'none';
        }
        img.onerror = function() {
            iconContainer.style.backgroundImage = `url('${fallbackIcon}')`;
            if (favicon) {
                favicon.style.display = 'block';
                favicon.classList.add('favicon');
            }
        }
    });
}