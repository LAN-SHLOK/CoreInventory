filepath = r'c:\Project\CoreInventory\core_api\identity\views.py'
with open(filepath, 'r') as f:
    lines = f.readlines()

new_lines = []

for i, line in enumerate(lines):
    # Line numbers in output are 1-indexed. Index in loop is 0-indexed.
    # Line 102 is index 101
    if i == 101 and 'try:' in line:
        # Skip the duplicate inner try statement
        print(f"Skipping inner try at line {i+1}")
        continue
        
    # Lines 103 to 206 (indices 102 to 205) need 4 spaces of extra indentation
    # so they fall under the outer try: block that begins at line 84
    if 102 <= i <= 205:
        new_lines.append('    ' + line)
    else:
        new_lines.append(line)

with open(filepath, 'w') as f:
    f.writelines(new_lines)

print("Indentation fixed successfully!")
