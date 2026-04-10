import os

def clean_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove excessive newlines (keep at most 1 empty line between blocks)
    new_lines = []
    prev_empty = False
    for line in lines:
        is_empty = not line.strip()
        if is_empty:
            if not prev_empty:
                new_lines.append(line)
                prev_empty = True
        else:
            new_lines.append(line)
            prev_empty = False
            
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"SUCCESS: {path} normalized.")

clean_file('features/LiveClassRoom.tsx')
clean_file('features/TarbiyahLobby.tsx')
clean_file('features/QuranPage.tsx')
