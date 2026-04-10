with open('features/LiveClassRoom.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact string to replace
old_str = '           <div className="flex items-center gap-5">\n              <button \n                onClick={handleExitSession}\n                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 px-6 py-2.5 rounded-2xl transition-all active:scale-95"\n              >\n                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />\n                <span className="text-[9px] font-black uppercase tracking-widest">Exit Stream</span>\n              </button>\n           </div>'

new_str = '           <div className="flex items-center gap-3">\n              {/* End Class — always visible for scholars */}\n              {userRole === \'scholar\' && (\n                <button\n                  onClick={() => setConfirmEndClass(currentSession.batchId!)}\n                  className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 px-5 py-2.5 rounded-2xl transition-all active:scale-95"\n                >\n                  <XCircle size={16} />\n                  <span className="text-[9px] font-black uppercase tracking-widest">End Class</span>\n                </button>\n              )}\n              <button \n                onClick={handleExitSession}\n                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 px-6 py-2.5 rounded-2xl transition-all active:scale-95"\n              >\n                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />\n                <span className="text-[9px] font-black uppercase tracking-widest">Exit Stream</span>\n              </button>\n           </div>'

# Try LF first
if old_str in content:
    content = content.replace(old_str, new_str, 1)
    with open('features/LiveClassRoom.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("SUCCESS (LF): End Class added to header!")
else:
    # Try CRLF
    old_crlf = old_str.replace('\n', '\r\n')
    new_crlf = new_str.replace('\n', '\r\n')
    if old_crlf in content:
        content = content.replace(old_crlf, new_crlf, 1)
        with open('features/LiveClassRoom.tsx', 'w', encoding='utf-8') as f:
            f.write(content)
        print("SUCCESS (CRLF): End Class added to header!")
    else:
        print("FAILED - string not found")
        # Show what's actually there
        idx = content.find('Exit Stream')
        print("Around Exit Stream:")
        seg = content[idx-500:idx+200]
        # Show first 200 chars safely
        for i, ch in enumerate(seg):
            if i < 500:
                print(repr(ch), end='')
