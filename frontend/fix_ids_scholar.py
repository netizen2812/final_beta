with open('features/LiveClassRoom.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ID to Scholar target div (line 473 area)
old_sch = 'className="flex-1 bg-[#fdfaf3] rounded-[3rem] border border-black/5 shadow-2xl overflow-y-auto custom-scrollbar relative group flex flex-col md:flex-1 animate-in slide-in-from-right duration-700"'
new_sch = 'id="quran-reading-container" className="flex-1 bg-[#fdfaf3] rounded-[3rem] border border-black/5 shadow-2xl overflow-y-auto custom-scrollbar relative group flex flex-col md:flex-1 animate-in slide-in-from-right duration-700"'

if old_sch in content:
    content = content.replace(old_sch, new_sch)
    print("SUCCESS: Scholar container ID added.")
else:
    print("FAILED: Scholar container string not found.")
    # Show what's actually there
    idx = content.find('Monitoring Student Quran')
    if idx != -1:
        start_idx = content.rfind('<div', 0, idx)
        print("Actual div start:", repr(content[start_idx:idx]))

with open('features/LiveClassRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
