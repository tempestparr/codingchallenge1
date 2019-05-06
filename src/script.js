var readerHealthDict = {};
var selectedReaders = [];
var availReaders = [];
var availOperations = [];
var errorCount = 0;
var warningCount = 0;
var selectedOp = '';
const table = document.querySelector('#readers');
const startBtn = document.querySelector('#start');
const opsBtn = document.querySelector('#dropdownMenuButton');
const warningMsg = document.querySelector('#warningMsg');
const errorMsg = document.querySelector('#errorMsg');

$(document).ready(function () {
    $.getJSON("/health", data => {
        data.forEach(element => {
            readerHealthDict[element.reader] = element.status + ": " + element.message
        });
    })
        .then(() => {
            $.getJSON("/readers", data => {
                data.forEach(reader => {
                    availReaders.push(reader);
                });
            })
                .then(() => {
                    // need data from health and readers json files
                    // before creating a table
                    initializeReadersTable();
                });
        });

    $.getJSON("/operations", data => {
        data.forEach(op => {
            availOperations.push(op);
        });
    })
        .then(() => {
            // need data from operations json file before
            // populating the dropdown
            initializeOperationsDropdown();
        });
});

function initializeOperationsDropdown() {
    var opsContent = '';
    availOperations.forEach(op => {
        opsContent += ` <a id="${op}" class="dropdown-item" href="#"> ${op} </a> `;
    });
    $('#operations').html(opsContent);
    // add event listener to each dropdown item after they have been added
    var items = document.querySelectorAll('.dropdown-item');
    items.forEach(i => {
        i.addEventListener('click', processOperationSelection)
    });
}

function initializeReadersTable() {
    var tableContents = '<table class="table table-bordered table-hover">';
    tableContents += '<thead><tr><th></th><th>Name:</th><th>Type:</th><th>Address:</th><th>Health</th></tr></thead>';
    tableContents += '<tbody>'
    availReaders.forEach(reader => {
        tableContents += `<tr><td><input id="${reader.name}" type="checkbox" class="select"></td>`;
        tableContents += `<td> ${reader.name} </td>`;
        tableContents += `<td> ${reader.type} </td>`;
        tableContents += `<td> ${reader.address} </td>`;
        if (reader.name in readerHealthDict) {
            tableContents += `<td> ${readerHealthDict[reader.name]} </td>`;
        } else {
            tableContents += `<td> </td>`;
        }
        tableContents += '</tr>';
    });
    tableContents += '</tbody></table>';
    $("#readers").html(tableContents);
}

// checkbox event handler
function processRowSelection(e) {
    // add the selected reader to the list of readers
    if (!e.target.matches('input[type="checkbox"]')) return;
    const element = e.target;
    if (element.checked) {
        selectedReaders.push(element.id);
    } else {
        var index = selectedReaders.indexOf(element.id);
        selectedReaders.splice(index, 1);
    }
    // adjust error and warning counters
    if (element.id in readerHealthDict) {
        const health = readerHealthDict[element.id];
        if (health.includes("ERROR")) {
            element.checked ? errorCount++ : errorCount--;
        } else if (health.includes("WARNING")) {
            element.checked ? warningCount++ : warningCount--;
        }
    }
    // disable/enable start button and show/hide a warning message
    startBtn.disabled = errorCount > 0 ? true : false;
    warningMsg.hidden = warningCount > 0 ? false : true;
}

// dropdown operation event handler
function processOperationSelection(e) {
    opsBtn.innerHTML = ` Operation: ${e.target.id} `;
    selectedOp = e.target.id;
}

// start job button event handler
function startJob() {
    // stop readers with errors from running jobs
    if (errorCount > 0) {
        return;
    }
    var req = JSON.stringify({ operation: selectedOp, readers: selectedReaders });
    $.ajax({
        type: "POST",
        url: "/jobs",
        data: req,
        contentType: 'application/json',
        success:
            // hide error msg and show success msg and start timer
            function () {
                $('#errorMsg').hide();
                $('#successMsg').show();
                setTimeout(function () {
                    $('#successMsg').fadeOut();
                }, 3000);
            },
        error:
            // hide success msg and show error msg and start timer
            function (jqXHR, textStatus, errorThrown) {
                errorMsg.innerHTML = ` Job Failed. ${jqXHR.responseText}. `;
                $('#successMsg').hide();
                $('#errorMsg').show();
                setTimeout(function () {
                    $('#errorMsg').fadeOut();
                }, 3000);
            }
    });
}

table.addEventListener('click', processRowSelection);
startBtn.addEventListener('click', startJob);
