const { PrismaClient } = require('@prisma/client');
const express = require('express');
const app = express.Router();
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');


dotenv.config();
app.use(cors());
app.use(express.json({ limit: '20mb' }));


app.post('/saveContent', async (req, res) => {
    const { id, content } = req.body; // รับ id และเนื้อหาจาก request body

    if (!id || !content) {
        return res.status(400).json({ error: 'ID and content are required' });
    }

    try {
        // อัปเดตเนื้อหาในฐานข้อมูล
        const updatedContent = await prisma.content.update({
            where: { id: id }, // ใช้ ID ที่ส่งเข้ามา
            data: {
                text: content, // ใช้ text ฟิลด์จากโมเดล
            },
        });
        res.status(200).json(updatedContent); // ส่งกลับข้อมูลที่อัปเดต
    } catch (error) {
        console.error('Error updating content:', error);
        res.status(500).json({ error: 'Error updating content' });
    }
});
app.get('/getContent', async (req, res) => {
    try {
        const content = await prisma.content.findMany(); // Fetch all content
        res.status(200).json({ results: content }); // Send the fetched content
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Error fetching content' });
    }
});
app.post('/review', async (req, res) => {
    const { userId, comment, image } = req.body; // ลบ createdAt ออก
    try {
        const existingReview = await prisma.review.findFirst({
            where: { userId: userId }
        });

        if (existingReview) {
            // อัปเดตรีวิวที่มีอยู่
            await prisma.review.update({
                where: { id: existingReview.id },
                data: { 
                    comment, 
                    image,
                    createdAt: new Date() // อัปเดต createdAt เป็นเวลาปัจจุบัน
                }
            });
            res.json({ message: 'Review updated successfully' });
        } else {
            // สร้างรีวิวใหม่
            await prisma.review.create({
                data: { 
                    userId, 
                    comment, 
                    image,
                    createdAt: new Date() // ตั้งค่าเวลาสร้างรีวิวใหม่
                }
            });
            res.json({ message: 'Review created successfully' });
        }
    } catch (error) {
        console.error(error); // แสดงข้อผิดพลาดใน console
        res.status(500).json({ error: 'Failed to save the review' });
    }
});

app.get('/getreview', async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            include: {
                user: {
                    select: {
                        First_Name: true, 
                        Last_Name: true,  
                        Profile_Image: true, 
                    },
                },
            },
        });
        res.status(200).json({ results: reviews }); 
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).send({ error: error.message }); 
    }
});

app.delete('/delReview', async (req, res) => {
    const { reviewId } = req.body; // รับ ID ของรีวิวจาก request body

    try {
        // ลบรีวิวที่มี reviewId ตรงกัน
        await prisma.review.delete({
            where: { id: reviewId },
        });

        res.json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete review' });
    }
});




module.exports = app;