cd '/e/JavaEE lastwork'
MYSQL=.tools/mysql-8.0.29-winx64/bin/mysql.exe
DUMP=.tools/mysql-8.0.29-winx64/bin/mysqldump.exe
$DUMP --protocol=TCP -h127.0.0.1 -P3307 -uroot --databases itstudy --skip-comments > .tools/itstudy-dump.sql 2>/dev/null
$MYSQL --protocol=TCP -h127.0.0.1 -P3307 -uroot -e "DROP DATABASE IF EXISTS itstudy_test; CREATE DATABASE itstudy_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
python - <<'PY'
import io
Q = chr(96)
p = '.tools/itstudy-dump.sql'
s = io.open(p, encoding='utf-8').read()
s = s.replace(Q + 'itstudy' + Q, Q + 'itstudy_test' + Q)
io.open(p, 'w', encoding='utf-8', newline='\n').write(s)
print('renamed db ok')
PY
$MYSQL --protocol=TCP -h127.0.0.1 -P3307 -uroot < .tools/itstudy-dump.sql 2>/dev/null
$MYSQL --protocol=TCP -h127.0.0.1 -P3307 -uroot -N -e "select count(*) from itstudy_test.users; select count(*) from itstudy_test.answers;" 2>/dev/null