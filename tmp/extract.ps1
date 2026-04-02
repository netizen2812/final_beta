$lines = Get-Content c:\Users\acer\Downloads\FaithTech\FaithTech\frontend\features\LiveClassRoom.tsx; 
$out = $lines[739..1122]; # Index 739 is line 740
$out | Set-Content /tmp/extracted_block.tsx
