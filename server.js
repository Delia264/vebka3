const http = require('http');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const PORT = 3000;

// Подключение к базе данных
const dbPath = path.join(__dirname, 'blyha scoro 30.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('Подключено к базе данных:', dbPath);
    }
});

const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    // Обработка API запросов
    if (req.url === '/api/login' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const { username, password } = JSON.parse(body);
                
                // Поиск пользователя в базе данных
                const query = 'SELECT * FROM users WHERE pohta = ? AND parol = ?';
                
                db.get(query, [username, password], (err, row) => {
                    if (err) {
                        console.error('Ошибка базы данных:', err.message);
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: 'Ошибка базы данных' }));
                        return;
                    }
                    
                    if (row) {
                        // Проверка на администратора (polozhenie = 'sverxy')
                        const isAdmin = row.polozhenie === 'sverxy' || row.isAdmin === 1;
                        
                        res.writeHead(200, { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(JSON.stringify({
                            success: true,
                            user: {
                                imya: row.imya,
                                polozhenie: row.polozhenie,
                                pohta: row.pohta,
                                isAdmin: isAdmin
                            }
                        }));
                    } else {
                        res.writeHead(401, { 
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        });
                        res.end(JSON.stringify({ success: false, error: 'Неверный лин или пароль' }));
                    }
                });
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Неверный формат данных' }));
            }
        });
        return;
    }
    
    // Обработка статических файлов
    let filePath = req.url === '/' ? '/front/index.html' : req.url;

    // Убираем query параметры
    filePath = filePath.split('?')[0];

    const fullPath = path.join(__dirname, filePath);
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('Файл не найден');
            } else {
                res.writeHead(500);
                res.end('Ошибка сервера: ' + err.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log('Нажмите Ctrl+C для остановки');
});
