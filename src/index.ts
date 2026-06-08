import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

const JWT_SECRET = "rova-secret-key";

const authMiddleware = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/register", async (req, res) => {
  const { email, password, phone, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, phone, role },
    });
    res.json({ message: "User created", userId: user.id });
  } catch (error) {
    res.status(400).json({ error: "Email already exists" });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Wrong password" });
    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });
    res.json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/trips/request", authMiddleware, async (req: any, res) => {
  const { pickupLat, pickupLng, dropoffLat, dropoffLng, pickupAddress, dropoffAddress } = req.body;
  try {
    const trip = await prisma.trip.create({
      data: {
        riderId: req.user.userId,
        pickupLat,
        pickupLng,
        dropoffLat,
        dropoffLng,
        pickupAddress,
        dropoffAddress,
      },
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: "Could not create trip" });
  }
});

app.get("/trips/available", authMiddleware, async (req, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { status: "REQUESTED" },
      include: { rider: { select: { email: true, phone: true } } },
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch trips" });
  }
});

app.post("/trips/:id/accept", authMiddleware, async (req: any, res) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: parseInt(req.params.id) },
      data: { driverId: req.user.userId, status: "ACCEPTED" },
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: "Could not accept trip" });
  }
});

app.post("/trips/:id/complete", authMiddleware, async (req, res) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: parseInt(req.params.id) },
      data: { status: "COMPLETED" },
    });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: "Could not complete trip" });
  }
});

app.get("/trips/my", authMiddleware, async (req: any, res) => {
  try {
    const trips = await prisma.trip.findMany({
      where: { riderId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch trips" });
  }
});

app.listen(3000, () => console.log("Rova backend running on port 3000"));