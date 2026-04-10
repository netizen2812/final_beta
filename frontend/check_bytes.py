def check_bytes(path, start_line, end_line):
    with open(path, 'rb') as f:
        lines = f.readlines()
    
    print(f"--- Bytes for {path} (Lines {start_line}-{end_line}) ---")
    for i in range(start_line-1, min(end_line, len(lines))):
        print(f"Line {i+1}: {repr(lines[i])}")

check_bytes('features/LiveClassRoom.tsx', 870, 885)
check_bytes('features/TarbiyahLobby.tsx', 360, 375)
