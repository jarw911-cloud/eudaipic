require('dotenv').config(); // Membuka file .env
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

const app = express();
// Mengambil port dari server hosting, atau pakai 3000 kalau di lokal
const port = process.env.PORT || 3000; 

const upload = multer({ storage: multer.memoryStorage() });

app.use(express.static(path.join(__dirname, 'public')));

// --- ENDPOINT 1: KOMPRESI (TETAP) ---
app.post('/api/compress', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Tidak ada gambar yang diunggah.' });
        
        const quality = parseInt(req.body.quality) || 80;
        const compressedImageBuffer = await sharp(req.file.buffer)
            .jpeg({ quality: quality, force: false })
            .webp({ quality: quality, force: false })
            .png({ quality: quality, force: false })
            .toBuffer();

        res.set('Content-Type', req.file.mimetype);
        res.send(compressedImageBuffer);
    } catch (error) {
        console.error('Kesalahan kompresi:', error);
        res.status(500).json({ error: 'Gagal mengompres gambar.' });
    }
});

// --- ENDPOINT 2: HAPUS BG (BARU) ---
app.post('/api/removebg', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Tidak ada gambar yang diunggah.' });

        // Siapkan data untuk dikirim ke Remove.bg
        const formData = new FormData();
        formData.append('image_file', req.file.buffer, { filename: req.file.originalname });
        formData.append('size', 'auto');

        // Kirim ke Remove.bg secara sembunyi-sembunyi dari server
        const response = await axios.post('https://api.remove.bg/v1.0/removebg', formData, {
            headers: {
                ...formData.getHeaders(),
                'X-Api-Key': process.env.REMOVE_BG_API_KEY // Ambil kunci rahasia dari brankas
            },
            responseType: 'arraybuffer' // Penting agar file gambar tidak rusak
        });

        // Kirim hasilnya kembali ke layar Kang Mas
        res.set('Content-Type', 'image/png');
        res.send(response.data);

    } catch (error) {
        console.error('Error Remove BG:', error.response?.data || error.message);
        res.status(500).json({ error: 'Gagal menghapus background dari server.' });
    }
});

app.listen(port, () => {
    console.log(`🚀 EudaiPic Server berjalan aman di port ${port}`);
});