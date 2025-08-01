#!/usr/bin/env python3
import re
import sys

def deduplicate_translation_keys():
    file_path = r"C:\EasyMed-TeleHealth\src\translations.ts"
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split content into lines
    lines = content.split('\n')
    
    # Track which language block we're in
    current_language = None
    in_language_block = False
    seen_keys = set()
    result_lines = []
    brace_depth = 0
    
    for line in lines:
        stripped = line.strip()
        
        # Check if we're starting a new language block
        if '[Language.' in line and ']: {' in line:
            current_language = line
            in_language_block = True
            seen_keys.clear()
            brace_depth = 1
            result_lines.append(line)
            continue
            
        # Track brace depth to know when language block ends
        if in_language_block:
            brace_depth += line.count('{') - line.count('}')
            
            if brace_depth == 0:
                in_language_block = False
                current_language = None
                seen_keys.clear()
                result_lines.append(line)
                continue
        
        # If we're in a language block, check for duplicate keys
        if in_language_block and ':' in stripped and not stripped.startswith('//'):
            # Extract key name
            key_match = re.match(r'\s*([^:]+):', line)
            if key_match:
                key_name = key_match.group(1).strip()
                
                # Skip if we've already seen this key
                if key_name in seen_keys:
                    print(f"Removing duplicate key '{key_name}' from {current_language}")
                    continue
                else:
                    seen_keys.add(key_name)
        
        result_lines.append(line)
    
    # Write back to file
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(result_lines))
    
    print("Translation deduplication completed successfully!")

if __name__ == "__main__":
    deduplicate_translation_keys()
