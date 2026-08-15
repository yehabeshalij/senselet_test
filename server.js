import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";
import express from 'express';
import cors from 'cors';
const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());
// ----------------------------------------------------------------------
// 1. QUICK EXPENSE TRACKER APIs (የወጪ መቆጣጠሪያ)
// ----------------------------------------------------------------------
// ሁሉንም ወጪዎች ማምጫ (GET)
app.get('/api/expenses', async (req, res) => {
    try {
        const expenses = await prisma.quickExpense.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(expenses);
    }
    catch (error) {
        console.error("❌ ወጪዎችን ለማምጣት ስህተት፦", error);
        res.status(500).json({ error: 'ወጪዎችን ማምጣት አልተቻለም' });
    }
});
// አዲስ ወጪ መመዝገቢያ (POST)
app.post('/api/expenses', async (req, res) => {
    const { title, reason, amount, category, registeredBy, notes } = req.body;
    try {
        const newExpense = await prisma.quickExpense.create({
            data: {
                id: crypto.randomUUID(),
                title: title || reason || "ያልተጠቀሰ ወጪ",
                amount: Number(amount),
                category: category || "መደበኛ",
                registeredBy: registeredBy || "ያልተጠቀሰ",
                notes: notes || "",
            },
        });
        res.status(201).json(newExpense);
    }
    catch (error) {
        console.error("❌ ወጪ ለመመዝገብ ስህተት፦", error);
        res.status(500).json({ error: "ወጪውን መዝግቦ መያዝ አልተቻለም!" });
    }
});
// 🗑️ ብድር ሲመለስ ከዳታቤዝ ማጥፊያ (DELETE)
app.delete('/api/expenses/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const deletedExpense = await prisma.quickExpense.delete({
            where: { id: id },
        });
        res.json({ message: "በተሳካ ሁኔታ ተሰርዟል", deletedExpense });
    }
    catch (error) {
        console.error("❌ ወጪን ከዳታቤዝ ለማጥፋት ስህተት፦", error);
        res.status(500).json({ error: "ወጪውን ከዳታቤዝ ማጥፋት አልተቻለም!" });
    }
});
// ----------------------------------------------------------------------
// 2. MERCHANT STATUS CENTER APIs
// ----------------------------------------------------------------------
app.get('/api/merchants-status', async (req, res) => {
    try {
        const merchants = await prisma.merchantStatus.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(merchants);
    }
    catch (error) {
        res.status(500).json({ error: 'የነጋዴዎችን ዳታ ማምጣት አልተቻለም' });
    }
});
app.post('/api/merchants-status', async (req, res) => {
    const { merchantName, phoneNumber, goodsDescription, status } = req.body;
    try {
        const newMerchant = await prisma.merchantStatus.create({
            data: {
                id: crypto.randomUUID(),
                merchantName,
                phoneNumber,
                goodsDescription,
                status: status || 'pending',
            },
        });
        res.status(201).json(newMerchant);
    }
    catch (error) {
        res.status(500).json({ error: 'የነጋዴ ስታተስ መመዝገብ አልተቻለም' });
    }
});
app.patch('/api/merchants-status/:id', async (req, res) => {
    const { id } = req.params;
    const { status, smsSent } = req.body;
    try {
        const updatedMerchant = await prisma.merchantStatus.update({
            where: { id },
            data: {
                ...(status && { status }),
                ...(smsSent !== undefined && { smsSent }),
            },
        });
        res.json(updatedMerchant);
    }
    catch (error) {
        res.status(500).json({ error: 'ስታተሱን ማዘመን አልተቻለም' });
    }
});
// ----------------------------------------------------------------------
// 3. SERVER START
// ----------------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 ሰንሰለት ሰርቨር በፖርት ${PORT} ላይ ስራ ጀምሯል!`);
});