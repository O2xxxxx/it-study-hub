import io, re
p = r'db/seed.sql'
s = io.open(p, encoding='utf-8').read()
s = s.replace("'回答《唯一索引并发下仍然插入两条，为什么》',               'answer',  6,", "'回答《唯一索引并发下仍然插入两条，为什么》',               'answer',  4,")
s = s.replace("'回答《React 18 里 useEffect 执行两次是 bug 吗》',          'answer',  6,", "'回答《React 18 里 useEffect 执行两次是 bug 吗》',          'answer',  6,")
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
for line in s.splitlines():
    if 'ANSWER_REWARD' in line: print(line.strip()[:70], '...', line.strip()[-30:])
