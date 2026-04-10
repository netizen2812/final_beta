with open('features/LiveClassRoom.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add ID to Student Quran container
old_std = 'className="w-full h-full bg-[#fdfaf3] rounded-[3.5rem] overflow-y-auto no-scrollbar shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-black/5 relative"'
new_std = 'id="quran-reading-container" className="w-full h-full bg-[#fdfaf3] rounded-[3.5rem] overflow-y-auto no-scrollbar shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-black/5 relative"'

if old_std in content:
    content = content.replace(old_std, new_std)
    print("SUCCESS: Student container ID added.")
else:
    print("FAILED: Student container string not found.")

# Add ID to Scholar Quran container
old_sch = 'className="w-full h-full bg-[#fdfaf3] rounded-[3.5rem] overflow-y-auto no-scrollbar shadow-2xl border border-black/5 relative"'
new_sch = 'id="quran-reading-container" className="w-full h-full bg-[#fdfaf3] rounded-[3.5rem] overflow-y-auto no-scrollbar shadow-2xl border border-black/5 relative"'

if old_sch in content:
    content = content.replace(old_sch, new_sch)
    print("SUCCESS: Scholar container ID added.")
else:
    print("FAILED: Scholar container string not found.")

with open('features/LiveClassRoom.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
