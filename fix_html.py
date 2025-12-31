#!/usr/bin/env python3

import re

# Read file
with open('public/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix 1: Add global invoices variable after resultsDiv
content = content.replace(
    'const resultsDiv = document.getElementById("results");',
    'const resultsDiv = document.getElementById("results");\n    let currentInvoices = [];'
)

# Fix 2: Remove grid-column span from Inspection Notes
content = content.replace(
    '<div style="grid-column: 1 / -1;">',
    '<div>'
)

# Fix 3: Store invoices in displayResults function
content = content.replace(
    'async function displayResults(searchData) {\n      const { invoices, deals } = searchData;',
    'async function displayResults(searchData) {\n      const { invoices, deals } = searchData;\n      currentInvoices = invoices || [];'
)

# Fix 4: Update save handler to use currentInvoices
# Replace "if (invoices && invoices.length > 0)" with "if (currentInvoices && currentInvoices.length > 0)"
content = re.sub(
    r'if \(invoices && invoices\.length > 0\) \{',
    'if (currentInvoices && currentInvoices.length > 0) {',
    content
)

# Fix 5: Replace "invoices.forEach(inv =>" with "currentInvoices.forEach(inv =>"
content = re.sub(
    r'invoices\.forEach\(inv =>',
    'currentInvoices.forEach(inv =>',
    content
)

# Write file
with open('public/index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print('✅ All fixes applied successfully!')
print('- Added global currentInvoices variable')
print('- Removed grid-column span from Inspection Notes (now in same row)')
print('- Updated save handler to use currentInvoices')
