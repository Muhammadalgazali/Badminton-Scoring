const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let player1Score = 0;
let player2Score = 0;
let player1Name = 'Player 1';
let player2Name = 'Player 2';
let player1SubScore = 0;  // Skor kecil tambahan
let player2SubScore = 0;  // Skor kecil tambahan

// Menggunakan folder 'public' untuk menyimpan file statis
app.use(express.static(path.join(__dirname, 'public')));

// Route untuk halaman remote
app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'remote.html'));
});

// Route untuk halaman display
app.get('/display', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    // Kirim skor awal dan nama pemain saat klien terhubung
    socket.emit('scoreUpdate', {
        player1Score,
        player2Score,
        player1Name,
        player2Name,
        player1SubScore,
        player2SubScore
    });

    // Mendengarkan pembaruan skor
    socket.on('updateScore', (data) => {
        if (data.player === 'player1') {
            player1Score += data.value;
            player1SubScore += data.subValue || 0;  // Tambahkan sub-skor
        }
        if (data.player === 'player2') {
            player2Score += data.value;
            player2SubScore += data.subValue || 0;  // Tambahkan sub-skor
        }

        // Kirim skor terbaru ke semua klien
        io.emit('scoreUpdate', {
            player1Score,
            player2Score,
            player1Name,
            player2Name,
            player1SubScore,
            player2SubScore
        });
    });

    // Mendengarkan perubahan nama pemain
    socket.on('changeName', (data) => {
        if (data.player === 'player1') player1Name = data.name;
        if (data.player === 'player2') player2Name = data.name;

        // Kirim nama pemain terbaru ke semua klien
        io.emit('nameUpdate', { player1Name, player2Name });
    });

    // Mendengarkan permintaan reset skor
    socket.on('resetScore', () => {
        player1Score = 0;
        player2Score = 0;
        player1SubScore = 0;
        player2SubScore = 0;
        io.emit('scoreUpdate', {
            player1Score,
            player2Score,
            player1Name,
            player2Name,
            player1SubScore,
            player2SubScore
        });
    });

    // Mendengarkan permintaan untuk menukar posisi skor
    socket.on('swapScores', () => {
        [player1Score, player2Score] = [player2Score, player1Score];
        [player1SubScore, player2SubScore] = [player2SubScore, player1SubScore];
        [player1Name, player2Name] = [player2Name, player1Name];

        io.emit('scoreUpdate', {
            player1Score,
            player2Score,
            player1Name,
            player2Name,
            player1SubScore,
            player2SubScore
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
