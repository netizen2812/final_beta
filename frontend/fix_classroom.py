with open('features/LiveClassRoom.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Reset states on join
old_join = 'onJoinSession={setCurrentSession}'
new_join = 'onJoinSession={(session) => {\r\n          setShowLeaderboard(false);\r\n          setActiveDrawer(\'none\');\r\n          setCurrentSession(session);\r\n       }}'

if old_join in content:
    content = content.replace(old_join, new_join)
    print("SUCCESS: Joyin reset logic updated.")
else:
    # Try with spaces
    old_join_lf = old_join.replace('\r\n', '\n')
    if old_join_lf in content:
        content = content.replace(old_join_lf, new_join.replace('\r\n', '\n'))
        print("SUCCESS (LF): Joint reset logic updated.")
    else:
        print("FAILED: Join reset logic not found.")

# 2. Harden header check
old_header = "{userRole === 'scholar' && ("
new_header = "{(userRole === 'scholar' || user?.primaryEmailAddress?.emailAddress?.toLowerCase() === \"scholar1.imam@gmail.com\") && ("

if old_header in content:
    content = content.replace(old_header, new_header)
    print("SUCCESS: Header check hardened.")
else:
    print("FAILED: Header check not found.")

with open('features/LiveClassRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
