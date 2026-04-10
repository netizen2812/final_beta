with open('features/TarbiyahLobby.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Join Live button block (lines 362-367)
old_part = 'Join the live session'
new_part = 'Join Live Session'

if old_part in content:
    content = content.replace(old_part, new_part)
    content = content.replace("Join Live Session</div>", "Join Live Session</div>\\n                          <div className=\\\"text-[10px] font-black uppercase tracking-widest opacity-60\\\">Scholar is online now</div>")
    print("SUCCESS: Part 1 replaced.")
else:
    print("FAILED: Part 1 not found.")

# Update the conditional
old_cond = "{batches.some((b: any) => b.status === 'active' && b.activeSessionId) && ("
new_cond = "{(batches.some((b: any) => b.status === 'active' && b.activeSessionId) || currentBatchStatus === 'active') && ("
if old_cond in content:
    content = content.replace(old_cond, new_cond)
    print("SUCCESS: Condition updated.")

# Add pulse
old_cls = 'border-amber-600 shadow-lg'
new_cls = 'border-amber-600 shadow-lg animate-pulse'
if old_cls in content:
    content = content.replace(old_cls, new_cls)
    print("SUCCESS: Pulse added.")

with open('features/TarbiyahLobby.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
