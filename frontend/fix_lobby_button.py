with open('features/TarbiyahLobby.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Update Join Live button in portal
old_btn = "                  {batches.some((b: any) => b.status === 'active' && b.activeSessionId) && (\r\n                    <button onClick={() => { setShowJoinChoice(false); handleJoinLive(); }} className=\"flex items-center gap-4 p-5 rounded-2xl transition-all group border-b-4 bg-amber-500 hover:bg-amber-400 text-amber-950 border-amber-600 shadow-lg\">\r\n                       <div className=\"bg-white/20 p-3 rounded-xl\"><Users size={24} /></div>\r\n                       <div className=\"text-left font-bold text-lg\">Join the live session</div>\r\n                    </button>\r\n                  )}"

new_btn = """                  {(batches.some((b: any) => b.status === 'active' && b.activeSessionId) || currentBatchStatus === 'active') && (
                    <button onClick={() => { setShowJoinChoice(false); handleJoinLive(); }} className="flex items-center gap-4 p-5 rounded-2xl transition-all group border-b-4 bg-amber-500 hover:bg-amber-400 text-amber-950 border-amber-600 shadow-lg animate-pulse">
                       <div className="bg-white/20 p-3 rounded-xl"><Users size={24} /></div>
                       <div className="text-left">
                          <div className="font-bold text-lg">Join Live Session</div>
                          <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Scholar is online now</div>
                       </div>
                    </button>
                  )}"""

if old_btn in content:
    content = content.replace(old_btn, new_btn)
    print("SUCCESS: Join Live button updated.")
else:
    # Try LF
    old_btn_lf = old_btn.replace('\r\n', '\n')
    if old_btn_lf in content:
        content = content.replace(old_btn_lf, new_btn)
        print("SUCCESS (LF): Join Live button updated.")
    else:
        print("FAILED: Join Live button string not found.")

with open('features/TarbiyahLobby.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
