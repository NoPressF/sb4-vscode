const opcodeList = document.getElementById('opcode-list');
const filterInput = document.getElementById('opcode-filter');
const noResultsMessage = document.getElementById('no-results');
const opcodeMatches = document.querySelector('.opcode-matches');
const displayTypeSelect = document.getElementById('display-type-select');
const vscode = acquireVsCodeApi();

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

function setOpcodes(opcodes) {
    opcodeList.innerHTML = opcodes;
    filterOpcodes('');
}

function focusOnInputField() {
    const inputElement = document.getElementById('opcode-filter');
    if (inputElement) {
        inputElement.focus();
    }
}

filterInput.addEventListener('input', (event) => {
    filterOpcodes(event.target.value.toLowerCase());
});

displayTypeSelect.addEventListener('change', function() {
    const selectedDisplayType = this.value;
    vscode.postMessage({
        command: 'updateDisplayType',
        displayType: selectedDisplayType
    });
});

window.addEventListener('load', () => {
    focusOnInputField();
});

window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.command === 'setOpcodes') {
        setOpcodes(message.opcodes);
    }
});