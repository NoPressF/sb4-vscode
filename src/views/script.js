const opcodeList = document.getElementById('opcode-list');
const filterInput = document.getElementById('opcode-filter');
const noResultsMessage = document.getElementById('no-results');
const opcodeMatches = document.querySelector('.opcode-matches');
const searchDisplayType = document.getElementById('search-display-type');
const vscode = acquireVsCodeApi();

let lastSearchText = '';

function filterOpcodes(searchText) {
    const items = opcodeList.querySelectorAll('.opcode-item');
    let visibleItemsCount = 0;

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchText)) {
            item.style.display = 'block';
            visibleItemsCount++;
        } else {
            item.style.display = 'none';
        }

        item.addEventListener('contextmenu', () => {
            const textToCopy = item.textContent;
            navigator.clipboard.writeText(textToCopy);
        });
    });

    if (visibleItemsCount === 0) {
        opcodeList.style.display = 'none';
        noResultsMessage.style.display = 'block';
        opcodeMatches.style.display = 'none';
    } else {
        opcodeList.style.display = 'block';
        noResultsMessage.style.display = 'none';
        opcodeMatches.style.display = 'inline';
        opcodeMatches.textContent = `Matches: ${visibleItemsCount}`;
    }
}

function updateOpcodes(opcodes) {
    opcodeList.innerHTML = opcodes;
    filterOpcodes(lastSearchText);
}

function focusOnInputField() {
    const inputElement = document.getElementById('opcode-filter');
    if (inputElement) {
        inputElement.focus();
    }
}

filterInput.addEventListener('input', (event) => {
    lastSearchText = event.target.value.toLowerCase();
    filterOpcodes(lastSearchText);
});

searchDisplayType.addEventListener('change', function () {
    const type = this.value;
    vscode.postMessage({
        command: 'updateSearchType',
        type: type
    });
});

window.addEventListener('load', () => {
    focusOnInputField();
});

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'updateOpcodes') {
        updateOpcodes(message.content);
    }
});