console.log('Claribox content script loaded');

// SVG Icon for the button
const CLARIBOX_ICON = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="2"/>
  <path d="M9 12L11 14L15 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

// Function to inject the button
const injectSidebarButton = () => {
    // Gmail's left sidebar container usually has role="navigation" or specific classes
    // We'll look for the "Inbox" container to find the right place
    const navigation = document.querySelector('[role="navigation"]');
    if (!navigation) return;

    // Check if button already exists
    if (document.getElementById('claribox-gmail-button')) return;

    // Create the button container (mimicking Gmail's style)
    const buttonContainer = document.createElement('div');
    buttonContainer.id = 'claribox-gmail-button';
    buttonContainer.className = 'claribox-nav-item';
    buttonContainer.style.cssText = `
    padding: 0 26px 0 12px;
    height: 32px;
    display: flex;
    align-items: center;
    cursor: pointer;
    color: #202124;
    font-family: 'Google Sans', Roboto, RobotoDraft, Helvetica, Arial, sans-serif;
    font-size: 14px;
    font-weight: 500;
    margin-right: 16px;
    border-radius: 0 16px 16px 0;
    transition: background-color 0.15s;
  `;

    // Hover effect
    buttonContainer.onmouseenter = () => buttonContainer.style.backgroundColor = '#f1f3f4';
    buttonContainer.onmouseleave = () => buttonContainer.style.backgroundColor = 'transparent';

    // Icon
    const iconSpan = document.createElement('span');
    iconSpan.innerHTML = CLARIBOX_ICON;
    iconSpan.style.cssText = `
    margin-right: 18px;
    display: flex;
    align-items: center;
    color: #5f6368;
  `;

    // Text
    const textSpan = document.createElement('span');
    textSpan.innerText = 'Claribox';

    buttonContainer.appendChild(iconSpan);
    buttonContainer.appendChild(textSpan);

    // Click handler
    buttonContainer.onclick = () => {
        // Send message to background to open side panel
        // Note: This requires chrome.sidePanel.open which is available in Chrome 114+
        chrome.runtime.sendMessage({ action: 'openSidePanel' });
    };

    // Insert after the "More" button or at the end of the list
    // Finding the "Labels" separator or just appending to the first main list
    const inboxItem = document.querySelector('[data-tooltip="Inbox"]')?.closest('div[role="tab"]')?.parentElement?.parentElement;

    if (inboxItem && inboxItem.parentElement) {
        // Try to insert after the main list
        inboxItem.parentElement.appendChild(buttonContainer);
    } else {
        // Fallback: append to nav
        navigation.appendChild(buttonContainer);
    }
};

// Observer to handle Gmail's dynamic loading
const observer = new MutationObserver(() => {
    injectSidebarButton();
});

observer.observe(document.body, { childList: true, subtree: true });

// Initial try
setTimeout(injectSidebarButton, 1000);